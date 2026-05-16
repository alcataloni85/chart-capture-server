const puppeteer = require('puppeteer');

const TIMEFRAME_MAP = {
  '1m': '1',  '3m': '3',  '5m': '5',  '15m': '15', '30m': '30',
  '1h': '60', '2h': '120','4h': '240','1d': 'D',   '1w': 'W',  '1M': 'M',
};

async function captureChart({ symbol, market, timeframe }) {
  const interval = TIMEFRAME_MAP[timeframe] || timeframe || '240';

  let pair = symbol.toUpperCase();
  if (!pair.includes(':')) {
    const prefix = market ? market.toUpperCase() : 'NYSE';
    pair = `${prefix}:${pair}`;
  }

  console.log(`[puppeteer] ${pair} @ ${interval}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 563 });

    const html = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #131722; width: 1000px; height: 563px; overflow: hidden; }
  #chart-wrapper { width: 1000px; height: 563px; }
</style>
</head>
<body>
<div id="chart-wrapper">
  <div class="tradingview-widget-container" style="width:1000px;height:563px;">
    <div id="tradingview_chart"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
    <script type="text/javascript">
      new TradingView.widget({
        "width": 1000,
        "height": 563,
        "symbol": "${pair}",
        "interval": "${interval}",
        "timezone": "exchange",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#131722",
        "hide_top_toolbar": true,
        "hide_side_toolbar": true,
        "hide_legend": false,
        "allow_symbol_change": false,
        "save_image": false,
        "container_id": "tradingview_chart"
      });
    </script>
  </div>
</div>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('[puppeteer] waiting 10 s for chart to render...');
    await new Promise((r) => setTimeout(r, 10000));

    const element = await page.$('#chart-wrapper');
    const screenshot = await element.screenshot({ type: 'png' });
    console.log(`[puppeteer] screenshot done (${screenshot.length} bytes)`);
    return screenshot;
  } finally {
    await browser.close();
  }
}

module.exports = { captureChart };
