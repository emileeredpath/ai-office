import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium'
  });
  const page = await browser.newPage();
  
  // Go to 3D office
  await page.goto('http://localhost:5173/3d-office', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/3d-office-final.png' });
  console.log('3D office screenshot saved');

  // Click Sandy briefing button
  await page.click('button[title="Sandy\'s Briefing"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/sandy-briefing.png' });
  console.log('Sandy briefing screenshot saved');

  // Click 3D Office button to stay on office
  const officeBtn = await page.$('[title="Office Floor"]');
  if (!officeBtn) {
    // Try clicking the sidebar icon for office floor
    await page.click('[title="Office Floor"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/office-view.png' });
    console.log('Office floor screenshot saved');
  }

  await browser.close();
})();
