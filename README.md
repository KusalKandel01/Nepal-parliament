# संघीय संसद सम्पर्क निर्देशिका — Nepal Federal Parliament Contact Directory

A static, Vercel-deployable contact directory for Nepal's Federal Parliament: 332 members of the House of Representatives (275) and National Assembly (57), plus leadership offices and 16 parliamentary committees.

## Quick start

```bash
npm run dev     # serves public/ at http://localhost:3000 (requires: npx serve)
npm run validate # validates all JSON data + JS syntax
```

Or point any static file server at the `public/` folder directly (fetch() for JSON requires http://, not file://).

**Deploy to Vercel:** push this repo and import it — `vercel.json` already sets `"outputDirectory": "public"`, so no dashboard configuration is needed. No build step, no framework, no dependencies to install for the site itself.

## Repository layout

The repo root holds only tooling and documentation. Everything that actually gets deployed lives in one place: `public/`.

```
/
├── public/                 ← THE DEPLOYED SITE (Vercel outputDirectory)
│   ├── index.html              Homepage with hero search
│   ├── directory.html          Full searchable/filterable member grid
│   ├── member.html             Individual member profile (?id=MP0001)
│   ├── leadership.html         Speaker, Deputy Speaker, Chairperson, VC, PM
│   ├── committees.html         16 parliamentary committees (HoR, NA, joint)
│   ├── statistics.html         SVG charts: party/house/district breakdowns
│   ├── downloads.html          CSV/JSON export links
│   ├── about.html              Methodology & data-quality transparency
│   ├── 404.html / offline.html
│   ├── manifest.json, sw.js, robots.txt, sitemap.xml
│   ├── .well-known/security.txt
│   └── assets/
│       ├── css/style.css
│       ├── js/
│       │   ├── app.js          shared: theme, header/footer, data loading, vCard
│       │   ├── filters.js      directory: search, filter, sort, pagination, URL state
│       │   ├── search.js       homepage hero search (live suggestions)
│       │   ├── charts.js       pure SVG donut/bar/column charts, zero dependencies
│       │   ├── member.js, leadership.js, committees.js, statistics.js, downloads.js
│       │   └── (one file per page — no page has an inline <script> with real logic)
│       ├── data/                members.json, leadership.json, committees.json,
│       │                        statistics.json, metadata.json, search-index.json,
│       │                        members.csv, leadership.csv, committees.csv
│       ├── images/              emblem.svg, parliament.svg, icon-{16,32,180,192,512}.png
│       └── icons/               SVG icon set (phone, email, whatsapp, etc.)
│
├── pipeline/                ← NOT deployed — the data-extraction pipeline
│   ├── README.md               methodology writeup (read this before touching data)
│   ├── extract_v3.py, extract_na.py    PDF → phone/email extraction (HoR / NA)
│   ├── normalize.py                    party/province fuzzy-matching to canonical codes
│   └── merge_csv2.py, merge_photos.py  optimal name matching against authoritative sources
│
├── docs/
│   └── CHANGELOG.md
│
├── .github/
│   ├── workflows/validate.yml   CI: validates JSON/JS/broken-links on every push
│   └── CONTRIBUTING.md
│
├── .editorconfig, .gitignore
├── LICENSE, README.md            (kept at root — GitHub requires this location)
├── package.json
└── vercel.json                   ("outputDirectory": "public")
```

## Data provenance — please read before relying on this data

The source document is the Federal Parliament Secretariat's *"Telephone Directory 2083"* (a 106-page PDF). Two independent recovery problems had to be solved:

1. **Broken font encoding.** The PDF's embedded Devanagari font has a faulty ToUnicode CMap: several consonants (e.g. **म** and **ह**) both decode to the same wrong character when text is extracted directly. This is not simple misalignment — it silently corrupts individual letters in ways that are undetectable without visual cross-checking.
2. **Merged-cell row misalignment.** Members with two phone numbers span two lines in the source table, which can shift phone numbers up or down by one row during naive text extraction.

**How this was resolved** (full method in `pipeline/README.md`):
- Phone numbers and email addresses were extracted from the PDF's text layer using position-anchored parsing (Latin letters and digits are not affected by the font bug), then matched to each member by vertical proximity to their row label — not simple line order.
- Names and districts were **not** trusted from the PDF text layer. Instead they were cross-matched (via optimal bipartite name-similarity matching) against an authoritative CSV export and the official member directories at **hr.parliament.gov.np** and **na.parliament.gov.np**, which use correct Unicode Devanagari.
- Profile photos were sourced directly from those two official sites.
- Party names were standardized to short codes via fuzzy matching against the canonical list, not exact string matching, so OCR/encoding noise in the source doesn't cause misclassification.
- The Speaker, Deputy Speaker, Prime Minister, National Assembly Chairperson and Vice Chairperson were individually hand-verified against the source PDF's dedicated leadership contact page.

**Known limitations (see `public/about.html` for the full list):**
- 8 of 332 members have no phone number on file in the source directory — left `null`, not guessed.
- National Assembly serial number 14 is genuinely absent from the source PDF (confirmed by inspecting the raw text; not a parsing bug).
- A handful of committee secretary names (flagged `"verified": false` in `leadership.json`/`committees.json`) are best-effort transcriptions from the corrupted text layer and could not be cross-referenced against an authoritative source in the time available — spot-check these against the source PDF before formal use.
- This is an independent civic-tech project, not an official Parliament Secretariat product.

## Contributing

See `.github/CONTRIBUTING.md` for how to report a data error or contribute code, and `docs/CHANGELOG.md` for version history.

## License

Data is derived from public government sources and official parliament websites. Code in this repository is provided under the MIT license (see `LICENSE`).
