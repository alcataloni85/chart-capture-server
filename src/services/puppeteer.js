const puppeteer = require('puppeteer');

async function captureChart({ symbol, market, timeframe }) {
  const tfMap = {
    '1m':'1','3m':'3','5m':'5','15m':'15','30m':'30',
    '1h':'60','2h':'120','4h':'240','1d':'D','1w':'W'
  };
  const interval = tfMap[timeframe] || '240';

  // For US stocks, try multiple exchanges
  const exchanges = market === 'us' || market === 'US'
    ? ['NASDAQ', 'NYSE', 'AMEX', 'OTC']
    : [market.toUpperCase()];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 560 });

  // Try each exchange until one works
  let tvSymbol = symbol.toUpperCase();

  const html = `<!DOCTYPE html>
<html><head><style>
* { margin:0; padding:0; }
body { background:#131722; width:1000px; height:560px; overflow:hidden; }
</style></head>
<body>
<div class="tradingview-widget-container" style="width:1000px;height:560px;">
<div id="tv"></div>
<script src="https://s3.tradingview.com/tv.js"></script>
<script>
new TradingView.widget({
  width:1000, height:560,
  symbol:"${tvSymbol}",
  interval:"${interval}",
  theme:"dark", style:"1", locale:"en",
  hide_top_toolbar:false, hide_side_toolbar:true,
  allow_symbol_change:false, save_image:false,
  container_id:"tv",
  autosize:false
});
</script>
</div>
</body></html>`;

  await page.setContent(html, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 8000));

  const screenshot = await page.screenshot({ type: 'png' });
  await browser.close();
  return screenshot;
}

module.exports = { captureChart };
