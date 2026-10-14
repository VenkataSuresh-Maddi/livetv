import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isPrivateOrReservedIp, validateTargetUrl, rewriteM3U8Playlist } from '../api/proxy';

describe('Production Proxy Security (SSRF Protection)', () => {
  it('should block IPv4 loopback, private, and cloud metadata IPs', () => {
    assert.strictEqual(isPrivateOrReservedIp('127.0.0.1'), true, 'Should block 127.0.0.1');
    assert.strictEqual(isPrivateOrReservedIp('127.255.255.255'), true, 'Should block 127.x');
    assert.strictEqual(isPrivateOrReservedIp('169.254.169.254'), true, 'Should block AWS/GCP metadata');
    assert.strictEqual(isPrivateOrReservedIp('10.0.0.1'), true, 'Should block 10.x private');
    assert.strictEqual(isPrivateOrReservedIp('192.168.1.1'), true, 'Should block 192.168.x private');
    assert.strictEqual(isPrivateOrReservedIp('172.16.0.1'), true, 'Should block 172.16.x private');
    assert.strictEqual(isPrivateOrReservedIp('172.31.255.255'), true, 'Should block 172.31.x private');
    assert.strictEqual(isPrivateOrReservedIp('0.0.0.0'), true, 'Should block 0.0.0.0');
    assert.strictEqual(isPrivateOrReservedIp('224.0.0.1'), true, 'Should block multicast');
  });

  it('should block IPv6 loopback, unique local, and IPv4-mapped IPv6', () => {
    assert.strictEqual(isPrivateOrReservedIp('::1'), true, 'Should block ::1');
    assert.strictEqual(isPrivateOrReservedIp('::'), true, 'Should block ::');
    assert.strictEqual(isPrivateOrReservedIp('fe80::1'), true, 'Should block fe80::');
    assert.strictEqual(isPrivateOrReservedIp('fc00::1'), true, 'Should block fc00::');
    assert.strictEqual(isPrivateOrReservedIp('::ffff:127.0.0.1'), true, 'Should block IPv4-mapped 127.0.0.1');
    assert.strictEqual(isPrivateOrReservedIp('::ffff:169.254.169.254'), true, 'Should block IPv4-mapped metadata');
  });

  it('should allow legitimate public IP addresses', () => {
    assert.strictEqual(isPrivateOrReservedIp('8.8.8.8'), false, 'Should allow Google DNS');
    assert.strictEqual(isPrivateOrReservedIp('1.1.1.1'), false, 'Should allow Cloudflare DNS');
    assert.strictEqual(isPrivateOrReservedIp('151.101.1.69'), false, 'Should allow Fastly CDN');
  });

  it('should reject invalid protocols and forbidden internal ports', async () => {
    const fileRes = await validateTargetUrl('file:///etc/passwd');
    assert.ok(fileRes.error, 'Should reject file:// protocol');

    const ftpRes = await validateTargetUrl('ftp://example.com/stream.m3u8');
    assert.ok(ftpRes.error, 'Should reject ftp:// protocol');

    const sshPortRes = await validateTargetUrl('http://example.com:22/stream.m3u8');
    assert.ok(sshPortRes.error, 'Should reject port 22');

    const redisPortRes = await validateTargetUrl('http://example.com:6379/stream.m3u8');
    assert.ok(redisPortRes.error, 'Should reject port 6379');

    const localHostRes = await validateTargetUrl('http://localhost:3000/api/secret');
    assert.ok(localHostRes.error, 'Should reject localhost hostname');
  });
});

describe('M3U8 Playlist Nested URL Rewriter', () => {
  it('should rewrite relative child playlists and segments with proxy prefix', () => {
    const playlistContent = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=1280x720
chunklist_720.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1920x1080
sub/chunklist_1080.m3u8`;

    const baseUrl = 'https://stream.example.com/live/master.m3u8';
    const rewritten = rewriteM3U8Playlist(playlistContent, baseUrl);

    assert.ok(
      rewritten.includes('/api/proxy?url=' + encodeURIComponent('https://stream.example.com/live/chunklist_720.m3u8')),
      'Should resolve and rewrite relative chunklist_720.m3u8'
    );
    assert.ok(
      rewritten.includes('/api/proxy?url=' + encodeURIComponent('https://stream.example.com/live/sub/chunklist_1080.m3u8')),
      'Should resolve and rewrite sub/chunklist_1080.m3u8'
    );
  });

  it('should rewrite encryption keys and media segments correctly', () => {
    const variantContent = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-KEY:METHOD=AES-128,URI="enc.key"
#EXTINF:6.0,
segment-001.ts
#EXTINF:6.0,
https://cdn.other.com/segments/segment-002.ts`;

    const baseUrl = 'https://stream.example.com/live/chunklist.m3u8';
    const rewritten = rewriteM3U8Playlist(variantContent, baseUrl);

    assert.ok(
      rewritten.includes('URI="/api/proxy?url=' + encodeURIComponent('https://stream.example.com/live/enc.key') + '"'),
      'Should rewrite encryption key URI'
    );
    assert.ok(
      rewritten.includes('/api/proxy?url=' + encodeURIComponent('https://stream.example.com/live/segment-001.ts')),
      'Should rewrite relative segment URL'
    );
    assert.ok(
      rewritten.includes('/api/proxy?url=' + encodeURIComponent('https://cdn.other.com/segments/segment-002.ts')),
      'Should rewrite absolute segment URL'
    );
  });
});
