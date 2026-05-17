const https = require('https');
const { execSync } = require('child_process');

async function captureChart({ symbol, market, timeframe }) {
  const tfMap = {
    '1m':'1','3m':'3','5m':'5','15m':'15','30m':'30',
    '1h':'60','2h':'120','4h':'240','1d':'D','1w':'W'
  };
  const interval = tfMap[timeframe] || '240';
  const tvSymbol = `${market}:${symbol}`;
  const url = `https://image.thum.io/get/png/width/1200/crop/600/noanimate/wait/3/${encodeURIComponent('https://www.tradingview.com/chart/?symbol=' + tvSymbol)}`;

  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = { captureChart };
