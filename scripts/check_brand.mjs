import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({viewport:{width:1280,height:900}});
await page.goto('http://localhost:8911/en/directory.html', {waitUntil:'networkidle'});
const html = await page.locator('.brand-title').innerHTML();
console.log(JSON.stringify(html));
const rect = await page.locator('.brand-title').boundingBox();
console.log(rect);
await b.close();
