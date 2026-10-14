package com.easytv.app.model

import java.io.Serializable

data class Channel(
    val id: String,
    val name: String,
    val logo: String,
    val url: String,
    val group: String = "General",
    val country: String = "US",
    val resolution: String = "HD",
    val tvgId: String? = null
) : Serializable
