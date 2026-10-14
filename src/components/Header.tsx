import React from 'react';
import { 
  Tv, 
  RotateCw, 
  Settings, 
  Eye, 
  Sparkles, 
  Sliders, 
  Smartphone, 
  CheckCircle2, 
  Maximize2 
} from 'lucide-react';
import { UserPreferences, DeviceMode } from '../types';

interface HeaderProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onRefreshChannels: () => void;
  isRefreshing: boolean;
  channelCount: number;
  onOpenSettings: () => void;
  onOpenFireTvGuide: () => void;
  activeDeviceMode: DeviceMode;
}

export const Header: React.FC<HeaderProps> = ({
  preferences,
  onUpdatePreferences,
  onRefreshChannels,
  isRefreshing,
  channelCount,
  onOpenSettings,
  onOpenFireTvGuide,
  activeDeviceMode,
}) => {
  const isHighContrast = preferences.highContrast;
  const isLargeText = preferences.largeText;
  const isEasyMode = preferences.easyMode;

  const formatLastUpdated = (ts: number | null) => {
    if (!ts) return 'Not yet updated';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-colors border-b ${
        isHighContrast
          ? 'bg-black border-amber-400 text-white'
          : 'bg-slate-900/95 backdrop-blur-md border-slate-800 text-slate-100 shadow-lg'
      } px-4 py-3 sm:px-6`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Live status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl flex items-center justify-center font-bold ${
                isHighContrast
                  ? 'bg-amber-400 text-black ring-2 ring-white'
                  : 'bg-gradient-to-tr from-amber-500 to-red-500 text-white shadow-md shadow-amber-500/20'
              }`}
            >
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-black tracking-tight ${
                    isLargeText ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                  }`}
                >
                  Easy<span className="text-amber-400">TV</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600/20 text-red-400 border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p
                className={`text-xs ${
                  isHighContrast ? 'text-amber-300 font-bold' : 'text-slate-400'
                }`}
              >
                {channelCount} Free Channels Available
              </p>
            </div>
          </div>
        </div>

        {/* Accessibility & Quick Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Easy Mode Toggle for Seniors */}
          <button
            type="button"
            onClick={() => onUpdatePreferences({ easyMode: !isEasyMode })}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm ${
              isEasyMode
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 ring-offset-2 ring-offset-slate-900'
                : isHighContrast
                ? 'bg-zinc-800 text-white border border-zinc-600 hover:border-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Simplified senior-friendly interface with extra large cards"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>{isEasyMode ? 'Easy Mode: ON' : 'Easy Mode'}</span>
          </button>

          {/* Large Text Toggle */}
          <button
            type="button"
            onClick={() => onUpdatePreferences({ largeText: !isLargeText })}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
              isLargeText
                ? 'bg-amber-400 text-black ring-2 ring-white'
                : isHighContrast
                ? 'bg-zinc-800 text-white border border-zinc-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Toggle larger typography"
          >
            <span className="font-extrabold text-base">Aa</span>
            <span className="hidden sm:inline">Big Text</span>
          </button>

          {/* High Contrast Toggle */}
          <button
            type="button"
            onClick={() => onUpdatePreferences({ highContrast: !isHighContrast })}
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
              isHighContrast
                ? 'bg-white text-black ring-2 ring-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="High contrast visual mode for maximum readability"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Contrast</span>
          </button>

          {/* Virtual Fire TV Remote Controller */}
          <button
            type="button"
            onClick={() =>
              onUpdatePreferences({ virtualRemoteVisible: !preferences.virtualRemoteVisible })
            }
            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
              preferences.virtualRemoteVisible
                ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-300'
                : isHighContrast
                ? 'bg-zinc-800 text-white border border-zinc-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Toggle On-Screen Fire TV Remote Controller"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline">TV Remote</span>
          </button>

          {/* Refresh Catalogue */}
          <button
            type="button"
            onClick={onRefreshChannels}
            disabled={isRefreshing}
            className={`px-3 py-1.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all ${
              isRefreshing
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : isHighContrast
                ? 'bg-amber-400 text-black font-bold hover:bg-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={`Refresh channels (Last: ${formatLastUpdated(preferences.lastCatalogueUpdate)})`}
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          {/* Fire TV APK Guide */}
          <button
            type="button"
            onClick={onOpenFireTvGuide}
            className="px-2.5 py-1.5 rounded-xl bg-orange-600/20 text-orange-300 border border-orange-500/40 hover:bg-orange-600/30 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all"
            title="Amazon Fire TV & Android TV Package Instructions"
          >
            <Tv className="w-4 h-4 text-orange-400" />
            <span className="hidden lg:inline">Fire TV App</span>
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={`p-2 rounded-xl transition-all ${
              isHighContrast
                ? 'bg-zinc-800 text-white border border-zinc-600 hover:border-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            aria-label="Settings"
            title="Application Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
