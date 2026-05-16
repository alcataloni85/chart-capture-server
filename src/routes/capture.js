const express = require('express');
const router = express.Router();
const { captureChart } = require('../services/puppeteer');
const { uploadToSupabase } = require('../services/supabase');

// POST /capture-chart
// Body: { symbol, market, timeframe }
router.post('/capture-chart', async (req, res) => {
  const { symbol, market, timeframe } = req.body;

  if (!symbol || !market || !timeframe) {
    return res.status(400).json({
      error: 'Missing required fields: symbol, market, timeframe',
    });
  }

  try {
    console.log(`[capture] ${market}:${symbol} @ ${timeframe}`);

    const screenshotBuffer = await captureChart({ symbol, market, timeframe });

    const fileName = `${market}_${symbol}_${timeframe}_${Date.now()}.png`;
    const publicUrl = await uploadToSupabase(screenshotBuffer, fileName);

    return res.json({ url: publicUrl, fileName });
  } catch (err) {
    console.error('[capture] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
