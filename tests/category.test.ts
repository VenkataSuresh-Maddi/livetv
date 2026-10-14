import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Channel } from '../src/types';
import {
  normalizeCategoryName,
  splitCategoryString,
  extractChannelCategories,
  channelMatchesCategory,
  extractCategories,
} from '../src/services/categories';

describe('Category Normalization & Dynamic Categorization Logic', () => {
  it('should normalize known aliases to canonical category names', () => {
    assert.strictEqual(normalizeCategoryName('entertainment'), 'Entertainment');
    assert.strictEqual(normalizeCategoryName('ENTERTAINMENT'), 'Entertainment');
    assert.strictEqual(normalizeCategoryName('series'), 'Entertainment');
    assert.strictEqual(normalizeCategoryName('drama'), 'Entertainment');
    assert.strictEqual(normalizeCategoryName('comedy'), 'Entertainment');

    assert.strictEqual(normalizeCategoryName('sports'), 'Sports');
    assert.strictEqual(normalizeCategoryName('sport'), 'Sports');
    assert.strictEqual(normalizeCategoryName('cricket'), 'Sports');
    assert.strictEqual(normalizeCategoryName('football'), 'Sports');
    assert.strictEqual(normalizeCategoryName('racing'), 'Sports');

    assert.strictEqual(normalizeCategoryName('news'), 'News');
    assert.strictEqual(normalizeCategoryName('current affairs'), 'News');
    assert.strictEqual(normalizeCategoryName('politics'), 'News');

    assert.strictEqual(normalizeCategoryName('movies'), 'Movies');
    assert.strictEqual(normalizeCategoryName('cinema'), 'Movies');
    assert.strictEqual(normalizeCategoryName('films'), 'Movies');

    assert.strictEqual(normalizeCategoryName('kids'), 'Kids');
    assert.strictEqual(normalizeCategoryName('children'), 'Kids');
    assert.strictEqual(normalizeCategoryName('cartoons'), 'Kids');
    assert.strictEqual(normalizeCategoryName('animation'), 'Kids');

    assert.strictEqual(normalizeCategoryName('devotional'), 'Devotional');
    assert.strictEqual(normalizeCategoryName('religious'), 'Devotional');
    assert.strictEqual(normalizeCategoryName('spiritual'), 'Devotional');
    assert.strictEqual(normalizeCategoryName('faith'), 'Devotional');
    assert.strictEqual(normalizeCategoryName('gospel'), 'Devotional');

    assert.strictEqual(normalizeCategoryName('music'), 'Music');
    assert.strictEqual(normalizeCategoryName('radio'), 'Music');

    assert.strictEqual(normalizeCategoryName('documentary'), 'Documentary');
    assert.strictEqual(normalizeCategoryName('science'), 'Documentary');
  });

  it('should handle custom playlist category names cleanly in Title Case', () => {
    assert.strictEqual(normalizeCategoryName('telugu'), 'Telugu');
    assert.strictEqual(normalizeCategoryName('REGIONAL NEWS'), 'Regional News');
    assert.strictEqual(normalizeCategoryName('  lifestyle  '), 'Lifestyle');
    assert.strictEqual(normalizeCategoryName(''), 'General');
    assert.strictEqual(normalizeCategoryName(undefined), 'General');
  });

  it('should split delimited multi-category strings accurately', () => {
    const cats1 = splitCategoryString('Entertainment;Comedy');
    assert.deepStrictEqual(cats1, ['Entertainment']);

    const cats2 = splitCategoryString('Sports;Cricket, Racing');
    assert.deepStrictEqual(cats2, ['Sports']);

    const cats3 = splitCategoryString('Kids / Family | Animation');
    assert.deepStrictEqual(cats3, ['Kids']);

    const cats4 = splitCategoryString('Entertainment;Telugu');
    assert.ok(cats4.includes('Entertainment'));
    assert.ok(cats4.includes('Telugu'));
  });

  it('should match channels dynamically based on metadata without hardcoding', () => {
    const starMaa: Channel = {
      id: 'star-maa',
      name: 'Star Maa',
      logo: '',
      url: 'https://stream.server/star-maa.m3u8',
      group: 'Entertainment',
      categories: ['Entertainment'],
    };

    const sunGemini: Channel = {
      id: 'sun-gemini',
      name: 'Sun Gemini',
      logo: '',
      url: 'https://stream.server/gemini.m3u8',
      group: 'Entertainment',
      categories: ['Entertainment'],
    };

    const zeeTelugu: Channel = {
      id: 'zee-telugu',
      name: 'Zee Telugu',
      logo: '',
      url: 'https://stream.server/zee-telugu.m3u8',
      group: 'Entertainment',
      categories: ['Entertainment'],
    };

    const starSports: Channel = {
      id: 'star-sports-1',
      name: 'Star Sports 1 HD',
      logo: '',
      url: 'https://stream.server/star-sports-1.m3u8',
      group: 'Sports',
      categories: ['Sports'],
    };

    const sonySports: Channel = {
      id: 'sony-sports-ten',
      name: 'Sony Sports Ten 1',
      logo: '',
      url: 'https://stream.server/sony-sports.m3u8',
      group: 'Sports',
      categories: ['Sports'],
    };

    const bhaktiTv: Channel = {
      id: 'bhakti-tv',
      name: 'Bhakti TV',
      logo: '',
      url: 'https://stream.server/bhakti.m3u8',
      group: 'Religious', // Deliberate test of alias normalization
    };

    const cartoonNet: Channel = {
      id: 'cartoon-net',
      name: 'Cartoon Network',
      logo: '',
      url: 'https://stream.server/cn.m3u8',
      group: 'Children', // Deliberate test of alias normalization
    };

    // Entertainment checks
    assert.strictEqual(channelMatchesCategory(starMaa, 'Entertainment'), true);
    assert.strictEqual(channelMatchesCategory(sunGemini, 'Entertainment'), true);
    assert.strictEqual(channelMatchesCategory(zeeTelugu, 'Entertainment'), true);
    assert.strictEqual(channelMatchesCategory(starSports, 'Entertainment'), false);
    assert.strictEqual(channelMatchesCategory(sonySports, 'Entertainment'), false);

    // Sports checks
    assert.strictEqual(channelMatchesCategory(starSports, 'Sports'), true);
    assert.strictEqual(channelMatchesCategory(sonySports, 'Sports'), true);
    assert.strictEqual(channelMatchesCategory(starMaa, 'Sports'), false);
    assert.strictEqual(channelMatchesCategory(sunGemini, 'Sports'), false);

    // Devotional / Religious alias check
    assert.strictEqual(channelMatchesCategory(bhaktiTv, 'Devotional'), true);
    assert.strictEqual(channelMatchesCategory(bhaktiTv, 'Religious'), true);
    assert.strictEqual(channelMatchesCategory(bhaktiTv, 'Entertainment'), false);

    // Kids / Children alias check
    assert.strictEqual(channelMatchesCategory(cartoonNet, 'Kids'), true);
    assert.strictEqual(channelMatchesCategory(cartoonNet, 'Children'), true);
    assert.strictEqual(channelMatchesCategory(cartoonNet, 'Sports'), false);

    // 'all' category matches everything
    assert.strictEqual(channelMatchesCategory(starMaa, 'all'), true);
    assert.strictEqual(channelMatchesCategory(starSports, 'all'), true);
  });

  it('preserves My List behavior without mutating channel category or duplicating records', () => {
    const catalog: Channel[] = [
      { id: 'ch-1', name: 'Star Maa', logo: '', url: 'http://1', group: 'Entertainment' },
      { id: 'ch-2', name: 'Star Sports 1', logo: '', url: 'http://2', group: 'Sports' },
      { id: 'ch-3', name: 'Bhakti TV', logo: '', url: 'http://3', group: 'Devotional' },
    ];

    // User favorites ch-1
    const favorites = ['ch-1'];

    // My list channels
    const myListChannels = catalog.filter((c) => favorites.includes(c.id));
    assert.strictEqual(myListChannels.length, 1);
    assert.strictEqual(myListChannels[0].id, 'ch-1');

    // Category folder channels come from the FULL catalog, not restricted to My List
    const entertainmentFolderChannels = catalog.filter((c) => channelMatchesCategory(c, 'Entertainment'));
    assert.strictEqual(entertainmentFolderChannels.length, 1);
    assert.strictEqual(entertainmentFolderChannels[0].id, 'ch-1');

    const sportsFolderChannels = catalog.filter((c) => channelMatchesCategory(c, 'Sports'));
    assert.strictEqual(sportsFolderChannels.length, 1);
    assert.strictEqual(sportsFolderChannels[0].id, 'ch-2');

    // Adding to or removing from My List does not modify channel.group
    favorites.push('ch-2');
    assert.strictEqual(catalog[1].group, 'Sports');
    assert.strictEqual(channelMatchesCategory(catalog[1], 'Sports'), true);
    assert.strictEqual(channelMatchesCategory(catalog[1], 'Entertainment'), false);

    // Remove from favorites
    const updatedFavs = favorites.filter((id) => id !== 'ch-1');
    assert.strictEqual(updatedFavs.includes('ch-1'), false);
    assert.strictEqual(catalog[0].group, 'Entertainment');
    assert.strictEqual(channelMatchesCategory(catalog[0], 'Entertainment'), true);
  });

  it('extracts unique categories with accurate counts and canonical prioritization', () => {
    const catalog: Channel[] = [
      { id: '1', name: 'Ch 1', logo: '', url: 'http://1', group: 'Entertainment' },
      { id: '2', name: 'Ch 2', logo: '', url: 'http://2', group: 'entertainment' },
      { id: '3', name: 'Ch 3', logo: '', url: 'http://3', group: 'Sports' },
      { id: '4', name: 'Ch 4', logo: '', url: 'http://4', group: 'Religious' },
      { id: '5', name: 'Ch 5', logo: '', url: 'http://5', group: 'Kids;Family' },
    ];

    const extracted = extractCategories(catalog);

    const allCat = extracted.find((c) => c.id === 'all');
    assert.strictEqual(allCat?.count, 5);

    const entCat = extracted.find((c) => c.id === 'entertainment');
    assert.strictEqual(entCat?.count, 2, 'Entertainment and lowercased entertainment should count together');

    const sportsCat = extracted.find((c) => c.id === 'sports');
    assert.strictEqual(sportsCat?.count, 1);

    const devCat = extracted.find((c) => c.id === 'devotional');
    assert.strictEqual(devCat?.count, 1, 'Religious should map to Devotional');

    const kidsCat = extracted.find((c) => c.id === 'kids');
    assert.strictEqual(kidsCat?.count, 1);

    // Verify IDs are unique
    const idSet = new Set(extracted.map((c) => c.id));
    assert.strictEqual(idSet.size, extracted.length, 'All category IDs must be unique');
  });
});
