const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function captureChart({ symbol, market, timeframe }) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 600 });

  const url = `https://www.tradingview.com/widgetbar-chart-popup/?symbol=${market}:${symbol}&interval=${timeframe}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));

  const buffer = await page.screenshot({ type: 'png' });
  await browser.close();
  return buffer;
}

module.exports = { captureChart };
