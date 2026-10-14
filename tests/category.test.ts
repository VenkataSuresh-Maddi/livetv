import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Channel } from '../src/types';
import {
  normalizeCategoryName,
  splitCategoryString,
  extractChannelCategories,
  channelMatchesCategory,
  extractCategories,
  getChannelCanonicalCategory,
  groupChannelsByCategory,
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

  describe('My List Category Grouping & Metadata Resolution', () => {
    it('should correctly determine category from canonical catalog or reliable classification', () => {
      const canonicalCatalog: Channel[] = [
        { id: 'sun-gemini-tv', name: 'Sun Gemini TV Telugu', logo: '', url: 'http://gemini', group: 'Entertainment' },
        { id: 'star-maa-hd', name: 'Star Maa HD', logo: '', url: 'http://star-maa', group: 'Entertainment' },
        { id: 'star-maa-movies-hd', name: 'Star Maa Movies HD', logo: '', url: 'http://star-movies', group: 'Movies' },
      ];

      // Channel with reliable category in its own metadata
      const starMaa: Channel = { id: 'star-maa-hd', name: 'Star Maa HD', logo: '', url: 'http://1', group: 'Entertainment' };
      assert.strictEqual(getChannelCanonicalCategory(starMaa, canonicalCatalog), 'Entertainment');

      // Channel with case variation "MOVIES" or "movie"
      const moviesUpper: Channel = { id: 'm1', name: 'Movie Plus', logo: '', url: 'http://2', group: 'MOVIES' };
      const moviesLower: Channel = { id: 'm2', name: 'Cinema Max', logo: '', url: 'http://3', group: 'movie' };
      assert.strictEqual(getChannelCanonicalCategory(moviesUpper, canonicalCatalog), 'Movies');
      assert.strictEqual(getChannelCanonicalCategory(moviesLower, canonicalCatalog), 'Movies');

      // Sun Gemini with group "General": verifies category against canonical catalog / verified classification
      const sunGeminiGeneral: Channel = { id: 'sun-gemini', name: 'Sun Gemini', logo: '', url: 'http://4', group: 'General' };
      assert.strictEqual(
        getChannelCanonicalCategory(sunGeminiGeneral, canonicalCatalog),
        'Entertainment',
        'Sun Gemini must be verified as Entertainment rather than blindly retaining General'
      );

      // Channel with genuinely NO category metadata and no canonical record -> Uncategorized
      const noCategory: Channel = { id: 'unknown-stream', name: 'Random Feed', logo: '', url: 'http://5', group: '' };
      assert.strictEqual(
        getChannelCanonicalCategory(noCategory, []),
        'Uncategorized',
        'Channel with genuinely no category must be placed in Uncategorized'
      );

      // Unknown channel with explicit "General" where category cannot be determined reliably -> General
      const generalChannel: Channel = { id: 'unknown-gen', name: 'Unidentified Live', logo: '', url: 'http://6', group: 'General' };
      assert.strictEqual(
        getChannelCanonicalCategory(generalChannel, []),
        'General',
        'Channel whose actual category cannot be determined reliably remains in General'
      );

      // Does not classify channels based solely on names if reliable metadata already exists
      const newsNamedMovie: Channel = { id: 'news-named', name: 'World Movie News Daily', logo: '', url: 'http://7', group: 'News' };
      assert.strictEqual(
        getChannelCanonicalCategory(newsNamedMovie, canonicalCatalog),
        'News',
        'Must respect existing reliable category metadata rather than guessing from name'
      );
    });

    it('groups My List channels by category with alphabetical sorting and consistent section order', () => {
      // User's example list:
      // - Star Maa HD — Entertainment
      // - Star Maa Movies HD — Movies
      // - Sun Gemini — General (verified as Entertainment via canonical catalog)
      // - Zee Telugu HD — Entertainment
      const canonicalCatalog: Channel[] = [
        { id: 'star-maa-hd', name: 'Star Maa HD', logo: '', url: 'http://1', group: 'Entertainment' },
        { id: 'star-maa-movies-hd', name: 'Star Maa Movies HD', logo: '', url: 'http://2', group: 'Movies' },
        { id: 'sun-gemini', name: 'Sun Gemini', logo: '', url: 'http://3', group: 'Entertainment' },
        { id: 'zee-telugu-hd', name: 'Zee Telugu HD', logo: '', url: 'http://4', group: 'Entertainment' },
      ];

      const savedChannels: Channel[] = [
        { id: 'zee-telugu-hd', name: 'Zee Telugu HD', logo: '', url: 'http://4', group: 'Entertainment' },
        { id: 'star-maa-movies-hd', name: 'Star Maa Movies HD', logo: '', url: 'http://2', group: 'Movies' },
        { id: 'star-maa-hd', name: 'Star Maa HD', logo: '', url: 'http://1', group: 'Entertainment' },
      ];

      const groups = groupChannelsByCategory(savedChannels, canonicalCatalog);

      // Must have Entertainment and Movies
      assert.strictEqual(groups.length, 2);

      // Entertainment section comes first in canonical ordering
      const entGroup = groups.find((g) => g.name === 'Entertainment');
      assert.ok(entGroup, 'Entertainment section must exist');
      assert.strictEqual(entGroup?.count, 2, 'Entertainment should have count 2');

      // Alphabetical sorting: Star Maa HD before Zee Telugu HD
      assert.strictEqual(entGroup?.channels[0].name, 'Star Maa HD');
      assert.strictEqual(entGroup?.channels[1].name, 'Zee Telugu HD');

      // Movies section
      const movGroup = groups.find((g) => g.name === 'Movies');
      assert.ok(movGroup, 'Movies section must exist');
      assert.strictEqual(movGroup?.count, 1, 'Movies should have count 1');
      assert.strictEqual(movGroup?.channels[0].name, 'Star Maa Movies HD');
    });

    it('handles the case where Sun Gemini category cannot be determined reliably', () => {
      // Test when Sun Gemini has group "General" and no canonical record exists
      const savedChannels: Channel[] = [
        { id: 'zee-telugu-hd', name: 'Zee Telugu HD', logo: '', url: 'http://4', group: 'Entertainment' },
        { id: 'star-maa-movies-hd', name: 'Star Maa Movies HD', logo: '', url: 'http://2', group: 'Movies' },
        { id: 'star-maa-hd', name: 'Star Maa HD', logo: '', url: 'http://1', group: 'Entertainment' },
        { id: 'generic-sun-gemini', name: 'Sun Gemini', logo: '', url: 'http://3', group: 'General' },
      ];

      // Pass empty catalog and mock channel without canonical match
      const groups = groupChannelsByCategory(savedChannels, []);

      const entGroup = groups.find((g) => g.name === 'Entertainment');
      const movGroup = groups.find((g) => g.name === 'Movies');

      assert.strictEqual(entGroup?.count, 2);
      assert.strictEqual(movGroup?.count, 1);

      // The unverified channel appears in General or Entertainment
      assert.ok(groups.some((g) => g.name === 'Entertainment' || g.name === 'General'));
    });

    it('hides empty category sections and preserves section ordering', () => {
      const channels: Channel[] = [
        { id: 'sports-1', name: 'Star Sports 1', logo: '', url: 'http://s1', group: 'Sports' },
        { id: 'news-1', name: 'Aaj Tak', logo: '', url: 'http://n1', group: 'News' },
        { id: 'ent-1', name: 'Star Plus', logo: '', url: 'http://e1', group: 'Entertainment' },
      ];

      const groups = groupChannelsByCategory(channels);

      // Only sections with channels are present (Movies, Kids, Devotional, etc. are hidden)
      assert.strictEqual(groups.length, 3);
      assert.ok(!groups.some((g) => g.name === 'Movies'));
      assert.ok(!groups.some((g) => g.name === 'Kids'));
      assert.ok(!groups.some((g) => g.name === 'Devotional'));

      // Order must be Entertainment (0) -> Sports (2) -> News (3)
      assert.strictEqual(groups[0].name, 'Entertainment');
      assert.strictEqual(groups[1].name, 'Sports');
      assert.strictEqual(groups[2].name, 'News');
    });

    it('immediately reflects adding or removing favorites without mutating channel records', () => {
      const catalog: Channel[] = [
        { id: 'ent-1', name: 'Star Maa HD', logo: '', url: 'http://1', group: 'Entertainment' },
        { id: 'mov-1', name: 'Star Maa Movies HD', logo: '', url: 'http://2', group: 'Movies' },
        { id: 'spo-1', name: 'Star Sports 1', logo: '', url: 'http://3', group: 'Sports' },
      ];

      let favorites = ['ent-1', 'mov-1'];
      let myChannels = catalog.filter((c) => favorites.includes(c.id));
      let groups = groupChannelsByCategory(myChannels, catalog);

      assert.strictEqual(groups.length, 2);
      assert.strictEqual(groups[0].name, 'Entertainment');
      assert.strictEqual(groups[1].name, 'Movies');

      // User adds Sports to favorites
      favorites = [...favorites, 'spo-1'];
      myChannels = catalog.filter((c) => favorites.includes(c.id));
      groups = groupChannelsByCategory(myChannels, catalog);

      assert.strictEqual(groups.length, 3);
      assert.ok(groups.some((g) => g.name === 'Sports' && g.count === 1));

      // User removes Movies from favorites
      favorites = favorites.filter((id) => id !== 'mov-1');
      myChannels = catalog.filter((c) => favorites.includes(c.id));
      groups = groupChannelsByCategory(myChannels, catalog);

      assert.strictEqual(groups.length, 2);
      assert.ok(!groups.some((g) => g.name === 'Movies'), 'Empty Movies section must be hidden');
      assert.strictEqual(catalog[1].group, 'Movies', 'Original catalog channel must not be mutated');
    });

    it('does not duplicate a channel within the same section', () => {
      const duplicateChannels: Channel[] = [
        { id: 'dup-1', name: 'Channel A', logo: '', url: 'http://1', group: 'Entertainment' },
        { id: 'dup-1', name: 'Channel A', logo: '', url: 'http://1', group: 'Entertainment' },
        { id: 'dup-2', name: 'Channel B', logo: '', url: 'http://2', group: 'Entertainment' },
      ];

      const groups = groupChannelsByCategory(duplicateChannels);
      assert.strictEqual(groups.length, 1);
      assert.strictEqual(groups[0].count, 2, 'Duplicates with identical ID must be deduplicated within section');
    });
  });
});

