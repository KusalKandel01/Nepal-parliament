import { chromium } from 'playwright';
const browser = await chromium.launch();
const widths = [375, 768, 1024, 1180, 1280, 1366, 1440, 1536, 1920];
let bad = 0;
for (const w of widths) {
  const page = await browser.newPage({viewport:{width:w, height:900}});
  await page.goto('http://localhost:8911/en/directory.html', {waitUntil:'networkidle'});
  const r = await page.evaluate(() => {
    const nav = document.querySelector('.header-nav');
    const links = nav ? [...nav.querySelectorAll('.nav-link')] : [];
    const wrapped = links.some(a => a.getBoundingClientRect().height > 40); // single line ~40px incl padding
    const brand = document.querySelector('.brand-title');
    const brandWrapped = brand ? brand.getBoundingClientRect().height > 24 : false;
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      navLinkWrapped: wrapped,
      brandWrapped,
    };
  });
  const overflow = r.scrollWidth > r.clientWidth;
  const ok = !overflow && !r.navLinkWrapped && !r.brandWrapped;
  if (!ok) bad++;
  console.log(w, ok ? 'OK' : 'BAD', JSON.stringify(r));
  await page.close();
}
await browser.close();
console.log(bad ? `${bad} BAD WIDTHS` : 'ALL WIDTHS CLEAN');
