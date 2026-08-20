const express = require('express');
const router = express.Router();
const nseService = require('../services/nseService');
const signalEngine = require('../services/signalEngine');

const VALID_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

// Generate signal for a symbol
router.get('/generate/:symbol', async (req, res) => {
  try {
    const upperSymbol = req.params.symbol.toUpperCase();

    if (!VALID_SYMBOLS.includes(upperSymbol)) {
      return res.status(400).json({
        error: 'Invalid symbol',
        message: `Symbol must be one of: ${VALID_SYMBOLS.join(', ')}`,
      });
    }

    // Fetch required data (VIX failure shouldn't block signal generation)
    let optionChainData, vixData;
    try {
      optionChainData = await nseService.getOptionChain(upperSymbol);
    } catch (err) {
      return res.status(503).json({
        error: 'Failed to fetch option chain data',
        message: err.message,
      });
    }

    try {
      vixData = await nseService.getVIX();
    } catch (err) {
      // VIX failure is non-critical — proceed with null
      vixData = null;
    }

    if (!optionChainData || !optionChainData.filtered || !optionChainData.records) {
      return res.status(502).json({
        error: 'Invalid option chain data received from NSE',
        message: 'Data structure unexpected. Market may be closed.',
      });
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
    let vixData = null;
    try {
      vixData = await nseService.getVIX();
    } catch (err) {
      // VIX failure is non-critical for scan
    }
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
