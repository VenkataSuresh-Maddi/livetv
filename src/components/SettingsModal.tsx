import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Database, 
  RotateCw, 
  Check, 
  Crop, 
  Tv, 
  ShieldCheck,
  Globe 
} from 'lucide-react';
import { UserPreferences, AspectRatioMode } from '../types';
import { POPULAR_PLAYLIST_SOURCES } from '../services/iptv';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onRefreshCatalogue: (overrideUrl?: string) => void;
  isRefreshing: boolean;
  channelCount: number;
  onOpenLanguageModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onRefreshCatalogue,
  isRefreshing,
  channelCount,
  onOpenLanguageModal,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  const handleSelectSource = (url: string) => {
    onUpdatePreferences({ activePlaylistUrl: url });
    // Fix state-timing bug: pass url directly to refresh so it immediately fetches new url!
    onRefreshCatalogue(url);
  };

  const handleApplyCustomUrl = () => {
    const trimmed = customUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      handleSelectSource(trimmed);
      setShowCustomInput(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl bg-[#141414] border border-zinc-800 text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-500 border border-red-600/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">EasyTV Settings</h2>
              <p className="text-xs text-zinc-400">Configure Playlist Source, Video Preferences &amp; Cache</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Section 1: Playlist Source & Full Catalogue */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>IPTV Playlist Source &amp; Live Updates</span>
            </h3>

            <div className="p-4 sm:p-5 rounded-2xl bg-[#1a1a1a] border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
                <span>
                  Loaded Channels:{' '}
                  <strong className="text-white font-mono text-sm">{channelCount.toLocaleString()}</strong>
                </span>
                <span>
                  Last Updated:{' '}
                  <strong className="text-zinc-200">
                    {preferences.lastCatalogueUpdate
                      ? new Date(preferences.lastCatalogueUpdate).toLocaleString()
                      : 'Just now'}
                  </strong>
                </span>
              </div>

              {/* Source list */}
              <div className="space-y-2">
                {POPULAR_PLAYLIST_SOURCES.map((source) => {
                  const isActive = preferences.activePlaylistUrl === source.url;
                  return (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => handleSelectSource(source.url)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs transition-all ${
                        isActive
                          ? 'bg-red-600/15 border-red-600 text-red-400 shadow-md'
                          : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/80'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-white">{source.name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono truncate max-w-sm mt-0.5">
                          {source.url}
                        </p>
                      </div>
                      {isActive && <Check className="w-5 h-5 text-red-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom URL input */}
              {showCustomInput ? (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="url"
                    placeholder="https://example.com/playlist.m3u"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700"
                  >
                    Apply &amp; Load
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="p-2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="text-xs font-semibold text-red-500 hover:underline pt-1 block"
                >
                  + Add Custom M3U Playlist URL
                </button>
              )}

              {/* Force refresh button */}
              <button
                type="button"
                onClick={() => onRefreshCatalogue()}
                disabled={isRefreshing}
                className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-colors shadow-md cursor-pointer"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-red-500' : ''}`} />
                <span>
                  {isRefreshing
                    ? 'Downloading & Parsing Playlist...'
                    : 'Force Full Catalogue Refresh Now'}
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Video Playback & Aspect Ratio */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
              <Crop className="w-4 h-4" />
              <span>Video Aspect Ratio &amp; Playback</span>
            </h3>

            <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-zinc-300 block">Default Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'original', label: 'Original', desc: '16:9 / 4:3 (Unstretched)' },
                  { id: 'fit', label: 'Fit Screen', desc: 'Fits player window' },
                  { id: 'fill', label: 'Fill Screen', desc: 'Cover all (may crop)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onUpdatePreferences({ preferredAspectRatio: item.id as AspectRatioMode })
                    }
                    className={`p-3 rounded-xl border text-left transition-all ${
                      preferences.preferredAspectRatio === item.id
                        ? 'bg-red-600/15 border-red-600 text-red-400 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Language Personalization */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>Language Personalization</span>
            </h3>

            <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Preferred TV Languages</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Personalizes your home page and recommendations without location tracking.
                  </p>
                </div>
                {onOpenLanguageModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLanguageModal();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Manage Languages
                  </button>
                )}
              </div>

              {/* Badges of currently selected languages */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {preferences.preferredLanguages && preferences.preferredLanguages.length > 0 ? (
                  preferences.preferredLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-red-500" />
                      <span>{lang}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">
                    No preferred languages selected (showing all global channels)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            EasyTV v2.0 • High Capacity Streaming
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm transition-transform active:scale-95 shadow-lg shadow-red-600/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
