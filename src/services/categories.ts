import { Channel, Category } from '../types';

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  aliases: string[];
}

export const CANONICAL_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'TV series, drama, comedy, shows and variety entertainment',
    aliases: ['entertainment', 'series', 'shows', 'drama', 'comedy', 'sitcom', 'variety', 'soap', 'telenovela'],
  },
  {
    id: 'sports',
    name: 'Sports',
    description: 'Live sports, racing, football, cricket, athletics and outdoor action',
    aliases: ['sports', 'sport', 'cricket', 'football', 'soccer', 'racing', 'motorsport', 'motorsports', 'tennis', 'athletics', 'outdoor', 'combat', 'nfl', 'nba', 'fifa'],
  },
  {
    id: 'news',
    name: 'News',
    description: '24/7 breaking news, politics, world events and financial markets',
    aliases: ['news', 'current affairs', 'weather', 'business', 'business news', 'politics', 'world news'],
  },
  {
    id: 'movies',
    name: 'Movies',
    description: 'Feature films, cinema classics, action and blockbusters',
    aliases: ['movies', 'movie', 'cinema', 'film', 'films', 'blockbuster', 'blockbusters'],
  },
  {
    id: 'kids',
    name: 'Kids',
    description: 'Animated series, cartoons, family entertainment and children programs',
    aliases: ['kids', 'children', 'cartoons', 'cartoon', 'animation', 'family', 'anime', 'youth'],
  },
  {
    id: 'devotional',
    name: 'Devotional',
    description: 'Faith, spiritual broadcasts, religious sermons, pooja and gospel',
    aliases: ['devotional', 'religious', 'religion', 'faith', 'spiritual', 'gospel', 'hindu', 'islamic', 'christian', 'bhakti', 'pooja'],
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Music videos, live concerts, dance, radio and musical performances',
    aliases: ['music', 'radio', 'concerts', 'songs', 'musical', 'dance', 'hits'],
  },
  {
    id: 'documentary',
    name: 'Documentary',
    description: 'Nature, science, history, space, technology and culture',
    aliases: ['documentary', 'documentaries', 'science', 'nature', 'wildlife', 'history', 'culture', 'education', 'space'],
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Cooking, travel, fashion, auto, health and home design',
    aliases: ['lifestyle', 'travel', 'food', 'cooking', 'auto', 'fashion', 'health', 'home'],
  },
  {
    id: 'general',
    name: 'General',
    description: 'General broadcast and variety programming',
    aliases: ['general', 'miscellaneous', 'other'],
  },
];

/**
 * Normalizes a category string to Title Case.
 * Maps known aliases to canonical category names (e.g., 'religious' -> 'Devotional').
 */
export function normalizeCategoryName(raw?: string): string {
  if (!raw) return 'General';

  const cleaned = raw.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return 'General';

  const lower = cleaned.toLowerCase();

  // Match canonical category aliases
  for (const cat of CANONICAL_CATEGORIES) {
    if (cat.id === lower || cat.name.toLowerCase() === lower || cat.aliases.includes(lower)) {
      return cat.name;
    }
  }

  // Handle plural / singular variants
  if (lower.endsWith('s') && lower.length > 3) {
    const singular = lower.slice(0, -1);
    for (const cat of CANONICAL_CATEGORIES) {
      if (cat.aliases.includes(singular)) return cat.name;
    }
  }

  // Format arbitrary custom playlist category in Title Case
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Splits a composite category string (delimited by ;, /, ,, |, +, &)
 * into an array of distinct normalized category names.
 */
export function splitCategoryString(rawGroup?: string): string[] {
  if (!rawGroup || !rawGroup.trim()) return ['General'];

  // Split by common M3U delimiters: semicolon, comma, slash, pipe, plus
  const parts = rawGroup.split(/[;/,|+\\]+/);
  const normalizedSet = new Set<string>();

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) {
      const norm = normalizeCategoryName(trimmed);
      normalizedSet.add(norm);
    }
  }

  const result = Array.from(normalizedSet);
  return result.length > 0 ? result : ['General'];
}

/**
 * Extracts all normalized categories a channel belongs to.
 */
export function extractChannelCategories(channel: {
  group?: string;
  categories?: string[];
}): string[] {
  if (channel.categories && Array.isArray(channel.categories) && channel.categories.length > 0) {
    return channel.categories;
  }
  return splitCategoryString(channel.group);
}

/**
 * Checks whether a channel matches a target category filter.
 * Supports 'all', canonical category IDs, names, and aliases.
 */
export function channelMatchesCategory(
  channel: Channel | { group?: string; categories?: string[] },
  targetCategory: string
): boolean {
  if (!targetCategory || targetCategory.toLowerCase() === 'all') {
    return true;
  }

  const normalizedTarget = normalizeCategoryName(targetCategory).toLowerCase();
  const channelCats = extractChannelCategories(channel).map((c) => c.toLowerCase());

  // Direct match against channel's normalized categories
  if (channelCats.includes(normalizedTarget)) {
    return true;
  }

  // Check if target is an alias for any of channel's categories
  for (const cat of CANONICAL_CATEGORIES) {
    if (cat.name.toLowerCase() === normalizedTarget || cat.id === normalizedTarget) {
      for (const chCat of channelCats) {
        if (cat.name.toLowerCase() === chCat || cat.id === chCat || cat.aliases.includes(chCat)) {
          return true;
        }
      }
    }
  }

  // Fallback direct group check
  const rawGroup = (channel.group || '').toLowerCase();
  if (rawGroup === normalizedTarget || rawGroup.includes(normalizedTarget)) {
    return true;
  }

  return false;
}

/**
 * Extracts all unique categories present across the channel list and computes accurate counts.
 * Uses existing channel metadata as the single source of truth.
 */
export function extractCategories(channels: Channel[]): Category[] {
  const counts = new Map<string, { id: string; name: string; count: number }>();

  for (const ch of channels) {
    const channelCats = extractChannelCategories(ch);
    const seenInChannel = new Set<string>();

    for (const catName of channelCats) {
      const catId = catName.toLowerCase();
      if (!seenInChannel.has(catId)) {
        seenInChannel.add(catId);
        const current = counts.get(catId);
        if (current) {
          current.count += 1;
        } else {
          counts.set(catId, {
            id: catId,
            name: catName,
            count: 1,
          });
        }
      }
    }
  }

  // Canonical ordering preference
  const priorityOrder = [
    'entertainment',
    'sports',
    'news',
    'movies',
    'kids',
    'devotional',
    'music',
    'documentary',
    'lifestyle',
    'general',
  ];

  const sortedList = Array.from(counts.values()).sort((a, b) => {
    const aIdx = priorityOrder.indexOf(a.id);
    const bIdx = priorityOrder.indexOf(b.id);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return [
    { id: 'all', name: 'All Categories', count: channels.length },
    ...sortedList,
  ];
}
