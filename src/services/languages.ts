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
    aliases: ['ori', 'odi', 'or', 'odia', 'oriya', 'oriya (macrolanguage)'],
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
 * Normalizes any raw language string (from feeds.json, ISO 639-3 code, or channel metadata)
 * to a standardized Title Case name (e.g. 'tel' -> 'Telugu', 'hin' -> 'Hindi', 'ori' -> 'Odia').
 * If missing, returns 'Unknown' rather than defaulting to English.
 */
export function normalizeLanguageName(raw?: string): string {
  if (!raw) return 'Unknown';
  const clean = raw.trim();
  if (!clean || clean.toLowerCase() === 'undefined' || clean.toLowerCase() === 'null') {
    return 'Unknown';
  }

  const lower = clean.toLowerCase();
  if (lower === 'unknown') return 'Unknown';

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
 * Uses channel.languages array and channel.language metadata from feeds.json primarily.
 * Correctly handles channels with multiple broadcast languages.
 * Missing languages use carefully controlled fallbacks; unknown languages remain unclassified.
 */
export function channelMatchesLanguage(channel: Channel, language: string): boolean {
  if (!language || language.toLowerCase() === 'all') return true;

  const targetNorm = normalizeLanguageName(language).toLowerCase();

  // 1. Primary check: channel's broadcast languages list from feeds.json
  if (channel.languages && Array.isArray(channel.languages) && channel.languages.length > 0) {
    for (const lang of channel.languages) {
      if (normalizeLanguageName(lang).toLowerCase() === targetNorm) {
        return true;
      }
    }
  }

  // 2. Secondary check: channel's primary language
  if (channel.language && channel.language !== 'Unknown') {
    const chanLang = normalizeLanguageName(channel.language).toLowerCase();
    if (chanLang === targetNorm) {
      return true;
    }
    if (chanLang.includes(targetNorm)) {
      return true;
    }
  }

  // 3. Fallback: Check group-title if it explicitly matches a language
  const groupLower = (channel.group || '').toLowerCase();
  if (groupLower === targetNorm || groupLower.includes(targetNorm)) {
    return true;
  }

  // 4. Last resort controlled heuristic: channel name keywords
  const nameLower = channel.name.toLowerCase();
  const targetDef = ALIAS_TO_CANONICAL.get(targetNorm);
  if (targetDef) {
    const regex = new RegExp(`\\b${targetDef.name.toLowerCase()}\\b`, 'i');
    if (regex.test(nameLower)) {
      return true;
    }

    // Known verified broadcaster patterns
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
 * Prevents counting a channel multiple times for a language even with multiple feeds/streams.
 * Guarantees canonical languages are present and appends all discovered languages.
 */
export function extractLanguages(channels: Channel[]): Language[] {
  // Map: normalizedLanguageName -> Set of unique channel IDs
  const channelSetsByLanguage = new Map<string, Set<string>>();

  for (const ch of channels) {
    const channelLangs = new Set<string>();

    if (ch.languages && Array.isArray(ch.languages) && ch.languages.length > 0) {
      for (const l of ch.languages) {
        const norm = normalizeLanguageName(l);
        if (norm && norm !== 'Unknown') channelLangs.add(norm);
      }
    } else if (ch.language && ch.language !== 'Unknown') {
      const norm = normalizeLanguageName(ch.language);
      if (norm && norm !== 'Unknown') channelLangs.add(norm);
    }

    // Check canonical languages if not already detected
    for (const canon of CANONICAL_LANGUAGES) {
      if (!channelLangs.has(canon.name) && channelMatchesLanguage(ch, canon.name)) {
        channelLangs.add(canon.name);
      }
    }

    // Add channel ID to each matched language set
    for (const langName of channelLangs) {
      if (!channelSetsByLanguage.has(langName)) {
        channelSetsByLanguage.set(langName, new Set<string>());
      }
      channelSetsByLanguage.get(langName)!.add(ch.id);
    }
  }

  const result: Language[] = [];
  const processed = new Set<string>();

  // 1. First add canonical languages in prioritized order
  for (const canon of CANONICAL_LANGUAGES) {
    const count = channelSetsByLanguage.get(canon.name)?.size || 0;
    result.push({
      id: canon.id,
      name: canon.name,
      nativeName: canon.nativeName,
      count,
    });
    processed.add(canon.name.toLowerCase());
  }

  // 2. Add extra discovered languages with valid channels
  for (const [langName, chSet] of channelSetsByLanguage.entries()) {
    if (!processed.has(langName.toLowerCase()) && chSet.size > 0) {
      result.push({
        id: langName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: langName,
        count: chSet.size,
      });
      processed.add(langName.toLowerCase());
    }
  }

  return result;
}

/**
 * Ranks channels within a language section:
 * Prioritizes real viewing history, then stream resolution/quality, then verified status, then alphabetical.
 */
export function rankChannelsForLanguage(
  channels: Channel[],
  language: string,
  usageStats?: { channelViews?: Record<string, number> }
): Channel[] {
  const matching = channels.filter((ch) => channelMatchesLanguage(ch, language));
  const views = usageStats?.channelViews || {};

  return matching.sort((a, b) => {
    // 1. Real viewing history
    const aViews = views[a.id] || a.viewCount || 0;
    const bViews = views[b.id] || b.viewCount || 0;
    if (bViews !== aViews) return bViews - aViews;

    // 2. Verified channels
    if (a.isVerified && !b.isVerified) return -1;
    if (!a.isVerified && b.isVerified) return 1;

    // 3. Resolution/quality (1080p > 720p > HD > others)
    const getResScore = (res?: string) => {
      if (!res) return 0;
      const lower = res.toLowerCase();
      if (lower.includes('4k') || lower.includes('2160p')) return 4;
      if (lower.includes('1080p') || lower.includes('fhd')) return 3;
      if (lower.includes('720p') || lower.includes('hd')) return 2;
      if (lower.includes('576p') || lower.includes('480p')) return 1;
      return 0;
    };
    const resDiff = getResScore(b.resolution) - getResScore(a.resolution);
    if (resDiff !== 0) return resDiff;

    // 4. Alphabetical tie-breaker
    return a.name.localeCompare(b.name);
  });
}

/**
 * Returns prioritized channels matching the user's preferred languages.
 */
export function getRecommendedChannelsForLanguages(
  channels: Channel[],
  preferredLanguages: string[],
  limit = 24,
  usageStats?: { channelViews?: Record<string, number> }
): Channel[] {
  if (!preferredLanguages || preferredLanguages.length === 0) {
    return channels.slice(0, limit);
  }

  const matched = channels.filter((ch) =>
    preferredLanguages.some((lang) => channelMatchesLanguage(ch, lang))
  );

  const views = usageStats?.channelViews || {};

  const sorted = matched.sort((a, b) => {
    const aViews = views[a.id] || a.viewCount || 0;
    const bViews = views[b.id] || b.viewCount || 0;
    if (bViews !== aViews) return bViews - aViews;
    if (a.isVerified && !b.isVerified) return -1;
    if (!a.isVerified && b.isVerified) return 1;
    return a.name.localeCompare(b.name);
  });

  return sorted.slice(0, limit);
}
