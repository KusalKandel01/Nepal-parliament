# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [1.1.1] — 2026-07-05 — Critical hotfix

### Fixed
- **Site-breaking bug:** `vercel.json` had `"cleanUrls": true`, which made Vercel redirect e.g. `/directory.html` → `/directory`. Every internal link in the site points at the explicit `.html` filename, so this redirect was pure overhead — and combined with the service worker's fetch handler, it caused Chrome to hard-fail every single page navigation with `ERR_FAILED` ("a redirected response was used for a request whose redirect mode is not 'follow'"). The homepage appeared to work because it's reachable at the clean root URL with no redirect involved; every other page (`directory.html`, `member.html`, etc.) was completely broken in production. Removed `cleanUrls` entirely — no functionality is lost since nothing in the app relied on extension-less URLs.
- Hardened `sw.js` regardless, so this class of bug can't recur even from a future redirect introduced elsewhere (a CDN rule, a new Vercel rewrite, etc.): responses are stripped of their `redirected` flag via `safeResponse()` before ever being cached or handed to `respondWith()`. Bumped the service worker cache version (`npd-cache-v2`) so previously-installed broken workers are replaced immediately instead of continuing to serve the old broken fetch handler from cache.

## [1.1.0] — 2026-07-04

### Added
- Individual member profile pages (`member.html?id=`) with dynamic SEO metadata and `Person` schema.org markup
- Leadership page cross-links to full member profiles where identifiable
- Committee cards now link chair/secretary names to their member profile
- Service worker (`sw.js`) + `offline.html` for basic offline support
- PNG favicons (16/32/180/192/512px) alongside the existing SVG icon
- Screen-reader `aria-live` announcements on all dynamically-rendered pages, not just the directory
- `lang="en"` wrapping for English names inside Nepali-language pages
- Focus trap + focus restoration in the mobile navigation drawer
- CSV format documentation on the downloads page (pipe-delimited multi-value fields)
- `LICENSE`, `CONTRIBUTING.md`, this changelog, `.editorconfig`, `.gitignore`
- GitHub Actions workflow validating JSON/CSV on every push
- `data_version` field in `metadata.json` for future re-import tracking

### Changed
- Extracted all inline `<script>` blocks (leadership, committees, downloads, member, statistics pages) into dedicated files under `assets/js/`
- Homepage hero search now queries the lightweight `search-index.json` instead of the full `members.json`
- Party color mapping consolidated into a single source of truth (`APP.resolvePartyColor` in `app.js`) instead of being duplicated across `style.css`, `filters.js`, and `statistics.html`
- Removed all inline `style="..."` attributes in favor of CSS utility classes
- `committees.html` now shows the same "⚠ needs verification" indicator as `leadership.html` for unverified entries (previously inconsistent)

### Fixed
- `member.html` was missing a `<link rel="canonical">` entirely
- A temporal-dead-zone bug in the (now removed) inline member script, where `phone`/`email` were referenced before their `const` declaration
- `404.html` was missing the skip-link present on every other page
- Decorative SVG icons now carry `aria-hidden="true"` so screen readers don't announce raw path data

## [1.0.0] — 2026-07-03

### Added
- Initial release: 332-member directory (275 House of Representatives + 57 National Assembly), leadership offices, 16 committees
- Search, party/house/alphabet filters, sort, pagination with URL state
- WhatsApp, vCard, copy, save, print, share actions per member
- SVG donut/column/bar charts on the statistics page
- CSV + JSON downloads
- Dark mode, print stylesheet, reduced-motion support
