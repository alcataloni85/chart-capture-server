const https = require('https');

const TIMEFRAME_MAP = {
  '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '30m': '30m',
  '1h': '1h', '2h': '2h', '4h': '4h', '1d': '1d',   '1w': '1w', '1M': '1M',
};

async function fetchChartImage({ symbol, market, timeframe }) {
  const interval = TIMEFRAME_MAP[timeframe] || timeframe;
  const pair     = `${market.toUpperCase()}:${symbol.toUpperCase()}`;

  const params = new URLSearchParams({
    symbol:   pair,
    interval: interval,
    width:    '800',
    height:   '500',
    theme:    'dark',
    style:    'candlestick',
    key:      'free',
  });

  const url = `https://api.chart-img.com/v1/tradingview/advanced-chart?${params}`;
  console.log(`[chart-img] GET ${url}`);

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const contentType = res.headers['content-type'] || '';

      // On error status codes chart-img returns JSON
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          reject(new Error(`chart-img ${res.statusCode}: ${body}`));
        });
        return;
      }

      if (!contentType.includes('image')) {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          reject(new Error(`chart-img unexpected content-type "${contentType}": ${body}`));
        });
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end',  () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = { fetchChartImage };
