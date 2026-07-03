# Nepal Federal Parliament Contact Directory

A searchable, mobile-friendly website for Nepal's Federal Parliament contact directory —
rebuilt from the Federal Parliament Secretariat's printed Telephone Directory (2083 BS edition).

**332 members** (275 House of Representatives + 57 National Assembly) with name, district/constituency,
political party, mobile number(s), and email, where available. See [`about.html`](about.html) for the
data extraction methodology and confidence notes.

## Project structure

```
.
├── index.html          # Directory / search page (home)
├── statistics.html      # Composition & data-coverage dashboard
├── downloads.html        # Data download links
├── about.html            # Methodology & data notes
├── css/
│   └── style.css         # Shared stylesheet (blue/white government theme)
├── js/
│   ├── common.js          # Shared header/nav/footer + data loaders
│   ├── directory.js        # Search/filter/sort/pagination logic
│   └── statistics.js        # SVG chart rendering (no dependencies)
├── data/
│   ├── members.json          # Full structured dataset
│   ├── members.csv           # Same data, spreadsheet-friendly
│   └── leadership_offices.json  # Supplementary raw leadership/office extract
├── vercel.json            # Deployment config (caching headers, clean URLs)
└── package.json           # Optional local dev server script
```

No build step, no framework, no bundler — plain HTML/CSS/JS that fetches its own JSON at runtime.

## Run locally

Because the pages `fetch()` the JSON files, opening `index.html` directly from disk (`file://`) will
fail in most browsers due to CORS restrictions on local files. Serve the folder instead:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:3000` (or `:8080`).

## Deploy to Vercel

1. Push this folder to a new GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Framework preset: **Other** (static site) — no build command, no output directory override needed.
4. Deploy. Vercel serves the files as-is; `vercel.json` sets cache headers for `/data`, `/js`, `/css`.

Or from the CLI:

```bash
npm i -g vercel
vercel
```

## Updating the data

Regenerate `data/members.json` / `data/members.csv` from source and drop them in place — the site
reads them at runtime, so no rebuild is required. Keep the field names in `members.json` consistent
with what `js/directory.js` and `js/statistics.js` expect (see `downloads.html` for the field reference).

## Data confidence

Mobile numbers and emails are extracted from the source PDF's native text layer and should be reliable.
District/Constituency and Political Party fields were recovered via OCR (the source uses a legacy,
non-Unicode Nepali font) and carry a `data_confidence` field — see [`about.html`](about.html) for details.
If you spot an error, please open a GitHub issue with the correction.

## License

Data: derived from a public government publication. Code: MIT.
