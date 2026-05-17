require('dotenv').config();
const express = require('express');
const captureRoute = require('./routes/capture');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Shared handler for both GET and POST /capture
async function handleCapture(req, res) {
  const { captureChart }    = require('./services/puppeteer');
  const { uploadToSupabase } = require('./services/supabase');

  // GET  → query params:  ?symbol=NASDAQ:AAPL&timeframe=4h
  // POST → JSON body:     { symbol, market, timeframe }  OR  { symbol: "NASDAQ:AAPL", timeframe }
  let symbol, market, timeframe;

  if (req.method === 'POST') {
    const body = req.body || {};
    // Accept either "NASDAQ:AAPL" in symbol or separate market+symbol
    if (body.symbol && body.symbol.includes(':')) {
      [market, symbol] = body.symbol.split(':');
    } else {
      symbol = body.symbol;
      market = body.market || 'NASDAQ';
    }
    timeframe = body.timeframe || body.interval || '4h';
  } else {
    const raw = req.query.symbol || '';
    [market, symbol] = raw.includes(':') ? raw.split(':') : ['NASDAQ', raw];
    timeframe = req.query.timeframe || '4h';
  }

  symbol = (symbol || '').trim().toUpperCase();
  market = (market || 'NASDAQ').trim().toUpperCase();

  if (!symbol) return res.status(400).json({ error: 'symbol is required' });

  try {
    console.log(`[${req.method} /capture] ${market}:${symbol} @ ${timeframe}`);
    const buf      = await captureChart({ symbol, market, timeframe });
    const fileName = `${market}_${symbol}_${timeframe}_${Date.now()}.jpg`;
    const url      = await uploadToSupabase(buf, fileName);
    res.json({ url, fileName });
  } catch (err) {
    console.error('[/capture] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

app.get('/capture',  handleCapture);
app.post('/capture', handleCapture);

app.use('/', captureRoute);

app.listen(PORT, () => {
  console.log(`chart-capture-server running on port ${PORT}`);
});
