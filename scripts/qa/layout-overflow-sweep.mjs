#!/usr/bin/env node
// scripts/qa/layout-overflow-sweep.mjs
//
// Loads every page at several real-world viewport widths and fails if the
// page has horizontal overflow (scrollWidth > clientWidth), which is the
// symptom the header nav overflow bug (DEVELOPER_CONTEXT.md, header hides
// below 1180px specifically because of a past overflow incident) would
// show up as. Also checks that the mobile hamburger vs. desktop nav
// visibility matches the CSS breakpoint at each width.
//
// Usage: node scripts/qa/layout-overflow-sweep.mjs [baseUrl]

import { chromium } from "playwright";
import { allUrls } from "./pages.mjs";

const baseUrl = process.argv[2] || "http://localhost:8911";
const WIDTHS = [375, 768, 1024, 1179, 1180, 1440];
let failures = 0;

const browser = await chromium.launch();
const page = await browser.newPage();

for (const { lang, name, url } of allUrls(baseUrl)) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    } catch (e) {
      console.log(`\u274c [${lang}] ${name} @ ${width}px — navigation failed: ${e.message}`);
      failures++;
      continue;
    }

    const { scrollWidth, clientWidth, navVisible, hamburgerVisible } = await page.evaluate(() => {
      const nav = document.querySelector(".header-nav");
      const hamburger = document.querySelector(".hamburger");
      const style = (el) => (el ? getComputedStyle(el).display : "none");
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        navVisible: style(nav) !== "none",
        hamburgerVisible: style(hamburger) !== "none",
      };
    });

    const overflow = scrollWidth - clientWidth;
    const problems = [];
    if (overflow > 1) problems.push(`horizontal overflow: scrollWidth ${scrollWidth} > clientWidth ${clientWidth} (+${overflow}px)`);

    // Below/at 1180px the hamburger should show and the full nav should hide;
    // above it's the reverse (style.css uses @media (max-width: 1180px), which
    // is inclusive of 1180 itself). index.html is excluded from this specific
    // check: home.js intentionally renders lightweight custom header markup
    // for the homepage instead of the shared .header-nav/.hamburger (see
    // home.js's own top-of-file comment) — that's an established site design
    // choice, not a bug this sweep should flag.
    const expectHamburger = width <= 1180;
    if (!name.startsWith("index.html")) {
      if (expectHamburger && navVisible) problems.push("full nav visible at/below 1180px breakpoint (should be hidden)");
      if (!expectHamburger && !navVisible) problems.push("full nav hidden above 1180px breakpoint (should be visible)");
      if (expectHamburger && !hamburgerVisible) problems.push("hamburger hidden at/below 1180px breakpoint (should be visible)");
    }

    if (problems.length) {
      failures++;
      console.log(`\n\u274c [${lang}] ${name} @ ${width}px`);
      for (const p of problems) console.log(`   ${p}`);
    } else {
      console.log(`\u2713 [${lang}] ${name} @ ${width}px`);
    }
  }
}

await browser.close();

console.log(`\n---\n${failures === 0 ? "ALL PAGES CLEAN AT ALL BREAKPOINTS" : `${failures} problem(s) found`}`);
process.exit(failures === 0 ? 0 : 1);
