const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Make sure screenshots dir exists
  if (!fs.existsSync('./public/screenshots')) {
    fs.mkdirSync('./public/screenshots', { recursive: true });
  }

  try {
    // 1. Go to register and create a mock account
    await page.goto('http://localhost:5173/register');
    await page.type('input[type="text"]', 'Demo User');
    await page.type('input[type="email"]', `demo_${Date.now()}@intellmeet.com`);
    await page.type('input[type="password"]', 'securepass123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // 2. Dashboard Snapshot
    await page.screenshot({ path: './public/screenshots/dashboard.png' });
    console.log('Snapshot: dashboard.png');

    // 3. Meeting History
    await page.goto('http://localhost:5173/history', { waitUntil: 'networkidle0' });
    // Click the first meeting to show the AI summary
    const meetings = await page.$$('button.w-full.text-left');
    if (meetings.length > 0) {
      await meetings[0].click();
      await new Promise(r => setTimeout(r, 1000));
    }
    await page.screenshot({ path: './public/screenshots/history.png' });
    console.log('Snapshot: history.png');

    // 4. Kanban Board
    await page.goto('http://localhost:5173/board', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: './public/screenshots/kanban.png' });
    console.log('Snapshot: kanban.png');

    // 5. Team Workspace
    await page.goto('http://localhost:5173/team', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: './public/screenshots/team.png' });
    console.log('Snapshot: team.png');

  } catch (error) {
    console.error('Error taking snapshots:', error);
  } finally {
    await browser.close();
  }
})();
