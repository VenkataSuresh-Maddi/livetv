# EasyTV — Native Amazon Fire TV Stick Lite & Android TV Application

This directory contains the production-ready native Android project for **EasyTV**, built with **Kotlin 2.0**, **Android Media3 ExoPlayer**, and **AndroidX Leanback**.

---

## 1. System Requirements & Prerequisites on macOS

- **macOS Sonoma / Ventura / Sequoia** (Apple Silicon M1/M2/M3/M4 or Intel).
- **JDK 17** installed (`brew install openjdk@17` or Android Studio bundle).
- **Android SDK** (API 34, Android Platform Tools).
- **Amazon Fire TV Stick Lite** (or Fire TV 4K / Cube / Android TV box).

Verify your macOS environment:
```bash
java -version
adb --version
```

---

## 2. Enabling Developer Mode on Amazon Fire TV Stick Lite

1. Plug in your Fire TV Stick Lite and turn on your TV.
2. Go to **Settings** (gear icon) > **My Fire TV**.
3. Select **Developer Options**:
   *(Note: On newer Fire OS versions, if Developer Options is hidden, go to `Settings > My Fire TV > About`, and click your device name 7 times rapidly to unlock it).*
4. Turn **ADB Debugging** to **ON**.
5. Turn **Apps from Unknown Sources** to **ON**.
6. Check your device IP address:
   Go to `Settings > My Fire TV > About > Network` and note down the IP address (e.g., `192.168.1.145`).

---

## 3. Building the Native APK

From your macOS Terminal, enter the `android/` directory:

```bash
cd android
./gradlew assembleDebug
```

The compiled APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 4. Installing to Amazon Fire TV Stick Lite over WiFi

1. Connect to your Fire TV Stick Lite over ADB:
```bash
adb connect 192.168.1.145:5555
```
*(A prompt will appear on your TV screen: **"Allow USB/Network debugging?"** Check "Always allow from this computer" and click OK on your remote).*

2. Verify connection:
```bash
adb devices
# Output should show: 192.168.1.145:5555   device
```

3. Install the APK:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

4. Launch the application:
```bash
adb shell monkey -p com.easytv.app -c android.intent.category.LAUNCHER 1
```

---

## 5. TV Remote Controls Mapping

| Remote Button | Action in EasyTV |
|---|---|
| **D-Pad Up/Down/Left/Right** | Navigate channels and categories with 10-foot focus ring |
| **Center Select / OK** | Watch selected channel / Play/Pause stream |
| **Back Button** | Exit player back to channel list / Return to main menu |
| **Channel Up / Channel Down** | Fast channel switching during live playback |
| **Menu Button (≡)** | Toggle Video Aspect Ratio (Original Fit vs Fill) |
| **Home Button** | Return to Amazon Fire TV home screen |

---

## 6. Architecture & Memory Optimization for Fire TV Stick Lite

Fire TV Stick Lite devices have 1GB RAM and moderate CPU power:
- **ExoPlayer Buffering**: Configured with low-latency HLS buffering to prevent OOM errors.
- **Hardware Acceleration**: SurfaceView video rendering with MediaCodec.
- **M3U Streaming Parser**: Fast string parsing without bloated JSON object overhead.
- **Local Persistence**: SharedPreferences caching for offline playback fallback.
