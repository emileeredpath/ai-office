import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium'
  });
  const page = await browser.newPage();
  
  // Go to office floor first
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/office-floor.png' });
  console.log('Office floor screenshot saved');

  // Navigate to 3D office
  await page.click('[title="3D Office"]');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/3d-office.png' });
  console.log('3D office screenshot saved');

  await browser.close();
})();
