# CrisisKnight.com

Portfolio and blog for Jacob Bushnell, security practitioner. Built with [Astro](https://astro.build) and served by a small Express server that adds security headers to every response and handles the contact form.

## Local development

```bash
npm install
cp .env.example .env   # fill in values; Cloudflare's test keys are listed in the file
npm run dev            # http://localhost:4321, for editing pages and posts
```

`npm run dev` does not load `.env` and sends no security headers, so the contact form is disabled there. Use `npm start` (below) to test the form and the headers.

Production-like run:

```bash
npm run build
npm start              # http://localhost:3000
```

Without `SMTP_HOST` set (outside production) contact messages are printed to the console instead of sent.

## Writing a blog post

Add a Markdown file to `src/content/blog/`:

```markdown
---
title: 'Post title'
description: 'One or two sentences, max 220 characters.'
date: 2026-11-03
tags: ['web', 'writeup']
draft: false
---
```

Posts with `draft: true` are visible only under `npm run dev`. Put images in `public/img/`. Commit and push to `main`, and Hostinger redeploys.

## Editing content

- Copy, bio, links, experience, services: `src/data/site.ts`
- Certifications: `src/data/certs.ts`. Active or expired is derived from the expiry date when the site is built, so trigger a redeploy (any push) after a cert expires. Next expiry: GISF on 2027-03-31.
- Find unfinished placeholders: `grep -rn "TODO:" src public`

## Deploying on Hostinger

Per Hostinger's Node.js web app docs (docs.hostinger.com/node.js):

1. hPanel: Websites, Add Website, Node.js web app, Import Git repository, connect GitHub, choose `jacobbushnel/crisisknight`, branch `main`.
2. Settings:
   - Application type: **Express** (the docs say this deploys the whole repo root, so `server.mjs` and `node_modules` are present)
   - Node version: 24 (Astro 7 needs 22.23.4 or newer)
   - Build script: `build`. **Unverified:** the docs show the build running for TypeScript Express apps and say to leave it blank for plain JavaScript ones. Confirm the field accepts `build` and that `dist/` exists after the first deploy. If the build does not run, the server exits with "Build output not found".
   - Output directory: leave empty
   - Entry file: `server.mjs`
   - Fallback if Express will not run the build: application type **Other**, same entry file and build script.
3. Environment variables (see `.env.example`): `TURNSTILE_SITEKEY`, `TURNSTILE_SECRET`, `CONTACT_TO`, `CONTACT_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SITE_ORIGIN=https://crisisknight.com` (comma-separate extra origins such as `https://www.crisisknight.com`), `NODE_ENV=production`. Set `CONTACT_FROM` to the same mailbox as `SMTP_USER`, since SMTP servers often reject mismatched senders. `PORT` is assigned by Hostinger.
4. Connect the `crisisknight.com` domain and confirm HTTPS.
5. After the first deploy, check `TRUST_PROXY`. It defaults to `1` (one reverse proxy). If every visitor appears to share one rate-limit bucket, or `X-Forwarded-For` can be spoofed, adjust it.

Every push to `main` triggers install, build and restart.

## Security notes

- CSP, HSTS and related headers are set in `server.mjs` for every response, static files included. Scripts and styles are external, so the CSP has no `unsafe-inline`.
- Contact form: Origin allowlist, JSON-only, 16 KB body cap, per-IP rate limit (5 per 15 minutes, in memory), honeypot field, Cloudflare Turnstile verified server-side, strict field validation, no user input in mail headers except a validated Reply-To.
- `/.well-known/security.txt` expires 2027-10-31. Renew it before then.
- The Turnstile script is intentionally loaded without Subresource Integrity. Cloudflare updates it without notice and requires loading it from their URL.
