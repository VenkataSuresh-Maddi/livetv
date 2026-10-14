import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  combineIptvOrgMetadata,
  IptvOrgDatasets,
} from '../src/services/iptvOrgApi';
import { rankCategories } from '../src/services/categories';
import { extractLanguages, channelMatchesLanguage } from '../src/services/languages';
import { Channel } from '../src/types';

describe('IPTV-org Official API Metadata Processing & Normalization', () => {
  const mockDatasets: IptvOrgDatasets = {
    channels: [
      {
        id: 'star-maa.in',
        name: 'Star Maa',
        alt_names: ['Star Maa Telugu', 'Maa TV'],
        categories: ['entertainment'],
        country: 'in',
        website: 'https://starmaa.com',
      },
      {
        id: 'star-maa-movies.in',
        name: 'Star Maa Movies',
        alt_names: ['Star Maa Movies HD'],
        categories: ['movies'],
        country: 'in',
      },
      {
        id: 'sun-tv.in',
        name: 'Sun TV',
        categories: ['entertainment'],
        country: 'in',
      },
      {
        id: 'aaj-tak.in',
        name: 'Aaj Tak',
        categories: ['news'],
        country: 'in',
      },
      {
        id: 'multilingual-news.in',
        name: 'Global India News',
        categories: ['news'],
        country: 'in',
      },
      {
        id: 'generic-channel.in',
        name: 'Unclassified Broadcaster',
        country: 'in',
      },
      {
        id: 'unknown-lang.fr',
        name: 'Mysterious TV',
        categories: ['lifestyle'],
        country: 'fr',
      },
    ],
    feeds: [
      {
        channel: 'star-maa.in',
        id: 'star-maa.in@main',
        languages: ['tel'], // ISO 639-3 for Telugu
      },
      {
        channel: 'star-maa-movies.in',
        id: 'star-maa-movies.in@main',
        languages: ['tel'],
      },
      {
        channel: 'sun-tv.in',
        id: 'sun-tv.in@feed1',
        languages: ['tam'], // ISO 639-3 for Tamil
      },
      {
        channel: 'sun-tv.in',
        id: 'sun-tv.in@feed2', // Second feed for same channel
        languages: ['tam'],
      },
      {
        channel: 'aaj-tak.in',
        id: 'aaj-tak.in@main',
        languages: ['hin'], // ISO 639-3 for Hindi
      },
      {
        channel: 'multilingual-news.in',
        id: 'multilingual-news.in@feed1',
        languages: ['hin', 'eng'], // Multiple languages in single feed
      },
      // Note: generic-channel.in has NO feeds
      // Note: unknown-lang.fr has feed with no languages
      {
        channel: 'unknown-lang.fr',
        id: 'unknown-lang.fr@main',
        languages: [],
      },
    ],
    logos: [
      {
        channel: 'star-maa.in',
        url: 'https://logos.com/star-maa.png',
        in_use: true,
      },
      {
        channel: 'sun-tv.in',
        url: 'https://logos.com/sun-tv.png',
        in_use: true,
      },
    ],
    streams: [
      {
        channel: 'star-maa.in',
        url: 'https://live.stream/star-maa-720p.m3u8',
        quality: '720p',
      },
      {
        channel: 'star-maa.in',
        url: 'https://live.stream/star-maa-1080p.m3u8',
        quality: '1080p', // Better quality
      },
      {
        channel: 'star-maa-movies.in',
        url: 'https://live.stream/star-maa-movies.m3u8',
        quality: '1080p',
      },
      {
        channel: 'sun-tv.in',
        url: 'https://live.stream/sun-tv.m3u8',
        quality: 'HD',
      },
      {
        channel: 'aaj-tak.in',
        url: 'https://live.stream/aaj-tak.m3u8',
        quality: '720p',
      },
      {
        channel: 'multilingual-news.in',
        url: 'https://live.stream/multi-news.m3u8',
        quality: '1080p',
      },
      {
        channel: 'generic-channel.in',
        url: 'https://live.stream/generic.m3u8',
      },
      {
        channel: 'unknown-lang.fr',
        url: 'https://live.stream/mystery.m3u8',
      },
    ],
    categories: [
      { id: 'entertainment', name: 'Entertainment' },
      { id: 'movies', name: 'Movies' },
      { id: 'news', name: 'News' },
      { id: 'lifestyle', name: 'Lifestyle' },
      { id: 'sports', name: 'Sports' },
    ],
    languages: [
      { code: 'tel', name: 'Telugu' },
      { code: 'tam', name: 'Tamil' },
      { code: 'hin', name: 'Hindi' },
      { code: 'eng', name: 'English' },
      { code: 'kan', name: 'Kannada' },
      { code: 'mal', name: 'Malayalam' },
      { code: 'ben', name: 'Bengali' },
      { code: 'mar', name: 'Marathi' },
    ],
    countries: [
      { code: 'IN', name: 'India', flag: '🇮🇳' },
      { code: 'FR', name: 'France', flag: '🇫🇷' },
    ],
  };

  it('matches feeds and streams to channels using channel IDs and maps ISO 639-3 languages', () => {
    const combined = combineIptvOrgMetadata(mockDatasets, []);

    // 1. Star Maa should have Telugu language mapped from 'tel'
    const starMaa = combined.find((c) => c.id === 'star-maa.in');
    assert.ok(starMaa, 'Star Maa must be in combined channels');
    assert.strictEqual(starMaa.name, 'Star Maa');
    assert.strictEqual(starMaa.language, 'Telugu');
    assert.deepStrictEqual(starMaa.languages, ['Telugu']);
    assert.strictEqual(starMaa.group, 'Entertainment');
    assert.strictEqual(starMaa.country, 'IN');
    assert.strictEqual(starMaa.countryName, 'India');
    assert.strictEqual(starMaa.logo, 'https://logos.com/star-maa.png');
    assert.strictEqual(starMaa.website, 'https://starmaa.com');

    // 2. Streams sorted by quality: 1080p must be primary over 720p
    assert.strictEqual(
      starMaa.url,
      'https://live.stream/star-maa-1080p.m3u8',
      'Higher quality 1080p stream must be primary'
    );
    assert.strictEqual(starMaa.resolution, '1080p');
    assert.strictEqual(starMaa.streamVariants?.length, 2);
  });

  it('correctly handles multiple languages for a single channel across feeds', () => {
    const combined = combineIptvOrgMetadata(mockDatasets, []);

    const multi = combined.find((c) => c.id === 'multilingual-news.in');
    assert.ok(multi);
    assert.ok(multi.languages?.includes('Hindi'));
    assert.ok(multi.languages?.includes('English'));

    // Should match both Hindi and English
    assert.ok(channelMatchesLanguage(multi, 'Hindi'));
    assert.ok(channelMatchesLanguage(multi, 'English'));
  });

  it('does not count a channel multiple times in language totals even with multiple feeds', () => {
    const combined = combineIptvOrgMetadata(mockDatasets, []);

    // Sun TV has 2 feeds with 'tam'
    const sunTv = combined.find((c) => c.id === 'sun-tv.in');
    assert.ok(sunTv);
    assert.deepStrictEqual(sunTv.languages, ['Tamil']);

    // Extract languages and check counts
    const langStats = extractLanguages(combined);
    const tamil = langStats.find((l) => l.name === 'Tamil');
    assert.ok(tamil);
    assert.strictEqual(
      tamil.count,
      1,
      'Sun TV should be counted exactly once in Tamil count despite having 2 feeds'
    );
  });

  it('marks unknown languages as Unknown rather than falsely defaulting to English', () => {
    const combined = combineIptvOrgMetadata(mockDatasets, []);

    const mystery = combined.find((c) => c.id === 'unknown-lang.fr');
    assert.ok(mystery);
    assert.strictEqual(
      mystery.language,
      'Unknown',
      'Channel with missing feed language must be Unknown, not English'
    );
  });

  it('places channels without categories into Uncategorized instead of inventing one', () => {
    const combined = combineIptvOrgMetadata(mockDatasets, []);

    const generic = combined.find((c) => c.id === 'generic-channel.in');
    assert.ok(generic);
    assert.strictEqual(
      generic.group,
      'Uncategorized',
      'Channel without category metadata must be Uncategorized'
    );
    assert.deepStrictEqual(generic.categories, ['Uncategorized']);
  });

  it('preserves verified curated channels without replacing working stream URLs', () => {
    const curatedSample: Channel[] = [
      {
        id: 'star-maa.in',
        name: 'Star Maa (Curated Verified)',
        logo: 'https://curated.com/logo.png',
        url: 'https://verified.server/star-maa-curated.m3u8',
        group: 'Entertainment',
        language: 'Telugu',
        isVerified: true,
      },
    ];

    const combined = combineIptvOrgMetadata(mockDatasets, curatedSample);
    const starMaa = combined.find((c) => c.id === 'star-maa.in');
    assert.ok(starMaa);
    assert.strictEqual(
      starMaa.url,
      'https://verified.server/star-maa-curated.m3u8',
      'Curated verified stream URL must be preserved'
    );
    assert.strictEqual(starMaa.isVerified, true);
    // But alternative streams and metadata from IPTV-org are appended
    assert.ok(starMaa.streamVariants?.includes('https://live.stream/star-maa-1080p.m3u8'));
  });

  describe('Dynamic Category Ranking (Signals & Labels)', () => {
    it('ranks by available stream signals and labels as Explore Categories when no play history exists', () => {
      const combined = combineIptvOrgMetadata(mockDatasets, []);
      const ranking = rankCategories(combined);

      assert.strictEqual(ranking.hasGenuineUsageData, false);
      assert.strictEqual(
        ranking.label,
        'Explore Categories',
        'Must NOT label as Popular Categories without genuine play history'
      );
      assert.strictEqual(ranking.rankingSource, 'catalog_signals');

      // Entertainment has 2 channels (star-maa, sun-tv), News has 2 (aaj-tak, multi-news)
      // Both should rank higher than Movies (1 channel)
      assert.ok(ranking.categories.length > 0);
      const topCats = ranking.categories.map((c) => c.name);
      assert.ok(topCats.includes('Entertainment'));
      assert.ok(topCats.includes('News'));
      assert.ok(topCats.includes('Movies'));

      // Empty categories (Sports: 0 channels) must be excluded
      assert.ok(!topCats.includes('Sports'), 'Empty categories must be excluded from ranking');
    });

    it('ranks dynamically by genuine viewing events and labels as Popular Categories when usage data exists', () => {
      const combined = combineIptvOrgMetadata(mockDatasets, []);

      // Simulate genuine user playback: Movies played 10 times, News played 2 times
      const usageStats = {
        channelViews: {
          'star-maa-movies.in': 10,
          'aaj-tak.in': 2,
        },
      };

      const ranking = rankCategories(combined, usageStats);

      assert.strictEqual(ranking.hasGenuineUsageData, true);
      assert.strictEqual(
        ranking.label,
        'Popular Categories',
        'Must label as Popular Categories when genuine play history exists'
      );
      assert.strictEqual(ranking.rankingSource, 'user_views');

      // Movies should now be #1 because of 10 genuine play events
      assert.strictEqual(
        ranking.categories[0].name,
        'Movies',
        'Movies must rank first due to highest viewing count'
      );
      assert.strictEqual(ranking.categories[0].viewCount, 10);
    });
  });
});
