# QA sweeps

Three Playwright-based sweeps that visit every page of the site (both
languages) and check for the specific failure modes called out in
`DEVELOPER_CONTEXT.md`. These are read-only checks against a running local
copy of the site — they don't modify anything.

## Setup

```bash
cd scripts
npm install          # installs playwright
npx playwright install chromium   # downloads the browser binary (one-time)
```

## Running

Start a static server from the `public/` directory first:

```bash
cd public && python3 -m http.server 8911
```

Then, from `scripts/`:

```bash
npm run qa:console   # console errors, CSP violations, broken same-origin requests
npm run qa:i18n      # flags data-i18n chrome text that looks like it's in the wrong language
npm run qa:layout    # horizontal overflow + header/hamburger breakpoint check at 6 widths
npm run qa:all       # all three, in order
```

Each script also accepts the base URL as an argument, e.g.:
`node qa/console-csp-sweep.mjs http://localhost:3000`

## What each one checks, and known caveats

**console-csp-sweep.mjs** — fails on any JS console error, uncaught page
error, or a same-origin request that 4xx/5xx's. Requests to
`fonts.googleapis.com`, `fonts.gstatic.com`, `hr.parliament.gov.np`, and
`na.parliament.gov.np` are ignored, since those are real external hosts
(webfonts + official member photos) that many sandboxed/offline dev
environments can't reach — that's an environment limitation, not a site bug.
If you add a new external host, add it to `EXPECTED_EXTERNAL_FAILURE_HOSTS`
in `pages.mjs`.

**i18n-purity-sweep.mjs** — for every element carrying the codebase's own
`data-i18n` attribute, flags it if more than 30% of its alphabetic
characters are in the "wrong" script for the page's language. This is a
heuristic, not a hard gate: short, legitimate technical loanwords embedded
in an otherwise-correct sentence (e.g. "CSV", "YouTube", "MIT License") can
trip it on existing pages. Treat a flag as "go look at this," not as an
automatic bug — but a whole string rendering in the wrong language (the
actual failure mode this exists to catch) will always trip it, since that
pushes the ratio well past 0.3.

**layout-overflow-sweep.mjs** — checks `scrollWidth <= clientWidth` (no
horizontal scrollbar) at 375 / 768 / 1024 / 1179 / 1180 / 1440px, plus that
`.header-nav` and `.hamburger` visibility matches the `max-width: 1180px`
breakpoint in `style.css`. `index.html` is excluded from the nav/hamburger
check specifically, because `home.js` intentionally renders its own
lightweight header markup for the homepage instead of the shared
`.header-nav`/`.hamburger` (see the comment at the top of `home.js`) — that's
a deliberate design choice, not something this sweep should flag.

## Adding a new page

Add it to `PAGE_NAMES` in `pages.mjs` — all three sweeps pick it up
automatically, in both languages.
