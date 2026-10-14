import React from 'react';
import { X, Tv, Terminal, CheckCircle2, Copy, Cpu, Layers, ExternalLink } from 'lucide-react';

interface FireTvGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast?: boolean;
}

export const FireTvGuideModal: React.FC<FireTvGuideModalProps> = ({
  isOpen,
  onClose,
  highContrast = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all ${
          highContrast
            ? 'bg-black border-amber-400 text-white'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black">
                Amazon Fire TV Stick Lite &amp; Android TV
              </h2>
              <p className="text-xs text-slate-400">
                Native Kotlin + Android Media3 ExoPlayer Architecture
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-sm">
          {/* Architecture overview */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>Full Native Fire TV Codebase Generated</span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              We have generated the complete native Android project located in the <code className="text-amber-300 font-mono">/android</code> directory. It uses <strong>Kotlin 2.0</strong>, <strong>AndroidX Leanback</strong>, and <strong>Android Media3 ExoPlayer (1.3.1)</strong> with native HLS playback optimized for the hardware limitations of Amazon Fire TV Stick Lite (1GB RAM, ARMv7/ARM64).
            </p>
          </div>

          {/* 3 Step Build & Deploy Guide */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>How to Build &amp; Install on macOS / Linux</span>
            </h3>

            {/* Step 1 */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="font-bold text-xs text-amber-400">Step 1: Enable ADB Debugging on Fire TV</p>
              <p className="text-xs text-slate-300">
                On your Amazon Fire TV Stick Lite: Go to <em>Settings &gt; My Fire TV &gt; Developer Options</em>. Turn ON <strong>ADB Debugging</strong> and <strong>Apps from Unknown Sources</strong>. Note your Fire TV&apos;s IP address under <em>Settings &gt; My Fire TV &gt; About &gt; Network</em>.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="font-bold text-xs text-amber-400">Step 2: Build the APK with Gradle</p>
              <p className="text-xs text-slate-300">
                Open Terminal in macOS, navigate to the <code className="text-amber-300 font-mono">android</code> directory and assemble the debug APK:
              </p>
              <pre className="p-2.5 rounded-lg bg-black text-emerald-400 font-mono text-xs overflow-x-auto">
                cd android && ./gradlew assembleDebug
              </pre>
            </div>

            {/* Step 3 */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <p className="font-bold text-xs text-amber-400">Step 3: Connect and Install over WiFi</p>
              <p className="text-xs text-slate-300">
                Connect via ADB and install the generated APK directly:
              </p>
              <pre className="p-2.5 rounded-lg bg-black text-emerald-400 font-mono text-xs overflow-x-auto">
{`adb connect 192.168.1.XXX:5555
adb install -r app/build/outputs/apk/debug/app-debug.apk`}
              </pre>
            </div>
          </div>

          {/* Key Native Features Implemented */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              Native Android TV Implementation Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { title: 'Android Media3 ExoPlayer', desc: 'Hardware-accelerated HLS stream decoding with ABR & buffer management.' },
                { title: 'D-Pad Remote Navigation', desc: 'Full Fire TV remote handler (KEYCODE_DPAD_CENTER, BACK, CH+, CH-).' },
                { title: 'Leanback TV UI Banner', desc: 'Compliant TV launcher intent & 10-foot large card focus states.' },
                { title: 'Offline M3U Caching', desc: 'Cached playlist in Android SharedPreferences with periodic refresh.' },
              ].map((feat, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <p className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{feat.title}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-400 text-black font-extrabold text-xs hover:bg-amber-300 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
