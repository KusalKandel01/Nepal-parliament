// scripts/qa/pages.mjs
// Every page in the site, in both languages. Shared by all three sweeps so
// there's one place to update when a new page is added.
export const PAGE_NAMES = [
  "index.html",
  "directory.html",
  "houses.html",
  "government.html",
  "member.html?id=MP0001",
  "leadership.html",
  "committees.html",
  "statistics.html",
  "downloads.html",
  "about.html",
  "tools.html",
  "find-representative.html",
  "compare.html",
  "legislative-process.html",
  "404.html",
];

export const LANGS = ["ne", "en"];

export function allUrls(baseUrl) {
  const urls = [];
  for (const lang of LANGS) {
    for (const name of PAGE_NAMES) {
      urls.push({ lang, name, url: `${baseUrl}/${lang}/${name}` });
    }
  }
  return urls;
}

// Domains that are expected to be unreachable in a local/sandboxed dev
// environment (real production hosts for fonts and member photos) — sweeps
// should not fail on these, only on failures to *our own* assets.
export const EXPECTED_EXTERNAL_FAILURE_HOSTS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "hr.parliament.gov.np",
  "na.parliament.gov.np",
];

export function isExpectedExternalFailure(url) {
  return EXPECTED_EXTERNAL_FAILURE_HOSTS.some((h) => url.includes(h));
}
