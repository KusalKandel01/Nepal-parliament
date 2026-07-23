import { chromium } from 'playwright';
const b = await chromium.launch();
for (const w of [1280, 1920]) {
  const page = await b.newPage({viewport:{width:w, height:900}});
  await page.goto('http://localhost:8911/en/directory.html', {waitUntil:'networkidle'});
  await page.screenshot({path:`/mnt/user-data/outputs/header_check_${w}.png`, clip:{x:0,y:0,width:w,height:70}});
  await page.close();
}
const page2 = await b.newPage({viewport:{width:1440, height:1000}});
await page2.goto('http://localhost:8911/en/index.html', {waitUntil:'networkidle'});
await page2.screenshot({path:'/mnt/user-data/outputs/new_home_top.png'});
await b.close();
