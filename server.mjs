import express from 'express';

// dist/ is not committed. If the host skipped the build step, say so clearly.
const { handler: ssrHandler } = await import('./dist/server/entry.mjs').catch((err) => {
  console.error('Build output not found (dist/server/entry.mjs). Run "npm run build" before starting.');
  console.error(err.message);
  process.exit(1);
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST; // unset: listen on all interfaces, as the Hostinger docs do

app.disable('x-powered-by');

// Hops of reverse proxy in front of this process. The rate limiter keys on
// req.ip, so a wrong value either shares one bucket or lets XFF be spoofed.
const trust = process.env.TRUST_PROXY ?? '1';
app.set('trust proxy', Number.isNaN(Number(trust)) ? trust : Number(trust));

// One canonical host. Only www.<our domain> is redirected, never an arbitrary
// Host header value, so this cannot be used as an open redirect.
const canonical = new URL((process.env.SITE_ORIGIN ?? 'https://crisisknight.com').split(',')[0].trim());
app.use((req, res, next) => {
  if (req.hostname === `www.${canonical.hostname}`) {
    return res.redirect(301, `${canonical.origin}${req.originalUrl}`);
  }
  next();
});

const csp = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

// Applied to every response, static files and SSR routes alike.
app.use((_req, res, next) => {
  res.set({
    'Content-Security-Policy': csp,
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  });
  next();
});

app.use(
  express.static('dist/client', {
    extensions: ['html'],
    dotfiles: 'allow', // /.well-known/security.txt
    setHeaders(res, path) {
      res.set(
        'Cache-Control',
        path.includes('/_astro/')
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=0, must-revalidate',
      );
    },
  }),
);

// In-memory sliding-window limiter for form submissions.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_HITS = Number(process.env.RATE_LIMIT_MAX) || 5;
const MAX_TRACKED = 10_000;
const hits = new Map();

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [ip, times] of hits) {
    const recent = times.filter((t) => t > cutoff);
    if (recent.length) hits.set(ip, recent);
    else hits.delete(ip);
  }
}, 60_000).unref();

const MAX_BODY = 16 * 1024;

// Applies to every non-GET request, whatever the path. The only endpoint is
// /api/contact, and matching on its path would let encoded variants such as
// /api/%63ontact reach Astro without the size cap or the limiter.
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();

  // Browsers always send Content-Length for a JSON string body. Rejecting
  // anything else stops oversized and chunked bodies before they are read.
  const length = Number(req.headers['content-length']);
  if (!Number.isInteger(length) || length < 0) {
    return res.status(411).json({ ok: false, error: 'Content-Length required.' });
  }
  if (length > MAX_BODY) {
    return res.status(413).json({ ok: false, error: 'Request too large.' });
  }

  const now = Date.now();
  const recent = (hits.get(req.ip) ?? []).filter((t) => t > now - WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    res.set('Retry-After', String(Math.ceil(WINDOW_MS / 1000)));
    return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  }
  if (!hits.has(req.ip) && hits.size >= MAX_TRACKED) {
    return res.status(429).json({ ok: false, error: 'Please try again later.' });
  }
  recent.push(now);
  hits.set(req.ip, recent);
  next();
});

app.use((req, res, next) => ssrHandler(req, res, next, { ip: req.ip }));

app.use((_req, res) => {
  res.status(404).sendFile('404.html', { root: 'dist/client' });
});

const onListen =() => console.log(`crisisknight listening on port ${PORT}`);
if (HOST) app.listen(PORT, HOST, onListen);
else app.listen(PORT, onListen);
