#!/usr/bin/env node
// scripts/qa/i18n-purity-sweep.mjs
//
// The project's core rule is strict directory-level language separation
// (DEVELOPER_CONTEXT.md): a /ne/ page's site chrome (header, footer,
// subnav, hero text, buttons — anything the codebase itself marks with
// data-i18n) must render in Nepali, and a /en/ page's chrome must render
// in English. Member names/parties are real bilingual content and are
// NOT checked here (only chrome text with a data-i18n attribute is).
//
// This is a heuristic, not a proof: it flags a data-i18n element if more
// than 30% of its alphabetic characters are in the "wrong" script for the
// page's language. That tolerance intentionally allows a few legitimate
// acronyms (e.g. "HoR", "NA", "PDF", "CSV") without false-flagging every
// page, while still catching the actual bug this test exists for: a whole
// English (or Nepali) string leaking onto the wrong-language page.
//
// Usage: node scripts/qa/i18n-purity-sweep.mjs [baseUrl]

import { chromium } from "playwright";
import { allUrls } from "./pages.mjs";

const baseUrl = process.argv[2] || "http://localhost:8911";
let failures = 0;

const browser = await chromium.launch();

for (const { lang, name, url } of allUrls(baseUrl)) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
  } catch (e) {
    console.log(`\u274c [${lang}] ${name} — navigation failed: ${e.message}`);
    failures++;
    await page.close();
    continue;
  }

  const results = await page.evaluate((pageLang) => {
    const devanagariRe = /[\u0900-\u097F]/g;
    const latinRe = /[A-Za-z]/g;
    const bad = [];
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const text = (el.textContent || "").trim();
      if (!text) return;
      const devCount = (text.match(devanagariRe) || []).length;
      const latCount = (text.match(latinRe) || []).length;
      const total = devCount + latCount;
      if (total < 4) return; // too short to judge (pure punctuation/numbers/short acronym)
      const wrongScriptRatio = pageLang === "ne" ? latCount / total : devCount / total;
      if (wrongScriptRatio > 0.3) {
        bad.push({ key: el.getAttribute("data-i18n"), text, ratio: wrongScriptRatio.toFixed(2) });
      }
    });
    return bad;
  }, lang);

  if (results.length) {
    failures++;
    console.log(`\n\u274c [${lang}] ${name} — possible language leakage:`);
    for (const r of results) console.log(`   data-i18n="${r.key}" -> "${r.text}" (wrong-script ratio ${r.ratio})`);
  } else {
    console.log(`\u2713 [${lang}] ${name}`);
  }

  await page.close();
}

await browser.close();

console.log(`\n---\n${failures === 0 ? "ALL PAGES CLEAN" : `${failures} page(s) flagged — review before shipping`}`);
process.exit(failures === 0 ? 0 : 1);
