# Updates

## New

- New design and home page with search, top servers this month and live activity.
- Server pages with description, links, rank, votes, latest voters, reviews and a player graph.
- Voting: one vote per server every 24 hours, ranked by votes this month.
- Reviews: 1–5 stars and text, one per member per server.
- Public user profiles (`/u/<id>`), linked from owners, voters and reviewers. They show reviews about the member's servers and reviews they wrote.
- Your profile: your servers and servers you can vote for again. Settings moved to `/settings`.
- Server links: Discord, website, store, YouTube, TikTok, X, Instagram.
- Vote rewards: signed request to the owner's server on every vote.
- Verified badge (heartbeat or DNS TXT record).
- Owner stats (views and votes per day) and an embeddable badge.
- Reports: players report servers, admins review them.
- VIP with an end date, VIP badge and ranking.
- Discord message when a new server is added.
- Unique usernames, sign out other devices.

## Fixed

- Security: arbitrary file deletion through the avatar field.
- Security: servers with internal or LAN addresses (SSRF).
- Security: rate limits, upload content checks, logout and password change end sessions.
- Logged-in pages failing after 15 minutes or on reload.
- Uploaded images returning 404 after a build.
- Real error messages instead of "Server Error".
- Editing a server erasing its tags.
- Deleted servers leaving files on disk.
- Login over plain `http://` (new `COOKIE_SECURE` setting).
- Layout bugs: collapsed search field, white dropdowns, browser popups replaced with the site's own dialogs.
- Server cards overflowing on the search page; hidden tags can now be opened with "+N more".
- IP and vote button breaking onto two lines on the server page.
- Stray scrollbar on the profile and server edit tabs.
- Three icons that did not exist in the icon set (warning, YouTube, rank) showed as blank.
