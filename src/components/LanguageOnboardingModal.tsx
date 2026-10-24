import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Check, 
  Globe, 
  Sparkles, 
  X, 
  CheckSquare, 
  RotateCcw, 
  AlertTriangle,
  Eye,
  Tv
} from 'lucide-react';
import { Channel, Language } from '../types';
import { getRecommendedChannelsForLanguages } from '../services/languages';

interface LanguageOnboardingModalProps {
  isOpen: boolean;
  isOnboarding?: boolean; // true if first-time onboarding, false if editing preferences
  languages: Language[];
  initialSelectedLanguages: string[];
  channels?: Channel[];
  onSave: (selectedLanguages: string[]) => void;
  onSkip?: () => void;
  onClose?: () => void;
  onResetPreferences?: () => void;
}

export const LanguageOnboardingModal: React.FC<LanguageOnboardingModalProps> = ({
  isOpen,
  isOnboarding = true,
  languages,
  initialSelectedLanguages,
  channels = [],
  onSave,
  onSkip,
  onClose,
  onResetPreferences,
}) => {
  const [selected, setSelected] = useState<string[]>(() => [...initialSelectedLanguages]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Sync state whenever modal opens or initialSelectedLanguages change
  useEffect(() => {
    if (isOpen) {
      setSelected([...initialSelectedLanguages]);
      setShowResetConfirm(false);
      setShowPreview(false);
      setSearchQuery('');
    }
  }, [isOpen, initialSelectedLanguages]);

  // Compute preview recommendations based on currently checked languages in modal
  const previewChannels = useMemo(() => {
    if (!showPreview || !channels || channels.length === 0) return [];
    return getRecommendedChannelsForLanguages(channels, selected, 8);
  }, [showPreview, channels, selected]);

  if (!isOpen) return null;

  // Filter languages by search query
  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        (lang.nativeName && lang.nativeName.toLowerCase().includes(q))
    );
  }, [languages, searchQuery]);

  const toggleLanguage = (langName: string) => {
    setSelected((prev) => {
      if (prev.includes(langName)) {
        return prev.filter((l) => l !== langName);
      } else {
        return [...prev, langName];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    const names = filteredLanguages.map((l) => l.name);
    setSelected((prev) => Array.from(new Set([...prev, ...names])));
  };

  const handleClearAll = () => {
    setSelected([]);
  };

  const handleContinue = () => {
    onSave(selected);
  };

  const handleCancelChanges = () => {
    setSelected([...initialSelectedLanguages]);
    setShowResetConfirm(false);
    if (isOnboarding && onSkip) {
      onSkip();
    } else if (onClose) {
      onClose();
    }
  };

  const handleConfirmReset = () => {
    setSelected([]);
    setShowResetConfirm(false);
    if (onResetPreferences) {
      onResetPreferences();
    } else {
      onSave([]);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-[#141414] border border-zinc-800 shadow-2xl text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-transparent shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-red-500 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded-full">
                    {isOnboarding ? 'Welcome to EasyTV' : 'Profile & Preferences'}
                  </span>
                </div>
                <h2 id="language-modal-title" className="text-xl sm:text-2xl font-black text-white mt-1">
                  {isOnboarding ? 'Welcome to EasyTV' : 'Language Preferences'}
                </h2>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={handleCancelChanges}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-zinc-400 text-xs sm:text-sm mt-3 leading-relaxed">
            Choose your preferred languages to personalize your TV experience.
          </p>

          {/* Currently Saved Languages Pills */}
          {initialSelectedLanguages.length > 0 && (
            <div className="mt-3 flex items-center flex-wrap gap-1.5 text-xs">
              <span className="text-zinc-400 text-[11px] font-medium mr-1">Currently Saved:</span>
              {initialSelectedLanguages.map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-semibold"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}

          {/* Search bar & quick actions */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search languages (Telugu, Hindi, Tamil, English...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors flex items-center gap-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                <span>Select All</span>
              </button>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Clear ({selected.length})
                </button>
              )}
              {channels && channels.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPreview((p) => !p)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                    showPreview
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                  title="Preview Recommendations"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Preview</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reset Confirmation Banner */}
        {showResetConfirm && (
          <div className="p-4 bg-amber-950/40 border-b border-amber-700/50 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Reset all language preferences back to default?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}

        {/* Live Preview Panel (if enabled) */}
        {showPreview && (
          <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preview Recommendations ({previewChannels.length})</span>
              </span>
              <span className="text-[11px] text-zinc-400">
                Based on: {selected.length > 0 ? selected.join(', ') : 'All catalog channels'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {previewChannels.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex items-center gap-2 text-left"
                >
                  {c.logo ? (
                    <img referrerPolicy="no-referrer" src={c.logo} alt={c.name} className="w-6 h-6 object-contain rounded bg-zinc-900 p-0.5" />
                  ) : (
                    <Tv className="w-5 h-5 text-red-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{c.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{c.language || c.group}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable Language Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {filteredLanguages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredLanguages.map((lang) => {
                const isSelected = selected.includes(lang.name);
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => toggleLanguage(lang.name)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 group cursor-pointer ${
                      isSelected
                        ? 'bg-red-600/15 border-red-500 text-white shadow-md shadow-red-950/40 ring-1 ring-red-500/50'
                        : 'bg-zinc-900/80 hover:bg-zinc-800/90 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-red-600 border-red-500 text-white'
                              : 'border-zinc-600 group-hover:border-zinc-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-mono text-zinc-400">
                          {lang.count > 0 ? `${lang.count} ch` : ''}
                        </span>
                      </div>
                      {lang.nativeName && (
                        <span className="text-xs font-semibold text-zinc-400 group-hover:text-zinc-300">
                          {lang.nativeName}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base leading-tight text-white group-hover:text-red-300 transition-colors">
                        {lang.name}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400">
              <Globe className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-semibold">No languages matched "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-red-500 hover:underline font-bold"
              >
                Reset search
              </button>
            </div>
          )}
        </div>

        {/* Footer with Reset, Cancel & Save buttons */}
        <div className="p-4 sm:p-6 border-t border-zinc-800 bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-xs text-zinc-400">
              {selected.length === 0 ? (
                <span>No languages selected</span>
              ) : (
                <span>
                  <strong className="text-white font-bold">{selected.length}</strong> {selected.length === 1 ? 'language' : 'languages'} selected
                </span>
              )}
            </div>

            {/* Reset Preferences button */}
            {!isOnboarding && (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                title="Reset Preferences"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleCancelChanges}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm transition-colors border border-zinc-700 cursor-pointer"
            >
              {isOnboarding ? 'Skip' : 'Cancel Changes'}
            </button>

            <button
              type="button"
              onClick={handleContinue}
              className="px-5 sm:px-7 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm transition-transform active:scale-95 shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer"
            >
              <span>{isOnboarding ? 'Continue' : 'Save Preferences'}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
