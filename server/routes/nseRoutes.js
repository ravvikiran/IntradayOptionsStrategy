const express = require('express');
const router = express.Router();
const nseService = require('../services/nseService');

// Get option chain for a symbol
router.get('/option-chain/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await nseService.getOptionChain(symbol.toUpperCase());
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch option chain', message: error.message });
  }
});

// Get VIX data
router.get('/vix', async (req, res) => {
  try {
    const data = await nseService.getVIX();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch VIX', message: error.message });
  }
});

// Get index data
router.get('/index/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const data = await nseService.getIndexData(symbol.toUpperCase());
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch index data', message: error.message });
  }
});

// Get market status
router.get('/market-status', async (req, res) => {
  try {
    const data = await nseService.getMarketStatus();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market status', message: error.message });
  }
});

module.exports = router;
