package com.easytv.app.ui

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.easytv.app.R
import com.easytv.app.model.Channel

class PlayerActivity : AppCompatActivity() {

    private var player: ExoPlayer? = null
    private lateinit var playerView: PlayerView
    private lateinit var progressBar: ProgressBar
    private lateinit var channelTitle: TextView
    private lateinit var errorOverlay: View
    private lateinit var errorText: TextView

    private var currentChannel: Channel? = null
    private var channelList: ArrayList<Channel> = arrayListOf()
    private var currentIndex: Int = 0

    companion object {
        const val EXTRA_CHANNEL = "extra_channel"
        const val EXTRA_CHANNEL_LIST = "extra_channel_list"
        const val EXTRA_CURRENT_INDEX = "extra_current_index"

        fun start(context: Context, channel: Channel, channels: List<Channel>, index: Int) {
            val intent = Intent(context, PlayerActivity::class.java).apply {
                putExtra(EXTRA_CHANNEL, channel)
                putExtra(EXTRA_CHANNEL_LIST, ArrayList(channels))
                putExtra(EXTRA_CURRENT_INDEX, index)
            }
            context.startActivity(intent)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player)

        playerView = findViewById(R.id.playerView)
        progressBar = findViewById(R.id.progressBar)
        channelTitle = findViewById(R.id.tvChannelTitle)
        errorOverlay = findViewById(R.id.errorOverlay)
        errorText = findViewById(R.id.tvError)

        currentChannel = intent.getSerializableExtra(EXTRA_CHANNEL) as? Channel
        @Suppress("UNCHECKED_CAST")
        channelList = (intent.getSerializableExtra(EXTRA_CHANNEL_LIST) as? ArrayList<Channel>) ?: arrayListOf()
        currentIndex = intent.getIntExtra(EXTRA_CURRENT_INDEX, 0)

        initPlayer()
    }

    private fun initPlayer() {
        val channel = currentChannel ?: return

        channelTitle.text = channel.name
        progressBar.visibility = View.VISIBLE
        errorOverlay.visibility = View.GONE

        player?.release()
        player = ExoPlayer.Builder(this)
            .setSeekBackIncrementMs(10000)
            .setSeekForwardIncrementMs(10000)
            .build()
            .apply {
                setMediaItem(MediaItem.fromUri(channel.url))
                prepare()
                playWhenReady = true

                addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(state: Int) {
                        when (state) {
                            Player.STATE_BUFFERING -> progressBar.visibility = View.VISIBLE
                            Player.STATE_READY -> progressBar.visibility = View.GONE
                            Player.STATE_ENDED -> progressBar.visibility = View.GONE
                            Player.STATE_IDLE -> Unit
                        }
                    }

                    override fun onPlayerError(error: PlaybackException) {
                        progressBar.visibility = View.GONE
                        errorOverlay.visibility = View.VISIBLE
                        errorText.text = "Broadcast stream is currently unavailable. Press Next Channel."
                    }
                })
            }

        playerView.player = player
        playerView.resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
    }

    private fun switchChannel(next: Boolean) {
        if (channelList.isEmpty()) return
        currentIndex = if (next) {
            (currentIndex + 1) % channelList.size
        } else {
            if (currentIndex - 1 < 0) channelList.size - 1 else currentIndex - 1
        }
        currentChannel = channelList[currentIndex]
        initPlayer()
        Toast.makeText(this, "Playing: ${currentChannel?.name}", Toast.LENGTH_SHORT).show()
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        when (keyCode) {
            // Fire TV Remote Center D-Pad / Play-Pause
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                player?.let {
                    if (it.isPlaying) it.pause() else it.play()
                }
                return true
            }
            // Channel Switcher
            KeyEvent.KEYCODE_CHANNEL_UP,
            KeyEvent.KEYCODE_PAGE_UP -> {
                switchChannel(next = true)
                return true
            }
            KeyEvent.KEYCODE_CHANNEL_DOWN,
            KeyEvent.KEYCODE_PAGE_DOWN -> {
                switchChannel(next = false)
                return true
            }
            // Aspect ratio toggle with Menu button
            KeyEvent.KEYCODE_MENU -> {
                val nextMode = if (playerView.resizeMode == AspectRatioFrameLayout.RESIZE_MODE_FIT) {
                    AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                } else {
                    AspectRatioFrameLayout.RESIZE_MODE_FIT
                }
                playerView.resizeMode = nextMode
                val label = if (nextMode == AspectRatioFrameLayout.RESIZE_MODE_ZOOM) "Fill Mode (Zoomed)" else "Original Fit Mode"
                Toast.makeText(this, label, Toast.LENGTH_SHORT).show()
                return true
            }
            // Back button exits player to channel grid
            KeyEvent.KEYCODE_BACK -> {
                finish()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onPause() {
        super.onPause()
        player?.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        player?.release()
        player = null
    }
}
