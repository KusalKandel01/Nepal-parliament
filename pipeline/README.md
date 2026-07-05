# Data pipeline

These are the actual scripts used to build `public/assets/data/members.json` from the
Federal Parliament Secretariat's source PDF ("Telephone Directory 2083") and
cross-reference CSVs. Kept here so the dataset can be regenerated if the
Secretariat publishes an updated directory — see the main `README.md` and
`about.html` for the *why* behind this approach.

## Why this is more than a simple PDF-to-JSON script

The source PDF's embedded Devanagari font has a broken ToUnicode CMap: several
consonants (e.g. **म** and **ह**) decode to the same wrong character under
direct text extraction (`pdftotext`). Digits and Latin text (phone numbers,
emails) are unaffected. This pipeline therefore:

1. **`extract_v3.py` / `extract_na.py`** — extracts phone numbers and emails
   from the PDF's text layer using position-anchored parsing (pdfplumber word
   coordinates), matching multi-line phone cells to the correct row by
   nearest-neighbor distance to each serial-number label — not naive line
   order, which misattributes phones when a member has 2+ numbers spanning
   merged table cells. Names/districts are OCR'd from 300dpi rasterized page
   crops (Tesseract, Devanagari script model) as a fallback, but are **not**
   trusted as final truth — see step 3.

2. **`normalize.py`** — fuzzy-matches free-text party and province names
   against the canonical short-code list (RSP, NC, UML, MLM, RPP, SP, JSP,
   LSP, IND, NOM) so OCR noise doesn't cause misclassification.

3. **`merge_csv2.py`** — the critical accuracy step. Names and districts are
   **not** taken from the PDF text layer at all. Instead, this script uses
   optimal bipartite matching (`scipy.optimize.linear_sum_assignment` over a
   Devanagari string-similarity cost matrix) to align each PDF-derived record
   with an authoritative CSV export (correct Unicode spellings), then keeps
   the CSV's name/district and the PDF-derived phone/email/party. Optimal
   (not greedy) matching matters here because many names share prefixes
   (e.g. "रमेश कुमार मल्ल" / "रमेश कुमार सापकोटा") — greedy nearest-match
   assignment silently swaps their phone numbers.

4. **`merge_photos.py`** — cross-matches (again via optimal assignment, this
   time on English-name similarity) against the official hr.parliament.gov.np
   / na.parliament.gov.np member directories to attach profile photo URLs and
   cross-validate party codes.

## Running it

Requires: `pdfplumber`, `pytesseract` + the Tesseract `nep`/`Devanagari`
trained-data files, `scipy`, `Pillow`. Not wired into a single `make`/CLI
entry point — this was built interactively against one specific source PDF
and is provided as documentation of method + a starting point for re-running
against a future edition, not a polished one-command tool. Expect to adjust
column pixel-coordinates in `extract_v3.py`/`extract_na.py` if the
Secretariat changes the PDF's table layout.

## Known manual corrections layered on top

A handful of records — the Speaker, Deputy Speaker, Prime Minister, NA
Chairperson, and NA Vice Chairperson — were hand-verified against the PDF's
dedicated leadership contact page and patched directly, because their
special role annotations in the source table interfered with the automated
column parsing. If re-running this pipeline from scratch, re-check those five
records specifically.
