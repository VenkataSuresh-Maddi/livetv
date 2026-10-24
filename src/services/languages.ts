import { Channel, Language } from '../types';

export interface LanguageDefinition {
  id: string; // e.g. 'telugu'
  name: string; // e.g. 'Telugu'
  nativeName: string; // e.g. 'తెలుగు'
  aliases: string[]; // ['tel', 'te', 'telugu']
  isRegionalIndian?: boolean;
}

export const CANONICAL_LANGUAGES: LanguageDefinition[] = [
  {
    id: 'telugu',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    aliases: ['tel', 'te', 'telugu'],
    isRegionalIndian: true,
  },
  {
    id: 'tamil',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    aliases: ['tam', 'ta', 'tamil'],
    isRegionalIndian: true,
  },
  {
    id: 'hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    aliases: ['hin', 'hi', 'hindi'],
    isRegionalIndian: true,
  },
  {
    id: 'kannada',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    aliases: ['kan', 'kn', 'kannada'],
    isRegionalIndian: true,
  },
  {
    id: 'malayalam',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    aliases: ['mal', 'ml', 'malayalam'],
    isRegionalIndian: true,
  },
  {
    id: 'bengali',
    name: 'Bengali',
    nativeName: 'বাংলা',
    aliases: ['ben', 'bn', 'bengali', 'bangla'],
    isRegionalIndian: true,
  },
  {
    id: 'marathi',
    name: 'Marathi',
    nativeName: 'मराठी',
    aliases: ['mar', 'mr', 'marathi'],
    isRegionalIndian: true,
  },
  {
    id: 'gujarati',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    aliases: ['guj', 'gu', 'gujarati'],
    isRegionalIndian: true,
  },
  {
    id: 'punjabi',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    aliases: ['pan', 'pun', 'pa', 'punjabi'],
    isRegionalIndian: true,
  },
  {
    id: 'odia',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    aliases: ['ori', 'odi', 'or', 'odia', 'oriya'],
    isRegionalIndian: true,
  },
  {
    id: 'assamese',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    aliases: ['asm', 'as', 'assamese'],
    isRegionalIndian: true,
  },
  {
    id: 'bhojpuri',
    name: 'Bhojpuri',
    nativeName: 'भोजपुरी',
    aliases: ['bho', 'bhojpuri'],
    isRegionalIndian: true,
  },
  {
    id: 'english',
    name: 'English',
    nativeName: 'English',
    aliases: ['eng', 'en', 'english'],
    isRegionalIndian: false,
  },
  {
    id: 'spanish',
    name: 'Spanish',
    nativeName: 'Español',
    aliases: ['spa', 'es', 'spanish', 'castilian', 'español'],
    isRegionalIndian: false,
  },
  {
    id: 'german',
    name: 'German',
    nativeName: 'Deutsch',
    aliases: ['deu', 'ger', 'de', 'german', 'deutsch'],
    isRegionalIndian: false,
  },
  {
    id: 'french',
    name: 'French',
    nativeName: 'Français',
    aliases: ['fra', 'fre', 'fr', 'french', 'français'],
    isRegionalIndian: false,
  },
  {
    id: 'japanese',
    name: 'Japanese',
    nativeName: '日本語',
    aliases: ['jpn', 'ja', 'japanese'],
    isRegionalIndian: false,
  },
  {
    id: 'arabic',
    name: 'Arabic',
    nativeName: 'العربية',
    aliases: ['ara', 'ar', 'arabic'],
    isRegionalIndian: false,
  },
];

// Lookup maps for fast O(1) matching
const ALIAS_TO_CANONICAL = new Map<string, LanguageDefinition>();
for (const lang of CANONICAL_LANGUAGES) {
  ALIAS_TO_CANONICAL.set(lang.id.toLowerCase(), lang);
  ALIAS_TO_CANONICAL.set(lang.name.toLowerCase(), lang);
  for (const alias of lang.aliases) {
    ALIAS_TO_CANONICAL.set(alias.toLowerCase(), lang);
  }
}

/**
 * Normalizes any raw language string (from tvg-language, group, or channel title)
 * to a standardized Title Case name (e.g. 'tel' -> 'Telugu', 'hin' -> 'Hindi').
 */
export function normalizeLanguageName(raw?: string): string {
  if (!raw) return 'English';
  const clean = raw.trim();
  if (!clean) return 'English';

  const lower = clean.toLowerCase();
  const matched = ALIAS_TO_CANONICAL.get(lower);
  if (matched) return matched.name;

  // Title-case custom language
  return clean
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Returns native script representation for recognized languages (e.g. 'Telugu' -> 'తెలుగు')
 */
export function getNativeLanguageName(languageName: string): string | undefined {
  const matched = ALIAS_TO_CANONICAL.get(languageName.toLowerCase());
  return matched?.nativeName;
}

/**
 * Checks whether a channel matches a specific language.
 * Uses channel.language metadata primarily, with intelligent fallback inspection
 * of channel name or group keywords (e.g., 'Star Maa' or 'TV9 Telugu').
 */
export function channelMatchesLanguage(channel: Channel, language: string): boolean {
  if (!language || language === 'all') return true;

  const targetNorm = normalizeLanguageName(language).toLowerCase();
  const chanLang = normalizeLanguageName(channel.language).toLowerCase();

  if (chanLang === targetNorm) {
    return true;
  }

  // Also check if channel.language direct substring matches
  if (channel.language && channel.language.toLowerCase().includes(targetNorm)) {
    return true;
  }

  // Check group-title if it represents language
  const groupLower = (channel.group || '').toLowerCase();
  if (groupLower.includes(targetNorm)) {
    return true;
  }

  // Check channel name keywords for language mentions
  const nameLower = channel.name.toLowerCase();
  const targetDef = ALIAS_TO_CANONICAL.get(targetNorm);
  if (targetDef) {
    // Check if channel name contains the language name as word boundary or direct mention
    const regex = new RegExp(`\\b${targetDef.name.toLowerCase()}\\b`, 'i');
    if (regex.test(nameLower)) {
      return true;
    }
    // Check known regional channel brand patterns without explicit language word
    if (targetDef.id === 'telugu') {
      if (/\b(maa\s?tv|star\s?maa|gemini|etv|ntv|v6|tv9\s?telugu|zee\s?telugu|sakshi|abn|bhakti)\b/i.test(nameLower)) {
        return true;
      }
    } else if (targetDef.id === 'tamil') {
      if (/\b(sun\s?tv|star\s?vijay|zee\s?tamil|kalaignar|jaya\s?tv|polimer|puthiya\s?thalaimurai|thanthi)\b/i.test(nameLower)) {
        return true;
      }
    } else if (targetDef.id === 'hindi') {
      if (/\b(aaj\s?tak|ndtv\s?india|zee\s?news|star\s?plus|zee\s?tv|colors|abp\s?news|india\s?tv|dd\s?national|dd\s?news)\b/i.test(nameLower)) {
        return true;
      }
    } else if (targetDef.id === 'kannada') {
      if (/\b(tv9\s?kannada|public\s?tv|suvarna|zee\s?kannada|udaya)\b/i.test(nameLower)) {
        return true;
      }
    } else if (targetDef.id === 'malayalam') {
      if (/\b(asianet|manorama|mathrubhumi|kairali|24\s?news|amrita)\b/i.test(nameLower)) {
        return true;
      }
    } else if (targetDef.id === 'bengali') {
      if (/\b(abp\s?ananda|24\s?ghanta|star\s?jalsha|zee\s?bangla)\b/i.test(nameLower)) {
        return true;
      }
    } else if (targetDef.id === 'marathi') {
      if (/\b(abp\s?majha|zee\s?24\s?taas|star\s?pravah|zee\s?marathi)\b/i.test(nameLower)) {
        return true;
      }
    } else if (targetDef.id === 'gujarati') {
      if (/\b(abp\s?asmita|tv9\s?gujarati|sandesh)\b/i.test(nameLower)) {
        return true;
      }
    } else if (targetDef.id === 'punjabi') {
      if (/\b(ptc\s?news|zee\s?punjabi|chardi\s?kala)\b/i.test(nameLower)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extracts and counts languages from the loaded channels catalogue.
 * Guarantees all canonical requested languages appear in the list so users can select them,
 * and appends any extra discovered languages from the M3U metadata.
 */
export function extractLanguages(channels: Channel[]): Language[] {
  const counts = new Map<string, number>();

  // Count channels per normalized language
  for (const ch of channels) {
    // If ch has explicit language, use it
    if (ch.language) {
      const norm = normalizeLanguageName(ch.language);
      counts.set(norm, (counts.get(norm) || 0) + 1);
    }

    // Also check if channel matches any of the canonical languages
    for (const canon of CANONICAL_LANGUAGES) {
      if (normalizeLanguageName(ch.language) !== canon.name && channelMatchesLanguage(ch, canon.name)) {
        counts.set(canon.name, (counts.get(canon.name) || 0) + 1);
      }
    }
  }

  const result: Language[] = [];
  const processed = new Set<string>();

  // 1. First add canonical languages in prioritized order
  for (const canon of CANONICAL_LANGUAGES) {
    result.push({
      id: canon.id,
      name: canon.name,
      nativeName: canon.nativeName,
      count: counts.get(canon.name) || 0,
    });
    processed.add(canon.name.toLowerCase());
  }

  // 2. Add extra discovered languages with a meaningful number of channels,
  //    busiest first, so the language picker stays usable.
  const extras = Array.from(counts.entries())
    .filter(([langName, count]) => !processed.has(langName.toLowerCase()) && count >= 3)
    .sort((a, b) => b[1] - a[1]);

  for (const [langName, count] of extras) {
    result.push({
      id: langName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: langName,
      count,
    });
    processed.add(langName.toLowerCase());
  }

  return result;
}

/**
 * Returns prioritized channels matching the user's preferred languages.
 */
export function getRecommendedChannelsForLanguages(
  channels: Channel[],
  preferredLanguages: string[],
  limit = 24
): Channel[] {
  if (!preferredLanguages || preferredLanguages.length === 0) {
    return channels.slice(0, limit);
  }

  const matched = channels.filter((ch) =>
    preferredLanguages.some((lang) => channelMatchesLanguage(ch, lang))
  );

  return matched.slice(0, limit);
}
