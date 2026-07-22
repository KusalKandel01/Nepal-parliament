#!/usr/bin/env node
// scripts/qa/console-csp-sweep.mjs
//
// Visits every page (both languages) and fails if any of the following show
// up in the console: JS errors, uncaught page errors, or CSP violations
// (the site's CSP is script-src 'self' with no 'unsafe-inline' — see
// DEVELOPER_CONTEXT.md — so an inline <script> or a relaxed CSP anywhere
// would show up here as a "Refused to..." console error).
//
// Usage: node scripts/qa/console-csp-sweep.mjs [baseUrl]
// Default baseUrl: http://localhost:8911 (start your own static server first,
// e.g. `python3 -m http.server 8911` from the `public/` directory).

import { chromium } from "playwright";
import { allUrls, isExpectedExternalFailure } from "./pages.mjs";

const baseUrl = process.argv[2] || "http://localhost:8911";
let failures = 0;

const browser = await chromium.launch();

for (const { lang, name, url } of allUrls(baseUrl)) {
  const page = await browser.newPage();
  const problems = [];

  page.on("console", (msg) => {
    if (msg.type() === "error" && !/^Failed to load resource:/.test(msg.text())) {
      problems.push(`console.error: ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 400 && !isExpectedExternalFailure(res.url())) {
      problems.push(`HTTP ${res.status()}: ${res.url()}`);
    }
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
  } catch (e) {
    problems.push(`navigation failed: ${e.message}`);
  }

  if (problems.length) {
    failures++;
    console.log(`\n\u274c [${lang}] ${name}`);
    for (const p of problems) console.log(`   ${p}`);
  } else {
    console.log(`\u2713 [${lang}] ${name}`);
  }

  await page.close();
}

await browser.close();

console.log(`\n---\n${failures === 0 ? "ALL PAGES CLEAN" : `${failures} page(s) had problems`}`);
process.exit(failures === 0 ? 0 : 1);
