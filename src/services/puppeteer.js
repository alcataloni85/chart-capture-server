const https = require('https');

async function captureChart({ symbol, market, timeframe }) {
  const tfMap = {
    '1m':'1m','3m':'3m','5m':'5m','15m':'15m','30m':'30m',
    '1h':'1h','2h':'2h','4h':'4h','1d':'1D','1w':'1W'
  };
  const interval = tfMap[timeframe] || '4h';

  const url = `https://api.chart-img.com/v1/tradingview/advanced-chart?symbol=${market}%3A${symbol}&interval=${interval}&theme=dark&width=1200&height=600`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = { captureChart };
