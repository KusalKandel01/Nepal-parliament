import { chromium } from 'playwright';
const browser = await chromium.launch();
let failures = 0;
for (const lang of ['en', 'ne']) {
  const page = await browser.newPage();
  const errs = [];
  page.on('console', m => { if (m.type()==='error' && !/^Failed to load resource:/.test(m.text())) errs.push(m.text()); });
  page.on('pageerror', e => errs.push(String(e)));
  page.on('response', r => { if (r.status()>=400 && !r.url().includes('fonts.g') && !r.url().includes('parliament.gov.np')) errs.push('HTTP '+r.status()+' '+r.url()); });
  await page.goto(`http://localhost:8911/${lang}/index.html`, {waitUntil:'networkidle'});

  const stats = await page.locator('#statsBar .stat-item').count();
  const tools = await page.locator('.about-grid .about-card').count();
  const offices = await page.locator('#keyOfficesGrid .gov-card').count();
  const leaders = await page.locator('#homeLeaderGrid .leader-card').count();
  const donut = await page.locator('#homePartyDonut svg').count();
  console.log(lang, {stats, tools, offices, leaders, donut, errs});
  if (stats!==4 || tools!==4 || offices!==3 || leaders!==5 || donut!==1 || errs.length) failures++;

  // hero search test
  await page.fill('#heroSearchInput', 'shah');
  await page.waitForTimeout(300);
  const sug = await page.locator('#heroSuggestions .suggest-item').count();
  console.log(lang, 'suggestions for "shah":', sug);
  if (sug === 0) failures++;

  await page.close();
}
await browser.close();
console.log(failures ? `${failures} FAILURES` : 'ALL GOOD');
process.exit(failures ? 1 : 0);
