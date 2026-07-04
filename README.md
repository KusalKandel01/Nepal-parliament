# संघीय संसद सम्पर्क निर्देशिका — Nepal Federal Parliament Contact Directory

A static, Vercel-deployable contact directory for Nepal's Federal Parliament: 332 members of the House of Representatives (275) and National Assembly (57), plus leadership offices and 16 parliamentary committees.

## Quick start

```bash
npm install -g serve   # or use npx
npm run dev             # serves the site at http://localhost:3000
```

Or just open `index.html` via any static file server (fetch() for JSON requires http://, not file://).

Deploy to Vercel: push this folder to a Git repo and import it in Vercel, or run `vercel` in this directory. No build step is required — it's plain HTML/CSS/JS.

## Project structure

```
/
├── index.html          Homepage with hero search
├── directory.html      Full searchable/filterable member grid
├── member.html         Individual member profile (?id=MP0001)
├── leadership.html     Speaker, Deputy Speaker, Chairperson, Vice Chairperson, PM
├── committees.html     16 parliamentary committees (HoR, NA, joint)
├── statistics.html     SVG charts: party/house/district breakdowns
├── downloads.html      CSV/JSON export links
├── about.html          Methodology & data-quality transparency
├── 404.html
├── manifest.json, robots.txt, sitemap.xml, vercel.json, package.json
└── assets/
    ├── css/style.css
    ├── js/app.js        shared: theme, header/footer, data loading, vCard, clipboard
    ├── js/filters.js    directory page: search, filter, sort, pagination, URL state
    ├── js/search.js     homepage hero search with live suggestions
    ├── js/charts.js     pure SVG donut/bar/column charts, zero dependencies
    ├── data/            members.json, leadership.json, committees.json,
    │                    statistics.json, metadata.json, search-index.json,
    │                    members.csv, leadership.csv, committees.csv
    ├── images/          emblem.svg, parliament.svg
    └── icons/           SVG icon set (phone, email, whatsapp, etc.)
```

## Data provenance — please read before relying on this data

The source document is the Federal Parliament Secretariat's *"Telephone Directory 2083"* (a 106-page PDF). Two independent recovery problems had to be solved:

1. **Broken font encoding.** The PDF's embedded Devanagari font has a faulty ToUnicode CMap: several consonants (e.g. **म** and **ह**) both decode to the same wrong character when text is extracted directly. This is not simple misalignment — it silently corrupts individual letters in ways that are undetectable without visual cross-checking.
2. **Merged-cell row misalignment.** Members with two phone numbers span two lines in the source table, which can shift phone numbers up or down by one row during naive text extraction.

**How this was resolved:**
- Phone numbers and email addresses were extracted from the PDF's text layer using position-anchored parsing (Latin letters and digits are not affected by the font bug), then matched to each member by vertical proximity to their row label — not simple line order.
- Names and districts were **not** trusted from the PDF text layer. Instead they were cross-matched (via optimal bipartite name-similarity matching) against an authoritative CSV export and the official member directories at **hr.parliament.gov.np** and **na.parliament.gov.np**, which use correct Unicode Devanagari.
- Profile photos were sourced directly from those two official sites.
- Party names were standardized to short codes via fuzzy matching against the canonical list, not exact string matching, so OCR/encoding noise in the source doesn't cause misclassification.
- The Speaker, Deputy Speaker, Prime Minister, National Assembly Chairperson and Vice Chairperson were individually hand-verified against the source PDF's dedicated leadership contact page.

**Known limitations (see `about.html` for the full list):**
- 8 of 332 members have no phone number on file in the source directory — left `null`, not guessed.
- National Assembly serial number 14 is genuinely absent from the source PDF (confirmed by inspecting the raw text; not a parsing bug).
- A handful of committee secretary names (flagged `"verified": false` in `leadership.json`/`committees.json`) are best-effort transcriptions from the corrupted text layer and could not be cross-referenced against an authoritative source in the time available — spot-check these against the source PDF before formal use.
- This is an independent civic-tech project, not an official Parliament Secretariat product.

## License

Data is derived from public government sources and official parliament websites. Code in this repository is provided under the MIT license.
