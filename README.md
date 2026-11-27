# HyList

A server list website for **Hytale**. Owners list their servers, players browse, vote and find a place to play. Every listing shows live online status and player count.

Built with [Nuxt 4](https://nuxt.com), Tailwind CSS 4, Prisma and MySQL.

<p align="center">
  <img src="https://i.imgur.com/gPzFsdX.png" width="900">
</p>

<p align="center"><a href="https://imgur.com/a/7QmvCGl">📸 View full gallery on Imgur</a></p>

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Running in production](#running-in-production)
- [For server owners](#for-server-owners)
- [Voting and ranking](#voting-and-ranking)
- [Admin](#admin)
- [Security](#security)
- [Changelog](UPDATE.md)

## Features

**For players**
- Server list with search, country and tag filters, live status and player count
- Advanced search (`/find`): online only, featured, VIP
- Server pages with description, links, rank, votes, reviews and a 24h / 7 day player graph
- Vote once per server every 24 hours, leave a 1–5 star review, report broken listings
- Accounts with username, avatar and settings, plus public profiles (`/u/<id>`)

**For server owners**
- Logo, banner, tags and links (Discord, website, store, YouTube, TikTok, X, Instagram)
- Live status, Verified badge, vote rewards, 30 day stats and an embeddable badge

**For admins**
- Manage servers and users, feature servers, give VIP, handle reports
- Discord notification when a new server is added

## Quick start

Requires **Node.js 20.6+** and **MySQL 8** (or MariaDB 10.6+).

```bash
git clone <repo-url> hylist
cd hylist
npm install
cp .env.example .env          # fill in the values, see Configuration
npx prisma migrate deploy     # creates the tables
npm run dev                   # http://localhost:3000
```

**First admin:** with `ALLOW_ADMIN_SIGNUP=true` in dev mode, the first registered account becomes admin. Otherwise:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

**After pulling updates**, stop `npm run dev` and run `npx prisma migrate deploy && npx prisma generate` before starting again. Otherwise you'll get errors like `Cannot read properties of undefined (reading 'findMany')`.

## Configuration

All settings go in `.env`:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | `mysql://USER:PASSWORD@HOST:PORT/DATABASE` |
| `AUTH_JWT_SECRET` | yes | Long random string for signing login tokens |
| `AUTH_REFRESH_PEPPER` | yes | Another random string for hashing refresh tokens and voter IPs |
| `SITE_URL` | no | Public site URL, used for links in Discord messages |
| `DISCORD_WEBHOOK_URL` | no | Webhook for "new server" messages (Server Settings → Integrations → Webhooks) |
| `COOKIE_SECURE` | no | Set `false` to test the production build over plain `http://` |
| `ALLOW_ADMIN_SIGNUP` | no | Dev mode only: first registered user becomes admin |

Generate secrets with `openssl rand -hex 32`. Keep the webhook URL private.

## Running in production

```bash
npm run build
pm2 start .output/server/index.mjs --name hylist --node-args="--env-file=.env"
```

- Run it behind HTTPS (nginx, Caddy or Cloudflare). Cookies are `Secure`, so over plain HTTP set `COOKIE_SECURE=false`.
- Uploaded images are stored in `public/server-media/`. Back up this folder together with the database.
- Player counts are recorded every 5 minutes and kept for 8 days.

## For server owners

Everything is in **Your servers → Edit**.

### Heartbeat

Send this from your Hytale server every ~60 seconds:

```http
POST /api/servers/heartbeat
Content-Type: application/json

{ "host": "play.example.com", "port": 5520, "token": "<your token>", "players": 12, "capacity": 100 }
```

The server stays online for 2 minutes after the last heartbeat. Without it, HyList uses the Hytale query protocol ([HytaleOne query plugin](https://hytale.one)) or a TCP check.

### Verification

Get the Verified badge with **one valid heartbeat**, or by adding the `hylist-verify=…` **DNS TXT record** from the edit page. Changing the address removes the badge.

### Vote rewards

Set a **Vote reward URL** and HyList will send every vote to it:

```http
POST <your URL>
X-HyList-Signature: sha256=<HMAC-SHA256 of the raw body, key = your token>

{ "event": "vote", "serverId": "…", "serverName": "…", "playerName": "Steve", "votedAt": "2026-11-27T12:00:00.000Z" }
```

**Always check the signature** using the raw request body, or anyone can fake votes:

```js
const expected = Buffer.from("sha256=" + crypto.createHmac("sha256", TOKEN).update(rawBody).digest("hex"));
const header = Buffer.from(String(req.headers["x-hylist-signature"] || ""));
const valid = expected.length === header.length && crypto.timingSafeEqual(expected, header);
```

Use **Send test** to try it out. The URL must be public; no redirects, 5 second timeout, no retries.

### Badge and stats

Copy a badge (HTML, Markdown, BBCode or image URL) that shows your rank, status and monthly votes. The stats tab shows views and votes for the last 30 days and the latest voters.

## Voting and ranking

- One vote per server every 24 hours, per account **and** per IP. Owners can't vote for their own servers.
- Order: **featured → VIP → votes this month → all-time votes → newest**. Monthly votes reset on the 1st (UTC).

## Admin

Open **Admin panel** from the user menu to edit, feature or delete servers, change user roles, give VIP (optionally until a date) and handle reports.

## Security

- Server addresses and reward URLs must be public IPs, so the site can't reach internal networks.
- Uploads are checked by their real content, not just the extension.
- Vote rewards are HMAC-signed, and the token is never published.
- Login, registration, new servers and reports are rate-limited.
- Changing your password logs out all other sessions.