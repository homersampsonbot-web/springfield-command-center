const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log('Bart browser agent online');
  await page.goto('https://commander.margebot.com');

  setInterval(() => {
    console.log('BART_AGENT_HEARTBEAT');
  }, 30000);
})();
