# EasyTV — Universal Live TV Streaming Application

**EasyTV** is a responsive, elder-friendly Live TV streaming application designed to run smoothly on mobile phones, tablets, laptops, desktop computers, smart TVs, and **Amazon Fire TV Stick Lite**.

---

## 🌟 Key Features

### 1. Elder-Friendly & Senior Accessible Design
- **1-Touch Easy Senior Mode**: Maximized channel cards, jumbo typography, and a prominent **"Watch Live TV"** one-tap hero banner that instantly resumes the last watched channel.
- **Big Text Mode (Aa)**: Increases font size by over 40% across titles, labels, and stream badges.
- **High Contrast Mode**: Pure black background with sharp amber (`#f59e0b`) and white focus borders for maximum visibility in daylight or dimly lit living rooms.
- **Zero Confusion**: Standardized clear labels: *Watch Live TV*, *All Channels*, *Favorites*, *Recently Watched*, *Last Watched Channel*, *Refresh Channels*, and *Settings*.
- **No Complex Gestures**: All essential actions are 1-click or D-pad remote navigable.

### 2. Live IPTV-org Integration & Resilient Caching
- **Real-Time Playlist Parsing**: Parses M3U `#EXTINF` tags, channel metadata (`tvg-id`, `tvg-name`, `tvg-logo`, `group-title`), and stream URLs.
- **Instant Uptime (Curated 24/7 Channels)**: Preloaded with legitimate, high-uptime public broadcast streams (NASA TV HD, Bloomberg News, Sky News, France 24, DW News, Euronews, Al Jazeera English, Red Bull TV, RTVE 24h, NHK World Japan, etc.) so playback works instantaneously even on slow networks or when offline.
- **Local Persistence & Offline Fallback**: Caches channel catalogues in **IndexedDB** (with `localStorage` fallback). If an update request fails, existing working channels are never erased.
- **Automatic & Manual Updates**: Silently checks for playlist updates in the background without interrupting current video playback, plus a manual "Refresh Channels" button with last-updated timestamp reporting.

### 3. Video Playback & Quality Controls
- **Adaptive HLS Streaming**: Powered by `hls.js` with automatic bitrate switching (ABR) and manual level selection (1080p, 720p, 576p, 480p).
- **Aspect Ratio Preservation**:
  - `Original`: Preserves native 16:9 or 4:3 broadcast ratios with proper letterboxing/pillarboxing (no distortion or unnatural stretching).
  - `Fit`: Scales within the player viewport.
  - `Fill`: Optional mode that expands to cover the screen, with clear notification that edges may be cropped.
- **Picture-in-Picture (PiP) & Fullscreen**: Standard fullscreen and floating PiP mode support.
- **Elder-Friendly Error Recovery**: Displays understandable error overlays with one-click **"Try Again"** and **"Next Channel"** buttons instead of confusing technical stack traces.

### 4. Cross-Device Adaptability & TV Remote Controls
- **Mobile Phones**: Touch-friendly, thumb-reachable controls, sticky player, and responsive cards.
- **Tablets**: Fluid two-column layout in landscape; efficient vertical space in portrait.
- **Laptops & Desktops**: Searchable channel browser, keyboard shortcuts, and quality diagnostics.
- **Smart TVs & Amazon Fire TV**: 10-foot UI with active golden-amber focus ring (`scale-[1.02]`), D-pad navigation, and an on-screen **Virtual Fire TV Remote** for testing TV remote navigation directly in the browser!

---

## 🚀 Running the Web Application Locally on macOS

### Prerequisites
- **macOS** (Sonoma, Ventura, or Sequoia)
- **Node.js 18+** or **Node.js 20+**
- **npm** or **pnpm**

### Step-by-Step Instructions

1. **Clone or navigate to the project directory**:
   ```bash
   cd easytv
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in your browser**:
   Navigate to `http://localhost:3000` (or the URL printed in your terminal).

5. **Build for production**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 📺 Amazon Fire TV Stick Lite & Android TV (Native Build)

A complete native Android project is included in the `/android` directory, built with **Kotlin 2.0**, **Android Media3 ExoPlayer (1.3.1)**, and **AndroidX Leanback**.

### Prerequisites on macOS
- **JDK 17**: `brew install openjdk@17`
- **Android SDK & Platform Tools (`adb`)**: Install via Android Studio or command-line tools.

### Building & Installing the Native APK

1. **Enable Developer Options on Fire TV Stick Lite**:
   - Go to `Settings > My Fire TV > About`.
   - Tap your device name **7 times** to unlock Developer Options.
   - Go to `Settings > My Fire TV > Developer Options` and turn **ADB Debugging** to **ON**.
   - Note your device's IP address under `Settings > My Fire TV > About > Network` (e.g. `192.168.1.145`).

2. **Compile the APK with Gradle**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   The APK will be generated at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Connect to Fire TV over WiFi and Install**:
   ```bash
   adb connect 192.168.1.145:5555
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

4. **Launch the App on TV**:
   ```bash
   adb shell monkey -p com.easytv.app -c android.intent.category.LAUNCHER 1
   ```

---

## 🎮 TV Remote & Keyboard Navigation Mapping

| Input | Remote Button | Web Keyboard | Action in EasyTV |
|---|---|---|---|
| **D-Pad Up/Down** | ▲ / ▼ | `ArrowUp` / `ArrowDown` | Move focus through channel grid / categories |
| **D-Pad Left/Right** | ◄ / ► | `ArrowLeft` / `ArrowRight` | Move focus horizontally |
| **Select / OK** | Center Button | `Enter` or `Space` | Watch channel / Play/Pause stream |
| **Back** | ↩ Back | `Escape` or `Backspace` | Return to top / Exit modal / Clear search |
| **Play / Pause** | ⏯ Play/Pause | `Space` or `K` | Toggle playback |
| **Channel Switcher** | CH+ / CH- | `PageUp` / `PageDown` | Switch to Next / Previous Channel |
| **Mute** | 🔇 Mute | `M` | Toggle audio mute |
| **Fullscreen** | TV Fullscreen | `F` | Toggle fullscreen playback |

---

## 📁 Project Structure

```
├── android/                             # Complete Native Android TV / Fire TV project
│   ├── app/
│   │   ├── build.gradle.kts             # Media3 ExoPlayer & Leanback dependencies
│   │   └── src/main/
│   │       ├── AndroidManifest.xml      # Fire TV Leanback & TV launcher configuration
│   │       ├── java/com/easytv/app/
│   │       │   ├── model/Channel.kt     # Channel data model
│   │       │   ├── data/M3uParser.kt    # Fast Kotlin M3U parser
│   │       │   ├── data/ChannelRepository.kt # Coroutine fetcher & local cache
│   │       │   └── ui/
│   │       │       ├── MainActivity.kt  # TV Leanback browse activity with D-pad focus
│   │       │       └── PlayerActivity.kt # Fullscreen Media3 ExoPlayer with remote controls
│   │       └── res/                     # Layouts, TV drawables, themes, and strings
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── README.md                        # Fire TV build & ADB deployment guide
│
├── src/                                 # Web Application (React + TypeScript + Vite)
│   ├── components/
│   │   ├── Header.tsx                   # Top accessible header with Senior toggles
│   │   ├── Player.tsx                   # Adaptive HLS player with aspect ratio & quality
│   │   ├── ChannelCard.tsx              # Focusable channel card with fallback initials
│   │   ├── ChannelBrowser.tsx           # Search, categories, country filters, tabs
│   │   ├── EasyModeHero.tsx             # Senior 1-touch "Watch Live TV" dashboard
│   │   ├── VirtualRemote.tsx            # Interactive on-screen Fire TV remote simulator
│   │   ├── SettingsModal.tsx            # Preferences, aspect ratio, playlist sources
│   │   └── FireTvGuideModal.tsx         # In-app native Fire TV build guide
│   ├── hooks/
│   │   ├── useHlsPlayer.ts              # Hls.js hook with level switching & error recovery
│   │   └── useTvNavigation.ts           # D-pad remote & keyboard listener hook
│   ├── services/
│   │   ├── iptv.ts                      # M3U parser, curated 24/7 channels, categories
│   │   └── storage.ts                   # IndexedDB and localStorage persistence layer
│   ├── types/
│   │   └── index.ts                     # TypeScript data models and interfaces
│   ├── App.tsx                          # Main app container & device layout router
│   ├── index.css                        # Tailwind CSS styles & accessible focus rings
│   └── main.tsx                         # React 19 application entry point
├── index.html                           # Applet entry point with SEO metadata
├── vite.config.ts                       # Vite configuration with streaming CORS proxy
└── package.json
```

---

## 🔒 Reliability, Privacy & Security
- **Untrusted Input Validation**: All M3U entries and metadata are sanitized before playback. Malicious scripts or arbitrary protocols are rejected.
- **Local-Only Preferences**: Favorites, recents, and settings are stored locally on the device (in IndexedDB / localStorage). No accounts, logins, tracking, or invasive telemetry.
- **Stream Availability**: EasyTV streams only publicly accessible, free-to-air feeds. Availability of specific regional channels may vary by geographic location or ISP constraints.
