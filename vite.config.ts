import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import http from 'http';
import https from 'https';
import {URL} from 'url';

// Lightweight Vite dev proxy plugin to bypass browser CORS for public IPTV playlists and streams
function iptvProxyPlugin() {
  return {
    name: 'iptv-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/proxy', (req: any, res: any) => {
        const reqUrl = new URL(req.url, 'http://localhost');
        const targetUrl = reqUrl.searchParams.get('url');

        if (!targetUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({error: 'Missing url parameter'}));
          return;
        }

        try {
          const parsedTarget = new URL(targetUrl);
          const client = parsedTarget.protocol === 'https:' ? https : http;

          const proxyReq = client.get(
            targetUrl,
            {
              headers: {
                'User-Agent': 'EasyTV/1.0 (Live TV Client; Accessibility)',
                Accept: '*/*',
              },
            },
            (proxyRes) => {
              // Set permissive CORS headers for web player
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', '*');

              if (proxyRes.headers['content-type']) {
                res.setHeader('Content-Type', proxyRes.headers['content-type']);
              }

              res.statusCode = proxyRes.statusCode || 200;
              proxyRes.pipe(res);
            }
          );

          proxyReq.on('error', (err) => {
            res.statusCode = 502;
            res.end(JSON.stringify({error: 'Failed to fetch upstream URL', message: err.message}));
          });
        } catch (e: any) {
          res.statusCode = 400;
          res.end(JSON.stringify({error: 'Invalid target URL', message: e.message}));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), iptvProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
