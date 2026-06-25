const express = require('express');
const router = express.Router();
const nseService = require('../services/nseService');
const signalEngine = require('../services/signalEngine');

// Generate signal for a symbol
router.get('/generate/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();

    // Fetch required data (VIX failure shouldn't block signal generation)
    let optionChainData, vixData;
    try {
      [optionChainData, vixData] = await Promise.all([
        nseService.getOptionChain(upperSymbol),
        nseService.getVIX(),
      ]);
    } catch (err) {
      // If option chain fails, we can't generate signal
      return res.status(500).json({ error: 'Failed to fetch option chain data', message: err.message });
    }

    if (!optionChainData || !optionChainData.filtered || !optionChainData.records) {
      return res.status(500).json({ error: 'Invalid option chain data received from NSE', message: 'Data structure unexpected. Market may be closed.' });
    }

    // Generate signal
    const signal = signalEngine.generateSignal(optionChainData, vixData, upperSymbol);
    res.json(signal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate signal', message: error.message });
  }
});

// Generate signals for all tracked symbols
router.get('/scan', async (req, res) => {
  try {
    const symbols = ['NIFTY', 'BANKNIFTY'];
    const vixData = await nseService.getVIX();
    const signals = [];

    for (const symbol of symbols) {
      try {
        const optionChainData = await nseService.getOptionChain(symbol);
        const signal = signalEngine.generateSignal(optionChainData, vixData, symbol);
        signals.push(signal);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        signals.push({ symbol, error: err.message });
      }
    }

    res.json({ signals, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scan signals', message: error.message });
  }
});

module.exports = router;
