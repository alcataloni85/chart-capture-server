const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const https = require('https');
const path = require('path');
const fs = require('fs');

async function fetchOHLC({ symbol, market, timeframe }) {
  const tfMap = { '1h':'60', '2h':'120', '4h':'240', '1d':'D', '1w':'W', '15m':'15', '30m':'30' };
  const interval = tfMap[timeframe] || '240';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval === 'D' ? '1d' : interval === 'W' ? '1wk' : interval + 'm'}&range=6mo`;

  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const result = json.chart.result[0];
          const times = result.timestamp;
          const ohlc = result.indicators.quote[0];
          const candles = times.map((t, i) => ({
            time: t,
            open: ohlc.open[i],
            high: ohlc.high[i],
            low: ohlc.low[i],
            close: ohlc.close[i],
          })).filter(c => c.open && c.high && c.low && c.close);
          resolve(candles);
        } catch(e) { reject(e); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function captureChart({ symbol, market, timeframe }) {
  const candles = await fetchOHLC({ symbol, market, timeframe });

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1000, height: 560 },
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  // Intercept the data URL
  await page.route('**/chart-data.json', route => {
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(candles) });
  });

  const html = fs.readFileSync(path.join(__dirname, '../chart-template.html'), 'utf8')
    .replace('window.DATA_URL', `'http://localhost/chart-data.json'`);

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.CHART_READY === true', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  const screenshot = await page.screenshot({ type: 'png' });
  await browser.close();
  return screenshot;
}

module.exports = { captureChart };
