import type { IncomingMessage, ServerResponse } from 'http';
import http from 'http';
import https from 'https';
import { URL } from 'url';

// Vercel Serverless Function handler for /api/proxy
export default async function handler(req: IncomingMessage & { query?: Record<string, string> }, res: ServerResponse) {
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

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid URL format' }));
    return;
  }

  // Security: Only allow http and https protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Only http and https protocols are permitted' }));
    return;
  }

  // Security: SSRF Protection against internal / loopback / private IP ranges
  const hostname = parsedUrl.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('172.16.') ||
    hostname.startsWith('169.254.')
  ) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Access to private and loopback addresses is forbidden' }));
    return;
  }

  const client = parsedUrl.protocol === 'https:' ? https : http;

  try {
    const proxyReq = client.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'EasyTV-Player/2.0 (HLS Streaming Client; Accessibility)',
          Accept: '*/*',
        },
        timeout: 10000,
      },
      (upstreamRes) => {
        // Forward content type
        if (upstreamRes.headers['content-type']) {
          res.setHeader('Content-Type', upstreamRes.headers['content-type']);
        }
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.statusCode = upstreamRes.statusCode || 200;

        upstreamRes.pipe(res);
      }
    );

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.statusCode = 504;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Upstream stream request timed out' }));
      }
    });

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Failed to fetch upstream stream', details: err.message }));
      }
    });
  } catch (err: any) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal proxy error', details: err?.message }));
    }
  }
}
