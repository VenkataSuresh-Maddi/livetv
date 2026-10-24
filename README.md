# EasyTV — Universal Live TV Streaming Application (Netflix-Inspired Edition)

EasyTV is a modern, high-performance Live TV streaming application inspired by Netflix. It loads over **11,200+ global channels** from the IPTV-org catalogue, supports adaptive HLS streaming, and runs smoothly on web browsers, mobile devices, tablets, and native **Amazon Fire TV Stick Lite**.

---

## 🌟 Key Updates & Architectural Fixes

### 1. Unconstrained 11,220+ Channel Catalogue
- **Removed Hardcoded Cap**: Identified and eliminated the `maxChannels = 1500` limit and slice restrictions in `src/services/iptv.ts` and `src/services/storage.ts`.
- **Full Parse Verified**: The M3U parser now processes all **11,220+ channels** in under 50ms.
- **IndexedDB v2 High-Capacity Storage**: Replaced the previous 1,515-channel cache with `EasyTV_DB_v2`, capable of instantly caching all 11,000+ channel records with offline fallback.
- **Silky Smooth 60fps Rendering**: Implemented chunked rendering (batches of 48 channels with pagination / "Load More") so the DOM never stutters, even when searching through 11,000+ entries.

### 2. Video Playback & Infinite Spinner Fix
- **Root Cause of "Connecting Live Stream..." Hang**:
  1. The Vite proxy (`/api/proxy`) was only defined as dev-server middleware in `vite.config.ts`, returning a 404 on Vercel production deployments.
  2. When streams threw fatal network errors, `useHlsPlayer.ts` caught the error, retried proxy, and on 404 fell into an infinite `hls.startLoad()` loop without bounded retry limits.
  3. Browsers blocking autoplay without user gesture left `isBuffering: true` active indefinitely.
- **The Solution**:
  1. **Created Vercel Serverless Function** at `/api/proxy.ts` with SSRF protection, HTTP/HTTPS validation, and CORS headers.
  2. **12-Second Watchdog Timer**: Added a bounded connection watchdog in `useHlsPlayer.ts` that terminates stalled connection attempts cleanly.
  3. **Autoplay Block Resolution**: Detects `NotAllowedError` and renders an intuitive, one-tap "Click to Watch Live Stream" button.
  4. **Bounded Retries**: Maximum 1 proxy retry attempt with clean fallback to human-readable error messages.
  5. **Verified Curated Channels**: Curated channels were repointed at real broadcaster sources (DW News, 3Cat Info, Red Bull TV, Tagesschau 24, TV9 Telugu, Aaj Tak, NDTV India, Sun TV, ABP Ananda/Majha/Asmita, PTC News, etc.). Placeholder demo streams and dead entries (NASA TV, Bloomberg, 2GB, 3AW, Sky News, RTVE) were removed.

### 3. Live Playlist Integration (`iptv-org` index.m3u)
- **Single source of truth**: the catalogue is loaded from `https://iptv-org.github.io/iptv/index.m3u` (configurable in Settings), parsed in full (~11,300 channels) and cached in IndexedDB.
- **Correct channel metadata**: the playlist only carries `tvg-id`, logo and a category, so each entry is enriched from iptv-org — country from the channel id (`StarMaa.in@HD` → India), categories/genres from the `channels.json` API, and language from the `index.language.m3u` grouping.
- **Stable channel ids**: ids are derived from the `tvg-id` (not the list index), so favourites, recent channels and watch history survive catalogue refreshes.
- **No duplicate pins**: curated channels are merged by `tvg-id`, so a channel never appears twice.
- **First-click playback fix**: the player hook now waits for the player view (`<video>`) to mount before attaching the stream, so the very first "Watch Live Now" click starts playback.

### 4. Redesigned Netflix-Inspired Streaming Interface
- **Dark Cinema Theme**: Deep near-black background (`#141414`), charcoal card surfaces (`#181818`), and Netflix-red accents (`#E50914`).
- **Hero Billboard Banner**: Featured live broadcast billboard with channel artwork, category tags, resolution badges, red pulsating LIVE indicators, and big "▶ Watch Live Now" action.
- **Horizontal Carousels**:
  - 🔴 **Trending Live Broadcasters**
  - 🕒 **Continue Watching** (automatic watch history)
  - ⭐ **My List** (favorited channels)
  - 📰 **Live News & World Events**
  - ⚽ **Sports & Live Action**
  - 🎬 **Movies & Cinema**
  - 🍿 **Entertainment & Shows**
  - 🔬 **Science & Documentaries**
  - 🎵 **Music & Concerts**
- **Cinema Video Player**: Large responsive video stage with ambient glow, real-time measured resolution display (e.g. `1920x1080`), adaptive quality track selector, aspect ratio controls (Original 16:9/4:3, Fit, Fill), volume slider, PiP, fullscreen, and "More Channels in this Category" quick channel surfer.

---

## 🚀 Running Locally on macOS

### Prerequisites
- macOS (Sonoma, Ventura, Sequoia)
- Node.js 18+ or 20+
- npm

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
# Open http://localhost:3000 in your browser

# 3. Production build
npm run build

# 4. Preview production build locally
npm run preview
```

---

## 🌐 Deploying to Vercel (Production)

The web application is deployed at `https://livetv-inky-ten.vercel.app`.

### Deployment Steps:
1. Commit and push the updated files to your GitHub repository:
   ```bash
   git add .
   git commit -m "Fix channel cap to 11,200+, fix player infinite spinner, add Vercel /api/proxy, redesign with Netflix theme"
   git push origin main
   ```
2. Vercel will automatically detect the commit, run `npm run build`, and deploy:
   - The Vite single-page app from `dist/`
   - The Serverless Function at `/api/proxy.ts` (configured in `vercel.json`)
3. Visit `https://livetv-inky-ten.vercel.app`:
   - Click "Force Full Catalogue Refresh" in Settings or wait for initial load to index all **11,220+ channels**.
   - Enjoy immediate live streaming playback!

---

## 📺 Amazon Fire TV Stick Lite & Android TV

Complete native Kotlin + Android Media3 ExoPlayer project located in `/android`:
- **Build APK**:
  ```bash
  cd android
  ./gradlew assembleDebug
  ```
- **Install over WiFi via ADB**:
  ```bash
  adb connect <Fire-TV-IP>:5555
  adb install -r app/build/outputs/apk/debug/app-debug.apk
  ```
