import { Channel, Category, RankedCategory, CategoryRankingResult } from '../types';

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

/**
 * Dynamically ranks categories based on available measurable signals in priority order:
 * 1. Actual channel viewing counts or play events (if collected).
 * 2. Aggregated usage statistics (if available).
 * 3. Number of distinct channels in each category that have valid stream URLs.
 * 4. Number of distinct stream sources per category (as secondary signal).
 *
 * Requirements:
 * - Deterministic sorting and stable tie-breakers.
 * - Prevents duplicate channels from inflating category counts (using Set of channel IDs).
 * - Excludes empty categories.
 * - Labels as "Popular Categories" ONLY when supported by genuine usage data.
 *   Otherwise labels as "Explore Categories" or "Most Channels".
 */
export function rankCategories(
  channels: Channel[],
  usageStats?: {
    channelViews?: Record<string, number>;
    recentChannels?: Array<{ channelId: string; timestamp: number }>;
  }
): CategoryRankingResult {
  const categoryChannelSets = new Map<string, Set<string>>();
  const categoryStreamSets = new Map<string, Set<string>>();
  const categoryViewCounts = new Map<string, number>();
  const categoryNameMap = new Map<string, string>();

  // Aggregate user views if available
  const viewsByChannelId: Record<string, number> = { ...(usageStats?.channelViews || {}) };
  if (usageStats?.recentChannels) {
    for (const recent of usageStats.recentChannels) {
      viewsByChannelId[recent.channelId] = (viewsByChannelId[recent.channelId] || 0) + 1;
    }
  }

  let totalGenuineViews = 0;

  for (const ch of channels) {
    // Check if channel has a valid stream URL
    if (!ch.url || (!ch.url.startsWith('http://') && !ch.url.startsWith('https://'))) {
      continue;
    }

    const cats = extractChannelCategories(ch);
    const chViews = viewsByChannelId[ch.id] || ch.viewCount || 0;
    if (chViews > 0) {
      totalGenuineViews += chViews;
    }

    // Collect all unique stream URLs for this channel
    const chStreamUrls = new Set<string>();
    chStreamUrls.add(ch.url);
    if (ch.streamVariants) {
      for (const v of ch.streamVariants) {
        if (v && (v.startsWith('http://') || v.startsWith('https://'))) chStreamUrls.add(v);
      }
    }
    if (ch.streams) {
      for (const s of ch.streams) {
        if (s.url && (s.url.startsWith('http://') || s.url.startsWith('https://'))) chStreamUrls.add(s.url);
      }
    }

    for (const catName of cats) {
      const catId = catName.toLowerCase();
      categoryNameMap.set(catId, catName);

      if (!categoryChannelSets.has(catId)) {
        categoryChannelSets.set(catId, new Set<string>());
        categoryStreamSets.set(catId, new Set<string>());
        categoryViewCounts.set(catId, 0);
      }

      // Add channel ID (ensures distinct channel count, preventing duplicate inflation)
      categoryChannelSets.get(catId)!.add(ch.id);

      // Add stream URLs
      const streamSet = categoryStreamSets.get(catId)!;
      for (const sUrl of chStreamUrls) {
        streamSet.add(sUrl);
      }

      // Add view counts
      if (chViews > 0) {
        categoryViewCounts.set(catId, (categoryViewCounts.get(catId) || 0) + chViews);
      }
    }
  }

  const hasGenuineUsageData = totalGenuineViews > 0;
  const rankingSource = hasGenuineUsageData ? 'user_views' : 'catalog_signals';
  const label = hasGenuineUsageData ? 'Popular Categories' : 'Explore Categories';
  const description = hasGenuineUsageData
    ? 'Ranked by your actual viewing history and stream playback'
    : 'Ranked by channel availability and live stream coverage';

  // Canonical ordering preference used as a stable tie-breaker
  const canonicalPriority = [
    'entertainment',
    'movies',
    'sports',
    'news',
    'music',
    'devotional',
    'kids',
    'documentary',
    'lifestyle',
    'general',
  ];

  const ranked: RankedCategory[] = [];

  for (const [catId, chSet] of categoryChannelSets.entries()) {
    // Exclude empty categories
    if (chSet.size === 0) continue;

    const distinctChannels = chSet.size;
    const distinctStreams = categoryStreamSets.get(catId)?.size || distinctChannels;
    const viewCount = categoryViewCounts.get(catId) || 0;
    const displayName = categoryNameMap.get(catId) || catId;

    // Deterministic score calculation
    const score = hasGenuineUsageData
      ? viewCount * 10000 + distinctChannels * 10 + distinctStreams * 0.1
      : distinctChannels * 100 + distinctStreams;

    ranked.push({
      id: catId,
      name: displayName,
      count: distinctChannels,
      streamCount: distinctStreams,
      viewCount,
      score,
    });
  }

  // Deterministic sorting with stable tie-breakers
  ranked.sort((a, b) => {
    if (hasGenuineUsageData) {
      // 1. Viewing counts / play events
      if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
      // 3. Distinct channels
      if (b.count !== a.count) return b.count - a.count;
      // 4. Distinct streams
      if (b.streamCount !== a.streamCount) return b.streamCount - a.streamCount;
      // Stable tie-breaker: Alphabetical
      return a.name.localeCompare(b.name);
    } else {
      // 3. Distinct channels with valid stream URLs
      if (b.count !== a.count) return b.count - a.count;
      // 4. Distinct streams
      if (b.streamCount !== a.streamCount) return b.streamCount - a.streamCount;
      // Tie-breaker: Canonical priority
      const aIdx = canonicalPriority.indexOf(a.id);
      const bIdx = canonicalPriority.indexOf(b.id);
      if (aIdx !== -1 && bIdx !== -1 && aIdx !== bIdx) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      // Stable tie-breaker: Alphabetical
      return a.name.localeCompare(b.name);
    }
  });

  return {
    categories: ranked,
    rankingSource,
    label,
    description,
    hasGenuineUsageData,
  };
}

/**
 * Standard priority order for category sections.
 * Entertainment, Movies, Sports, News, Music, Devotional, Kids, Documentary, Lifestyle, General, Uncategorized.
 */
export const MY_LIST_CATEGORY_ORDER = [
  'entertainment',
  'movies',
  'sports',
  'news',
  'music',
  'devotional',
  'kids',
  'documentary',
  'lifestyle',
  'general',
  'uncategorized',
];

/**
 * Known verified channel classifications used when category metadata in 3rd-party playlists
 * is missing or set to a generic fallback like "General".
 */
export const VERIFIED_CHANNEL_CLASSIFICATIONS: Record<string, string> = {
  // Telugu
  'star-maa': 'Entertainment',
  'star-maa-telugu': 'Entertainment',
  'star-maa-hd': 'Entertainment',
  'star-maa-movies': 'Movies',
  'star-maa-movies-hd': 'Movies',
  'sun-gemini': 'Entertainment',
  'sun-gemini-tv': 'Entertainment',
  'gemini-tv': 'Entertainment',
  'zee-telugu': 'Entertainment',
  'zee-telugu-hd': 'Entertainment',
  'etv-telugu': 'Entertainment',
  'tv9-telugu': 'News',
  'v6-news': 'News',
  'abn-andhra-jyothi': 'News',
  'ntv-telugu': 'News',
  'bhakti-tv': 'Devotional',
  // Hindi
  'aaj-tak': 'News',
  'ndtv-india': 'News',
  'star-plus': 'Entertainment',
  'zee-tv': 'Entertainment',
  'colors-tv': 'Entertainment',
  'aastha-tv': 'Devotional',
  // Tamil
  'sun-tv': 'Entertainment',
  'star-vijay': 'Entertainment',
  'sun-news': 'News',
  'thanthi-tv': 'News',
  // Sports
  'star-sports': 'Sports',
  'sony-sports': 'Sports',
  'redbull-tv': 'Sports',
  // Movies
  'cinema-hd': 'Movies',
};

/**
 * Resolves a channel's primary category using canonical channel records and reliable metadata.
 * Does not classify based solely on name if reliable category metadata already exists.
 * If a channel genuinely has no category and cannot be determined reliably, returns 'Uncategorized'.
 */
export function getChannelCanonicalCategory(
  channel: Channel,
  canonicalCatalog?: Channel[]
): string {
  const hasExplicitGroup = Boolean(channel.group && channel.group.trim().length > 0);
  const rawGroup = (channel.group || '').trim();
  const rawGroupLower = rawGroup.toLowerCase();

  // 1. If channel already has reliable specific category metadata (not General/Uncategorized/Other), use it
  if (hasExplicitGroup && rawGroupLower !== 'general' && rawGroupLower !== 'uncategorized' && rawGroupLower !== 'other') {
    return normalizeCategoryName(rawGroup);
  }

  // If channel has categories array with a specific category
  if (channel.categories && channel.categories.length > 0) {
    const firstCat = channel.categories[0].trim();
    const firstCatLower = firstCat.toLowerCase();
    if (firstCatLower && firstCatLower !== 'general' && firstCatLower !== 'uncategorized' && firstCatLower !== 'other') {
      return normalizeCategoryName(firstCat);
    }
  }

  // 2. The category is 'General' or missing. Check canonical channel records in catalog/curated channels
  if (canonicalCatalog && canonicalCatalog.length > 0) {
    const canonicalMatch = canonicalCatalog.find((c) => {
      if (c.id === channel.id) return true;
      if (channel.tvgId && c.tvgId && c.tvgId.toLowerCase() === channel.tvgId.toLowerCase()) return true;
      if (c.name.toLowerCase() === channel.name.toLowerCase()) return true;
      // Match well-known broadcaster in canonical catalog
      const cName = c.name.toLowerCase();
      const chName = channel.name.toLowerCase();
      if (
        (cName.includes('gemini') && chName.includes('gemini')) ||
        (cName.includes('star maa') && chName.includes('star maa')) ||
        (cName.includes('zee telugu') && chName.includes('zee telugu'))
      ) {
        return true;
      }
      return false;
    });

    if (canonicalMatch) {
      const canonGroup = (canonicalMatch.group || '').trim().toLowerCase();
      if (canonGroup && canonGroup !== 'general' && canonGroup !== 'uncategorized') {
        return normalizeCategoryName(canonicalMatch.group);
      }
      if (canonicalMatch.categories && canonicalMatch.categories.length > 0) {
        const cat = canonicalMatch.categories[0].trim().toLowerCase();
        if (cat && cat !== 'general' && cat !== 'uncategorized') {
          return normalizeCategoryName(canonicalMatch.categories[0]);
        }
      }
    }
  }

  // 3. Check reliable verified channel classifications by ID (e.g. sun-gemini / star-maa / zee-telugu)
  const idNormalized = (channel.id || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
  for (const [key, category] of Object.entries(VERIFIED_CHANNEL_CLASSIFICATIONS)) {
    if (idNormalized === key || idNormalized.startsWith(key)) {
      return category;
    }
  }

  // Match by tvgId identifier if present
  if (channel.tvgId) {
    const tvgNormalized = channel.tvgId.toLowerCase();
    if (tvgNormalized.includes('gemini') || tvgNormalized.includes('sun')) {
      return 'Entertainment';
    }
    if (tvgNormalized.includes('starmaa') || tvgNormalized.includes('star-maa')) {
      if (tvgNormalized.includes('movie')) return 'Movies';
      return 'Entertainment';
    }
    if (tvgNormalized.includes('zeetelugu')) {
      return 'Entertainment';
    }
  }

  // 4. If actual category cannot be determined reliably:
  if (hasExplicitGroup && rawGroupLower === 'general') {
    return 'General';
  }

  // If genuinely has no category metadata
  return 'Uncategorized';
}

export interface CategoryGroup {
  id: string;
  name: string;
  count: number;
  channels: Channel[];
}

/**
 * Groups a list of channels (such as My List saved channels) by their primary content category.
 * - Channels within each category are sorted alphabetically by display name.
 * - Sections are ordered consistently: Entertainment, Movies, Sports, News, Music, Devotional, Kids, ... General, Uncategorized.
 * - Empty category sections are omitted.
 * - Channels are never duplicated within the same section.
 */
export function groupChannelsByCategory(
  channels: Channel[],
  canonicalCatalog?: Channel[]
): CategoryGroup[] {
  if (!channels || channels.length === 0) return [];

  const groupsMap = new Map<string, Channel[]>();

  for (const channel of channels) {
    const category = getChannelCanonicalCategory(channel, canonicalCatalog);
    if (!groupsMap.has(category)) {
      groupsMap.set(category, []);
    }
    const groupChannels = groupsMap.get(category)!;
    if (!groupChannels.some((c) => c.id === channel.id)) {
      groupChannels.push(channel);
    }
  }

  const result: CategoryGroup[] = [];

  for (const [categoryName, chList] of groupsMap.entries()) {
    if (chList.length === 0) continue;

    // Sort channels alphabetically by display name within each category
    const sortedChannels = [...chList].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })
    );

    result.push({
      id: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: categoryName,
      count: sortedChannels.length,
      channels: sortedChannels,
    });
  }

  // Sort groups in consistent canonical order
  result.sort((a, b) => {
    const aId = a.name.toLowerCase();
    const bId = b.name.toLowerCase();

    const aIdx = MY_LIST_CATEGORY_ORDER.indexOf(aId);
    const bIdx = MY_LIST_CATEGORY_ORDER.indexOf(bId);

    // If both are in priority list
    if (aIdx !== -1 && bIdx !== -1) {
      return aIdx - bIdx;
    }
    // If a is in priority list
    if (aIdx !== -1) {
      // General and Uncategorized should come after custom categories
      if (aId === 'general' || aId === 'uncategorized') {
        return 1;
      }
      return -1;
    }
    // If b is in priority list
    if (bIdx !== -1) {
      if (bId === 'general' || bId === 'uncategorized') {
        return -1;
      }
      return 1;
    }
    // Both are custom categories: sort alphabetically
    return a.name.localeCompare(b.name);
  });

  return result;
}

