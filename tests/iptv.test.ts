import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseM3U, CURATED_CHANNELS, extractCategories, extractCountries } from '../src/services/iptv';

describe('IPTV M3U Parser (No Arbitrary Cap & Accurate Parsing)', () => {
  it('should parse beyond 1,500 entries without stopping', () => {
    // Generate an M3U playlist with 2,500 entries
    const testCount = 2500;
    const entries: string[] = ['#EXTM3U'];

    for (let i = 1; i <= testCount; i++) {
      entries.push(
        `#EXTINF:-1 tvg-id="channel.${i}" tvg-name="Channel ${i}" tvg-logo="https://logo.com/${i}.png" group-title="Category ${i % 10}",Channel ${i}`
      );
      entries.push(`https://stream.server.com/live/${i}.m3u8`);
    }

    const m3uContent = entries.join('\n');
    const parsed = parseM3U(m3uContent);

    assert.strictEqual(
      parsed.length,
      testCount,
      `Parser must parse all ${testCount} channels without being capped at 1,500`
    );
    assert.strictEqual(parsed[0].name, 'Channel 1');
    assert.strictEqual(parsed[testCount - 1].name, `Channel ${testCount}`);
    assert.strictEqual(parsed[0].group, 'Category 1');
    assert.strictEqual(parsed[0].logo, 'https://logo.com/1.png');
  });

  it('should extract categories and count them accurately', () => {
    const mockChannels = [
      { id: '1', name: 'Ch 1', logo: '', url: 'http://1', group: 'News' },
      { id: '2', name: 'Ch 2', logo: '', url: 'http://2', group: 'News' },
      { id: '3', name: 'Ch 3', logo: '', url: 'http://3', group: 'Sports' },
      { id: '4', name: 'Ch 4', logo: '', url: 'http://4', group: 'Movies' },
    ];

    const categories = extractCategories(mockChannels as any);
    const allCat = categories.find((c) => c.id === 'all');
    assert.strictEqual(allCat?.count, 4, 'All categories should count all channels');

    const newsCat = categories.find((c) => c.id === 'news');
    assert.strictEqual(newsCat?.count, 2, 'News category count should be 2');
  });

  it('should contain verified 24/7 channels in curated list', () => {
    assert.ok(CURATED_CHANNELS.length > 5, 'Curated channels list should have active top broadcasters');
    const dw = CURATED_CHANNELS.find((c) => c.id === 'dw-news-en');
    assert.ok(dw, 'DW News must be in curated channels');
    assert.ok(dw.url.includes('.m3u8'), 'DW News URL must be a valid HLS endpoint');

    const tv9 = CURATED_CHANNELS.find((c) => c.id === 'tv9-telugu-live');
    assert.ok(tv9, 'TV9 Telugu must be in curated channels');
    assert.ok(!tv9.url.includes('test-streams.mux.dev'), 'Curated channels must not use placeholder demo streams');
  });

  it('should derive the country from the iptv-org tvg-id suffix', () => {
    const m3u = [
      '#EXTM3U',
      '#EXTINF:-1 tvg-id="StarMaa.in@HD" tvg-logo="https://logo/star.png" group-title="Entertainment",Star Maa HD',
      'https://da86m1sqpm3o0.cloudfront.net/starmaa.m3u8',
      '#EXTINF:-1 tvg-id="DWNews.de@SD" group-title="News",DW News',
      'https://dw.example.com/index.m3u8',
    ].join('\n');

    const parsed = parseM3U(m3u);
    const star = parsed.find((c) => c.name === 'Star Maa HD');
    const dw = parsed.find((c) => c.name === 'DW News');

    assert.strictEqual(star?.country, 'IN', 'tvg-id suffix .in must resolve to India');
    assert.strictEqual(star?.countryName, 'India');
    assert.strictEqual(dw?.country, 'DE');
  });

  it('should apply iptv-org metadata for language and categories', () => {
    const m3u = [
      '#EXTM3U',
      '#EXTINF:-1 tvg-id="ETVTelugu.in@SD" group-title="Undefined",ETV Telugu',
      'https://etv.example.com/index.m3u8',
    ].join('\n');

    const metadata = new Map([
      [
        'ETVTelugu.in',
        { id: 'ETVTelugu.in', name: 'ETV Telugu', country: 'IN', languages: ['tel'], categories: ['news'] },
      ],
    ]);

    const [channel] = parseM3U(m3u, undefined, metadata);
    assert.strictEqual(channel.language, 'Telugu', 'ISO language code must be normalized');
    assert.strictEqual(channel.group, 'News', 'Undefined group must fall back to API categories');
  });

  it('should generate stable channel ids across refreshes', () => {
    const build = (order: string[]) =>
      parseM3U(
        ['#EXTM3U', ...order.flatMap((id) => [
          `#EXTINF:-1 tvg-id="${id}" group-title="News",${id}`,
          `https://stream.example.com/${id}.m3u8`,
        ])].join('\n')
      );

    const first = build(['A.in@SD', 'B.in@SD', 'C.in@SD']);
    const reordered = build(['C.in@SD', 'B.in@SD', 'A.in@SD']);

    const idsFirst = new Map(first.map((c) => [c.name, c.id]));
    const idsReordered = new Map(reordered.map((c) => [c.name, c.id]));

    for (const [name, id] of idsFirst) {
      assert.strictEqual(idsReordered.get(name), id, 'Channel id must not depend on playlist order');
    }
  });
});
