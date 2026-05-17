const https = require('https');
const sharp = require('sharp');

async function captureChart({ symbol, market, timeframe }) {
  const tvSymbol = `${market}:${symbol}`;
  const tvUrl = `https://www.tradingview.com/chart/?symbol=${tvSymbol}`;
  const thumbUrl = `https://image.thum.io/get/width/1200/crop/600/${tvUrl}`;

  const rawBuffer = await new Promise((resolve, reject) => {
    https.get(thumbUrl, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });

  const compressed = await sharp(rawBuffer)
    .resize(900, 450)
    .jpeg({ quality: 75 })
    .toBuffer();

  return compressed;
}

module.exports = { captureChart };
