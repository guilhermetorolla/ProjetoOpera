import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  // The pre url
  await page.goto('https://ais-pre-dz6meiyizur3j3w2udfdao-656074259723.us-east1.run.app', { waitUntil: 'networkidle0' });
  
  const html = await page.content();
  console.log('HTML ROOT:', html.substring(0, 1000));
  
  await browser.close();
})();
