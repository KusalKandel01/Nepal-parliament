import { chromium } from 'playwright';
const browser = await chromium.launch();
const widths = [1280, 1366, 1440, 1536, 1920];
for (const w of widths) {
  const page = await browser.newPage({viewport:{width:w, height:900}});
  await page.goto('http://localhost:8911/en/directory.html', {waitUntil:'networkidle'});
  const r = await page.evaluate(() => {
    const nav = document.querySelector('.header-nav');
    const header = document.querySelector('.site-header');
    return {
      navRect: nav ? nav.getBoundingClientRect() : null,
      headerHeight: header ? header.getBoundingClientRect().height : null,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
  console.log(w, JSON.stringify(r));
  await page.screenshot({path:`/home/claude/work/scripts/shot_${w}.png`, fullPage:false});
  await page.close();
}
await browser.close();
