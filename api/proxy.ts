import type { IncomingMessage, ServerResponse } from 'http';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import dns from 'dns';
import net from 'net';
import zlib from 'zlib';

const MAX_REDIRECTS = 5;
const MAX_PLAYLIST_BYTES = 10 * 1024 * 1024; // 10 MB for large playlists

// Sensitive internal service ports to forbid (SSRF protection)
const FORBIDDEN_PORTS = new Set([
  21,   // FTP
  22,   // SSH
  23,   // Telnet
  25,   // SMTP
  53,   // DNS
  110,  // POP3
  143,  // IMAP
  445,  // SMB
  2049, // NFS
  2375, // Docker
  2376, // Docker TLS
  3306, // MySQL
  5432, // PostgreSQL
  6379, // Redis
  11211,// Memcached
  27017,// MongoDB
  28017,// MongoDB web
]);

/**
 * Checks if an IP is private, loopback, link-local, multicast, or reserved (SSRF prevention).
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;
    const [a, b] = parts;
    if (a === 0) return true; // Current network
    if (a === 10) return true; // Private 10.0.0.0/8
    if (a === 127) return true; // Loopback 127.0.0.0/8
    if (a === 169 && b === 254) return true; // Link-local & Cloud Metadata (169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true; // Private 172.16.0.0/12
    if (a === 192 && b === 168) return true; // Private 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // Carrier-grade NAT 100.64.0.0/10
    if (a === 192 && b === 0) return true; // IETF Protocol assignments
    if (a === 198 && (b === 18 || b === 19)) return true; // Benchmark testing
    if (a >= 224) return true; // Multicast (224.0.0.0/4) & Reserved (240.0.0.0/4)
    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true; // Loopback & Unspecified
    if (lower.startsWith('fe80:') || lower.startsWith('fe90:') || lower.startsWith('fea0:') || lower.startsWith('feb0:')) return true; // Link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // Unique Local
    if (lower.startsWith('ff')) return true; // Multicast
    // IPv4-mapped IPv6 (::ffff:127.0.0.1)
    if (lower.startsWith('::ffff:')) {
      const ipv4Part = lower.substring(7);
      if (net.isIPv4(ipv4Part)) return isPrivateOrReservedIp(ipv4Part);
    }
    return false;
  }

  return true;
}

/**
 * Validates a target URL, checks protocols, ports, and resolves IP addresses for SSRF protection.
 */
export async function validateTargetUrl(targetUrl: string): Promise<{ parsed: URL; error?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return { parsed: null as any, error: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { parsed, error: 'Only http and https protocols are supported' };
  }

  const port = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === 'https:' ? 443 : 80;
  
  // Reject ports below 1024 other than standard 80 and 443
  if (port < 1024 && port !== 80 && port !== 443) {
    return { parsed, error: `Privileged port ${port} is not allowed` };
  }

  // Reject internal database and service ports
  if (FORBIDDEN_PORTS.has(port)) {
    return { parsed, error: `Port ${port} is forbidden for security` };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  ) {
    return { parsed, error: 'Internal hostnames and loopback are forbidden' };
  }

  // Check if hostname is already a raw IP
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return { parsed, error: 'Access to private, loopback, or cloud metadata addresses is forbidden' };
    }
    return { parsed };
  }

  // Resolve hostname and check all returned IPs
  try {
    const lookupResults = await dns.promises.lookup(hostname, { all: true });
    if (!lookupResults || lookupResults.length === 0) {
      return { parsed, error: `Could not resolve domain: ${hostname}` };
    }

    for (const record of lookupResults) {
      if (isPrivateOrReservedIp(record.address)) {
        return { parsed, error: 'Access to private, loopback, or cloud metadata addresses is forbidden' };
      }
    }
  } catch (dnsErr: any) {
    return { parsed, error: `DNS lookup failed for ${hostname}: ${dnsErr.message}` };
  }

  return { parsed };
}

/**
 * Rewrites an M3U8 playlist content so all relative and absolute sub-playlists,
 * segments, maps, and encryption keys route through the proxy.
 */
export function rewriteM3U8Playlist(content: string, playlistUrl: string, proxyPrefix = '/api/proxy?url='): string {
  const lines = content.split(/\r?\n/);
  const rewrittenLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      rewrittenLines.push('');
      continue;
    }

    if (line.startsWith('#')) {
      // Rewrite URI="..." or URI='...' attributes in tags like #EXT-X-KEY, #EXT-X-MAP, #EXT-X-MEDIA, #EXT-X-PART, #EXT-X-PRELOAD-HINT
      const rewrittenTag = line.replace(/([Uu][Rr][Ii]=)["']?([^"',\s>]+)["']?/g, (match, prefix, rawUri) => {
        if (rawUri.startsWith('/api/proxy') || rawUri.startsWith(proxyPrefix)) {
          return match;
        }
        try {
          const resolved = new URL(rawUri, playlistUrl).href;
          return `URI="${proxyPrefix}${encodeURIComponent(resolved)}"`;
        } catch {
          return match;
        }
      });
      rewrittenLines.push(rewrittenTag);
    } else {
      // Media segment, child variant playlist, or audio/subtitle track URL
      if (line.startsWith('/api/proxy') || line.startsWith(proxyPrefix)) {
        rewrittenLines.push(line);
        continue;
      }
      try {
        const resolved = new URL(line, playlistUrl).href;
        rewrittenLines.push(`${proxyPrefix}${encodeURIComponent(resolved)}`);
      } catch {
        rewrittenLines.push(line);
      }
    }
  }

  return rewrittenLines.join('\n');
}

/**
 * Core proxy request handler supporting SSRF checks, redirects, M3U8 rewrites, range requests, and streaming.
 */
export async function handleProxyRequest(
  targetUrl: string,
  res: ServerResponse,
  redirectCount = 0,
  incomingReq?: IncomingMessage
): Promise<void> {
  // Always set permissive CORS headers on every response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');

  if (redirectCount > MAX_REDIRECTS) {
    res.statusCode = 508;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Too many redirects encountered' }));
    return;
  }

  const { parsed, error: validationError } = await validateTargetUrl(targetUrl);
  if (validationError || !parsed) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: validationError || 'Target URL validation failed' }));
    return;
  }

  const client = parsed.protocol === 'https:' ? https : http;
  const isPlaylistUrl = parsed.pathname.endsWith('.m3u8') || parsed.pathname.endsWith('.m3u') || parsed.search.includes('m3u');

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  // Forward range request if requested by browser or Hls.js
  if (incomingReq?.headers?.range) {
    headers['Range'] = incomingReq.headers.range as string;
  }

  // Request identity encoding to simplify playlist parsing if possible
  if (isPlaylistUrl) {
    headers['Accept-Encoding'] = 'identity';
  } else {
    headers['Accept-Encoding'] = 'gzip, deflate, br, identity';
  }

  const req = client.get(
    parsed.href,
    {
      headers,
      timeout: 12000,
    },
    async (upstreamRes) => {
      const statusCode = upstreamRes.statusCode || 200;

      // Handle redirects with SSRF re-validation on every hop
      if (statusCode >= 300 && statusCode < 400 && upstreamRes.headers.location) {
        upstreamRes.resume(); // discard body
        try {
          const redirectTarget = new URL(upstreamRes.headers.location, parsed.href).href;
          return handleProxyRequest(redirectTarget, res, redirectCount + 1, incomingReq);
        } catch {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid redirect location header' }));
          return;
        }
      }

      const contentType = (upstreamRes.headers['content-type'] || '').toLowerCase();
      const contentEncoding = (upstreamRes.headers['content-encoding'] || '').toLowerCase();

      // Decompress stream if upstream compressed it
      let readableStream: NodeJS.ReadableStream = upstreamRes;
      if (contentEncoding === 'gzip') {
        readableStream = upstreamRes.pipe(zlib.createGunzip());
      } else if (contentEncoding === 'deflate') {
        readableStream = upstreamRes.pipe(zlib.createInflate());
      } else if (contentEncoding === 'br') {
        readableStream = upstreamRes.pipe(zlib.createBrotliDecompress());
      }

      const isM3U8ContentType =
        isPlaylistUrl ||
        contentType.includes('mpegurl') ||
        contentType.includes('application/x-mpegurl') ||
        contentType.includes('application/vnd.apple.mpegurl') ||
        contentType.includes('text/plain');

      // For playlists, buffer and rewrite child links
      if (isM3U8ContentType) {
        const chunks: Buffer[] = [];
        let totalBytes = 0;

        readableStream.on('data', (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_PLAYLIST_BYTES) {
            upstreamRes.destroy();
            if (!res.headersSent) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Playlist size exceeds maximum permitted buffer' }));
            }
            return;
          }
          chunks.push(chunk);
        });

        readableStream.on('end', () => {
          if (res.headersSent) return;

          const rawBody = Buffer.concat(chunks).toString('utf-8');

          // If content begins with #EXTM3U or looks like a playlist, rewrite nested URLs
          if (rawBody.includes('#EXTM3U') || isPlaylistUrl) {
            const rewritten = rewriteM3U8Playlist(rawBody, parsed.href);
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.statusCode = statusCode;
            res.end(rewritten);
          } else {
            // Forward as is if not M3U8
            if (upstreamRes.headers['content-type']) {
              res.setHeader('Content-Type', upstreamRes.headers['content-type']);
            }
            if (upstreamRes.headers['content-length']) {
              res.setHeader('Content-Length', upstreamRes.headers['content-length']);
            }
            res.statusCode = statusCode;
            res.end(rawBody);
          }
        });

        readableStream.on('error', (err) => {
          if (!res.headersSent) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Error reading upstream playlist', details: err.message }));
          }
        });
      } else {
        // Stream binary media segments (.ts, .m4s, .mp4, keys) directly with full range support
        if (upstreamRes.headers['content-type']) {
          res.setHeader('Content-Type', upstreamRes.headers['content-type']);
        }
        if (upstreamRes.headers['content-length']) {
          res.setHeader('Content-Length', upstreamRes.headers['content-length']);
        }
        if (upstreamRes.headers['content-range']) {
          res.setHeader('Content-Range', upstreamRes.headers['content-range']);
        }
        if (upstreamRes.headers['accept-ranges']) {
          res.setHeader('Accept-Ranges', upstreamRes.headers['accept-ranges']);
        }

        res.setHeader('Cache-Control', 'public, max-age=300');
        res.statusCode = statusCode;

        upstreamRes.pipe(res);
      }
    }
  );

  req.on('timeout', () => {
    req.destroy();
    if (!res.headersSent) {
      res.statusCode = 504;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Upstream connection timed out' }));
    }
  });

  req.on('error', (err) => {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Failed to connect to upstream server', details: err.message }));
    }
  });
}

// Vercel Serverless Function entry point
export default async function handler(
  req: IncomingMessage & { query?: Record<string, string> },
  res: ServerResponse
) {
  // Set permissive CORS headers for web player
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Parse target URL from query
  let targetUrl: string | null = null;
  try {
    const fullUrl = new URL(req.url || '', 'http://localhost');
    targetUrl = fullUrl.searchParams.get('url');
  } catch {
    targetUrl = null;
  }

  if (!targetUrl) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing required "url" query parameter' }));
    return;
  }

  try {
    await handleProxyRequest(targetUrl, res, 0, req);
  } catch (err: any) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal proxy error', details: err?.message }));
    }
  }
}
