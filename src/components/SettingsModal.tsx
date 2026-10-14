import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Type, 
  Eye, 
  Sparkles, 
  Tv, 
  Database, 
  RotateCw, 
  Check, 
  Layers, 
  Crop, 
  Sliders 
} from 'lucide-react';
import { UserPreferences, AspectRatioMode, DeviceMode } from '../types';
import { POPULAR_PLAYLIST_SOURCES } from '../services/iptv';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onRefreshCatalogue: () => void;
  isRefreshing: boolean;
  channelCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  onRefreshCatalogue,
  isRefreshing,
  channelCount,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  const isHighContrast = preferences.highContrast;

  const handleApplyCustomUrl = () => {
    if (customUrl.trim().startsWith('http://') || customUrl.trim().startsWith('https://')) {
      onUpdatePreferences({ activePlaylistUrl: customUrl.trim() });
      setShowCustomInput(false);
      onRefreshCatalogue();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all ${
          isHighContrast
            ? 'bg-black border-amber-400 text-white'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black">EasyTV Settings</h2>
              <p className="text-xs text-slate-400">Accessibility, Playback, and Playlist Options</p>
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

        <div className="space-y-6">
          {/* Section 1: Accessibility & Senior Friendly Modes */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Elder Accessibility &amp; Display</span>
            </h3>

            {/* Easy Mode */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-base flex items-center gap-2">
                  <span>Easy Senior Mode</span>
                  {preferences.easyMode && (
                    <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Maximizes channel cards, simplifies navigation, and adds 1-touch &ldquo;Watch Live TV&rdquo; quick resume.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.easyMode}
                onChange={(e) => onUpdatePreferences({ easyMode: e.target.checked })}
                className="w-6 h-6 accent-emerald-500 rounded cursor-pointer shrink-0"
              />
            </div>

            {/* Large Text */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-base flex items-center gap-2">
                  <Type className="w-4 h-4 text-amber-400" />
                  <span>Large Text Mode</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Increases typography size across channel names, menus, and player controls for easier reading.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.largeText}
                onChange={(e) => onUpdatePreferences({ largeText: e.target.checked })}
                className="w-6 h-6 accent-amber-400 rounded cursor-pointer shrink-0"
              />
            </div>

            {/* High Contrast */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>High Contrast Mode</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ultra-crisp pure black background with sharp amber and white focus outlines for maximum legibility.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.highContrast}
                onChange={(e) => onUpdatePreferences({ highContrast: e.target.checked })}
                className="w-6 h-6 accent-amber-400 rounded cursor-pointer shrink-0"
              />
            </div>
          </div>

          {/* Section 2: Video Playback & Aspect Ratio */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Crop className="w-4 h-4" />
              <span>Video Playback &amp; Aspect Ratio</span>
            </h3>

            {/* Default Aspect Ratio */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="text-sm font-bold block">Default Aspect Ratio Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'original', label: 'Original', desc: '16:9 / 4:3 (No stretch)' },
                  { id: 'fit', label: 'Fit Screen', desc: 'Scale to fit inside window' },
                  { id: 'fill', label: 'Fill Screen', desc: 'Cover all, may crop edges' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onUpdatePreferences({ preferredAspectRatio: item.id as AspectRatioMode })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      preferences.preferredAspectRatio === item.id
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: IPTV Playlist Source */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>Playlist Source &amp; Catalogue Updates</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Cached Channels: <strong className="text-white">{channelCount}</strong></span>
                <span>
                  Last Updated:{' '}
                  <strong className="text-white">
                    {preferences.lastCatalogueUpdate
                      ? new Date(preferences.lastCatalogueUpdate).toLocaleString()
                      : 'Never'}
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
                      onClick={() => {
                        onUpdatePreferences({ activePlaylistUrl: source.url });
                        onRefreshCatalogue();
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{source.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate max-w-sm">
                          {source.url}
                        </p>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Force refresh button */}
              <button
                type="button"
                onClick={onRefreshCatalogue}
                disabled={isRefreshing}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isRefreshing ? 'Downloading Channel Updates...' : 'Force Refresh Catalogue Now'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-400 text-black font-extrabold text-sm hover:bg-amber-300 transition-transform active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
