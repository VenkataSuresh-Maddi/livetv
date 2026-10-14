package com.easytv.app.ui

import android.os.Bundle
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.easytv.app.R
import com.easytv.app.data.ChannelRepository
import com.easytv.app.model.Channel
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var repository: ChannelRepository
    private lateinit var recyclerView: RecyclerView
    private lateinit var progressBar: ProgressBar
    private lateinit var tvStatus: TextView
    private lateinit var adapter: ChannelAdapter

    private var allChannels: List<Channel> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        repository = ChannelRepository(this)

        recyclerView = findViewById(R.id.recyclerView)
        progressBar = findViewById(R.id.progressBar)
        tvStatus = findViewById(R.id.tvStatus)

        // 4 columns on Fire TV 10-foot screen
        recyclerView.layoutManager = GridLayoutManager(this, 4)
        adapter = ChannelAdapter { channel, index ->
            PlayerActivity.start(this, channel, allChannels, index)
        }
        recyclerView.adapter = adapter

        loadChannels()
    }

    private fun loadChannels(forceRefresh: Boolean = false) {
        progressBar.visibility = View.VISIBLE
        tvStatus.text = "Loading Free TV Channels..."

        lifecycleScope.launch {
            try {
                val channels = repository.getChannels(forceRefresh)
                allChannels = channels
                progressBar.visibility = View.GONE
                tvStatus.text = "EasyTV: ${channels.size} Channels Available. Use Remote to Select."
                adapter.submitList(channels)
            } catch (e: Exception) {
                progressBar.visibility = View.GONE
                tvStatus.text = "Offline Mode: Loaded Verified Default Channels."
                adapter.submitList(ChannelRepository.FALLBACK_CHANNELS)
            }
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_MENU) {
            loadChannels(forceRefresh = true)
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    class ChannelAdapter(private val onChannelClick: (Channel, Int) -> Unit) :
        RecyclerView.Adapter<ChannelAdapter.ViewHolder>() {

        private var items: List<Channel> = emptyList()

        fun submitList(newItems: List<Channel>) {
            items = newItems
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_channel_tv, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val channel = items[position]
            holder.bind(channel)
            holder.itemView.setOnClickListener {
                onChannelClick(channel, position)
            }
        }

        override fun getItemCount() = items.size

        class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            private val tvName: TextView = itemView.findViewById(R.id.tvChannelName)
            private val tvGroup: TextView = itemView.findViewById(R.id.tvChannelGroup)
            private val imgLogo: ImageView = itemView.findViewById(R.id.imgLogo)

            fun bind(channel: Channel) {
                tvName.text = channel.name
                tvGroup.text = channel.group

                if (channel.logo.isNotEmpty()) {
                    Glide.with(itemView.context)
                        .load(channel.logo)
                        .placeholder(R.drawable.ic_tv_placeholder)
                        .error(R.drawable.ic_tv_placeholder)
                        .into(imgLogo)
                } else {
                    imgLogo.setImageResource(R.drawable.ic_tv_placeholder)
                }
            }
        }
    }
}
