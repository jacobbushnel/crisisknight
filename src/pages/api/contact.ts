import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

export const prerender = false;

const PROD = process.env.NODE_ENV === 'production';
const TOPICS: Record<string, string> = {
  subcontracting: 'Subcontracting opportunity',
  scoping: 'Scoping an engagement',
  other: 'Other',
};
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim(); // whitespace incl. CR, LF, U+2028/9
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max + 1) : '');

function originAllowed(origin: string | null) {
  if (!origin) return false;
  // SITE_ORIGIN may list several origins, comma-separated (e.g. apex and www)
  const allowed = (process.env.SITE_ORIGIN ?? 'https://crisisknight.com').split(',').map((o) => o.trim());
  if (!PROD) allowed.push('http://localhost:3000', 'http://localhost:4321', 'http://127.0.0.1:3000', 'http://127.0.0.1:4321');
  return allowed.includes(origin);
}

async function verifyTurnstile(token: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    });
    const out = (await res.json()) as { success?: boolean };
    return out.success === true;
  } catch {
    return false;
  }
}

function transport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) {
    if (PROD) return null;
    return nodemailer.createTransport({ jsonTransport: true }); // dev: log, don't send
  }
  const port = Number(SMTP_PORT) || 465;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  if (!originAllowed(request.headers.get('origin'))) {
    return reply(403, { ok: false, error: 'Request not allowed.' });
  }
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    return reply(415, { ok: false, error: 'Unsupported request.' });
  }

  let raw: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    raw = parsed as Record<string, unknown>;
  } catch {
    return reply(400, { ok: false, error: 'Invalid request.' });
  }

  // Honeypot: report success so bots learn nothing.
  if (str(raw.website, 200)) return reply(200, { ok: true });

  const name = oneLine(str(raw.name, 100));
  const email = str(raw.email, 254);
  const organization = oneLine(str(raw.organization, 150));
  const topic = typeof raw.topic === 'string' ? raw.topic : '';
  const message = str(raw.message, 5000);
  const token = str(raw.turnstile, 2048);

  if (name.length < 1 || name.length > 100) return reply(400, { ok: false, error: 'Please enter your name.' });
  if (!EMAIL_RE.test(email) || email.length > 254) return reply(400, { ok: false, error: 'Please enter a valid email address.' });
  if (organization.length > 150) return reply(400, { ok: false, error: 'Organization is too long.' });
  if (!(topic in TOPICS)) return reply(400, { ok: false, error: 'Please choose a topic.' });
  if (message.length < 20) return reply(400, { ok: false, error: 'Please write at least a couple of sentences.' });
  if (message.length > 5000) return reply(400, { ok: false, error: 'Message is too long (5000 characters max).' });
  if (!token) return reply(400, { ok: false, error: 'Please complete the verification check.' });

  const ip = (locals as { ip?: string }).ip ?? clientAddress;
  if (!(await verifyTurnstile(token, ip))) {
    return reply(400, { ok: false, error: 'Verification failed. Please try again.' });
  }

  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM ?? to;
  const mailer = transport();
  if (!mailer || !to || !from) {
    console.error('contact: mail is not configured (SMTP_HOST, CONTACT_TO, CONTACT_FROM)');
    return reply(503, { ok: false, error: 'Contact is temporarily unavailable. Please try LinkedIn instead.' });
  }

  try {
    const info = await mailer.sendMail({
      from,
      to,
      replyTo: { name, address: email },
      subject: `[CrisisKnight] ${TOPICS[topic]}: ${name}`.slice(0, 200),
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Organization: ${organization || '(none)'}`,
        `Topic: ${TOPICS[topic]}`,
        `IP: ${ip ?? 'unknown'}`,
        `Received: ${new Date().toISOString()}`,
        '',
        message,
      ].join('\n'),
    });
    if (!PROD && 'message' in info) console.log('contact (dev, not sent):', info.message);
    return reply(200, { ok: true });
  } catch (err) {
    console.error('contact: send failed', err instanceof Error ? err.message : err);
    return reply(502, { ok: false, error: 'Could not send your message. Please try again later.' });
  }
};

// Anything but POST is not allowed.
export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST' } });
