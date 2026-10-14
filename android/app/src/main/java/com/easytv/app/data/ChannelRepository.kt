package com.easytv.app.data

import android.content.Context
import com.easytv.app.model.Channel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class ChannelRepository(private val context: Context) {

    private val prefs = context.getSharedPreferences("easytv_prefs", Context.MODE_PRIVATE)

    companion object {
        const val KEY_CACHED_M3U = "cached_m3u_content"
        const val KEY_LAST_UPDATE = "last_catalogue_update"
        const val DEFAULT_PLAYLIST_URL = "https://iptv-org.github.io/iptv/categories/news.m3u"

        val FALLBACK_CHANNELS = listOf(
            Channel(
                id = "nasa-tv",
                name = "NASA TV Live (HD)",
                logo = "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg",
                url = "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
                group = "Science",
                country = "US"
            ),
            Channel(
                id = "bloomberg-us",
                name = "Bloomberg TV News",
                logo = "https://upload.wikimedia.org/wikipedia/commons/5/53/Bloomberg_News_logo.svg",
                url = "https://liveprodupmx.akamaized.net/us/Channel-UPMX-US-HLS/master.m3u8",
                group = "News",
                country = "US"
            ),
            Channel(
                id = "france-24-en",
                name = "France 24 English",
                logo = "https://upload.wikimedia.org/wikipedia/commons/5/5a/France_24_logo.svg",
                url = "https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8",
                group = "News",
                country = "FR"
            ),
            Channel(
                id = "sky-news-uk",
                name = "Sky News Live",
                logo = "https://upload.wikimedia.org/wikipedia/commons/b/b8/Sky_News_2020.svg",
                url = "https://linear417-gb-dash1-prd-cf.cdn.sky.com/instances/1/41701/manifest.m3u8",
                group = "News",
                country = "UK"
            )
        )
    }

    suspend fun getChannels(forceRefresh: Boolean = false): List<Channel> = withContext(Dispatchers.IO) {
        val cached = prefs.getString(KEY_CACHED_M3U, null)

        if (!forceRefresh && !cached.isNullOrEmpty()) {
            val parsed = M3uParser.parse(cached)
            if (parsed.isNotEmpty()) {
                return@withContext parsed
            }
        }

        try {
            val url = URL(DEFAULT_PLAYLIST_URL)
            val connection = url.openConnection() as HttpURLConnection
            connection.connectTimeout = 12000
            connection.readTimeout = 12000
            connection.setRequestProperty("User-Agent", "EasyTV-FireTV/1.0")

            if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                val reader = BufferedReader(InputStreamReader(connection.inputStream))
                val content = reader.readText()
                reader.close()

                if (content.contains("#EXTM3U")) {
                    prefs.edit()
                        .putString(KEY_CACHED_M3U, content)
                        .putLong(KEY_LAST_UPDATE, System.currentTimeMillis())
                        .apply()

                    val parsed = M3uParser.parse(content)
                    if (parsed.isNotEmpty()) {
                        return@withContext parsed
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Return cached or fallback
        if (!cached.isNullOrEmpty()) {
            val parsed = M3uParser.parse(cached)
            if (parsed.isNotEmpty()) return@withContext parsed
        }

        FALLBACK_CHANNELS
    }

    fun getFavorites(): Set<String> {
        return prefs.getStringSet("favorites", emptySet()) ?: emptySet()
    }

    fun toggleFavorite(channelId: String) {
        val favs = getFavorites().toMutableSet()
        if (favs.contains(channelId)) favs.remove(channelId) else favs.add(channelId)
        prefs.edit().putStringSet("favorites", favs).apply()
    }
}
