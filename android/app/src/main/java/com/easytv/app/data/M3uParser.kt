package com.easytv.app.data

import com.easytv.app.model.Channel
import java.util.regex.Pattern

object M3uParser {
    private val TVG_ID_REGEX = Pattern.compile("tvg-id=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)
    private val TVG_LOGO_REGEX = Pattern.compile("tvg-logo=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)
    private val GROUP_TITLE_REGEX = Pattern.compile("group-title=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)
    private val TVG_COUNTRY_REGEX = Pattern.compile("tvg-country=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE)

    fun parse(content: String, maxChannels: Int = 1000): List<Channel> {
        val channels = mutableListOf<Channel>()
        val lines = content.lines()

        var currentName = ""
        var currentLogo = ""
        var currentGroup = "General"
        var currentCountry = "US"
        var currentId = ""

        for (line in lines) {
            val trimmed = line.trim()
            if (trimmed.isEmpty()) continue

            if (trimmed.startsWith("#EXTINF:", ignoreCase = true)) {
                currentId = matchRegex(TVG_ID_REGEX, trimmed)
                currentLogo = matchRegex(TVG_LOGO_REGEX, trimmed)
                currentGroup = matchRegex(GROUP_TITLE_REGEX, trimmed).ifEmpty { "General" }
                currentCountry = matchRegex(TVG_COUNTRY_REGEX, trimmed).ifEmpty { "US" }

                val lastCommaIndex = trimmed.lastIndexOf(',')
                currentName = if (lastCommaIndex != -1 && lastCommaIndex < trimmed.length - 1) {
                    trimmed.substring(lastCommaIndex + 1).trim()
                } else {
                    currentId.ifEmpty { "Live Channel" }
                }
            } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                if (currentName.isNotEmpty()) {
                    val id = currentId.ifEmpty { currentName.lowercase().replace("[^a-z0-9]".toRegex(), "-") }
                    channels.add(
                        Channel(
                            id = id,
                            name = currentName,
                            logo = currentLogo,
                            url = trimmed,
                            group = currentGroup,
                            country = currentCountry
                        )
                    )
                    currentName = ""
                    if (channels.size >= maxChannels) break
                }
            }
        }

        return channels
    }

    private fun matchRegex(pattern: Pattern, input: String): String {
        val matcher = pattern.matcher(input)
        return if (matcher.find()) matcher.group(1)?.trim() ?: "" else ""
    }
}
