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
    const nasa = CURATED_CHANNELS.find((c) => c.id === 'nasa-tv');
    assert.ok(nasa, 'NASA TV must be in curated channels');
    assert.ok(nasa.url.includes('.m3u8'), 'NASA TV URL must be a valid HLS endpoint');

    const dw = CURATED_CHANNELS.find((c) => c.id === 'dw-news-en');
    assert.ok(dw, 'DW News must be in curated channels');
  });
});
