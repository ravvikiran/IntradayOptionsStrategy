const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const nseService = require('../services/nseService');

const JOURNAL_FILE = path.join(__dirname, '../data/trade-journal.json');

// Simple lock to prevent concurrent file writes
let writeLock = Promise.resolve();

function getJournal() {
  try {
    if (!fs.existsSync(JOURNAL_FILE)) {
      const dir = path.dirname(JOURNAL_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(JOURNAL_FILE, JSON.stringify([], null, 2));
    }
    const raw = fs.readFileSync(JOURNAL_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read journal:', err.message);
    return [];
  }
}

function saveJournal(entries) {
  const dir = path.dirname(JOURNAL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(JOURNAL_FILE, JSON.stringify(entries, null, 2));
}

/**
 * Wraps a handler to serialize write operations via a simple lock.
 */
function withLock(fn) {
  return (req, res, next) => {
    writeLock = writeLock
      .then(() => fn(req, res, next))
      .catch(next);
  };
}

/**
 * Sanitize a string field to prevent injection — removes control characters.
 */
function sanitize(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').slice(0, maxLen);
}

// GET all trades
router.get('/', (req, res) => {
  try {
    const entries = getJournal();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET open trades only
router.get('/open', (req, res) => {
  const entries = getJournal().filter(e => e.status === 'open');
  res.json(entries);
});

// GET closed trades only
router.get('/closed', (req, res) => {
  const entries = getJournal().filter(e => e.status !== 'open');
  res.json(entries);
});

// GET stats
router.get('/stats', (req, res) => {
  const entries = getJournal();
  const closed = entries.filter(e => e.status !== 'open');
  const wins = closed.filter(e => e.status === 'target_hit' || (e.pnl && e.pnl > 0));
  const losses = closed.filter(e => e.status === 'sl_hit' || (e.pnl && e.pnl < 0));

  const avgWinPercent = wins.length > 0
    ? wins.reduce((sum, e) => sum + (e.pnlPercent || 0), 0) / wins.length
    : 0;
  const avgLossPercent = losses.length > 0
    ? losses.reduce((sum, e) => sum + (e.pnlPercent || 0), 0) / losses.length
    : 0;
  const totalPnl = closed.reduce((sum, e) => sum + (e.pnl || 0), 0);

  // Feedback stats
  const feedbackEntries = entries.filter(e => e.feedback);
  const goodSignals = feedbackEntries.filter(e => e.feedback === 'good_signal').length;
  const signalAccuracy = feedbackEntries.length > 0
    ? ((goodSignals / feedbackEntries.length) * 100).toFixed(0)
    : null;

  res.json({
    total: entries.length,
    open: entries.filter(e => e.status === 'open').length,
    closed: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length > 0 ? ((wins.length / closed.length) * 100).toFixed(1) : '0',
    avgWinPercent: avgWinPercent.toFixed(2),
    avgLossPercent: avgLossPercent.toFixed(2),
    totalPnl: totalPnl.toFixed(2),
    signalAccuracy,
    feedbackCount: feedbackEntries.length,
  });
});

// POST save new trade
router.post('/', withLock((req, res) => {
  if (!req.body.symbol || typeof req.body.symbol !== 'string') {
    return res.status(400).json({ error: 'symbol is required and must be a string' });
  }

  const symbol = sanitize(req.body.symbol, 20).toUpperCase();
  if (!symbol) {
    return res.status(400).json({ error: 'symbol is required' });
  }

  const entries = getJournal();
  const trade = {
    id: Date.now().toString(),
    symbol,
    name: sanitize(req.body.name || symbol, 50),
    sector: sanitize(req.body.sector || 'Index', 50),
    exchange: sanitize(req.body.exchange || 'NSE', 10),
    market: sanitize(req.body.market || 'india', 20),
    scanType: sanitize(req.body.scanType || 'signal_engine', 30),
    entryPrice: parseFloat(req.body.entryPrice) || 0,
    entryDate: req.body.entryDate || new Date().toISOString(),
    stopLoss: parseFloat(req.body.stopLoss) || 0,
    target: parseFloat(req.body.target) || 0,
    riskReward: sanitize(req.body.riskReward || '', 20),
    qualityScore: Number(req.body.qualityScore || req.body.totalScore) || 0,
    confidence: sanitize(req.body.confidence || '', 10),
    signals: Array.isArray(req.body.signals) ? req.body.signals.map(s => sanitize(String(s), 100)).slice(0, 20) : [],
    status: 'open',
    direction: sanitize(req.body.direction || '', 10),
    strikePrice: req.body.strikePrice ? parseFloat(req.body.strikePrice) : null,
    strikeType: sanitize(req.body.strikeType || '', 5),
    spotAtEntry: parseFloat(req.body.spotAtEntry) || 0,
    exitPrice: null,
    exitDate: null,
    pnl: null,
    pnlPercent: null,
    notes: sanitize(req.body.notes || '', 500),
    feedback: null,
    feedbackNote: null,
    createdAt: new Date().toISOString(),
  };

  // Calculate risk:reward if not provided
  if (!trade.riskReward && trade.entryPrice && trade.stopLoss && trade.target) {
    const risk = Math.abs(trade.entryPrice - trade.stopLoss);
    const reward = Math.abs(trade.target - trade.entryPrice);
    trade.riskReward = risk > 0 ? `1:${(reward / risk).toFixed(1)}` : '';
  }

  entries.unshift(trade);
  saveJournal(entries);
  res.status(201).json(trade);
}));

// POST close trade manually
router.post('/:id/close', withLock((req, res) => {
  const entries = getJournal();
  const idx = entries.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trade not found' });

  const exitPrice = parseFloat(req.body.exitPrice);
  if (isNaN(exitPrice) || exitPrice <= 0) {
    return res.status(400).json({ error: 'Valid exitPrice is required (must be > 0)' });
  }

  const trade = entries[idx];
  if (trade.status !== 'open') {
    return res.status(400).json({ error: 'Trade is already closed' });
  }

  trade.exitPrice = exitPrice;
  trade.exitDate = new Date().toISOString();
  trade.status = 'closed_manual';

  // Calculate P&L based on spot movement
  const entrySpot = trade.spotAtEntry || trade.entryPrice;
  if (trade.direction === 'BEARISH') {
    trade.pnl = parseFloat((entrySpot - exitPrice).toFixed(2));
    trade.pnlPercent = entrySpot > 0
      ? parseFloat(((entrySpot - exitPrice) / entrySpot * 100).toFixed(2))
      : 0;
  } else {
    trade.pnl = parseFloat((exitPrice - entrySpot).toFixed(2));
    trade.pnlPercent = entrySpot > 0
      ? parseFloat(((exitPrice - entrySpot) / entrySpot * 100).toFixed(2))
      : 0;
  }

  if (req.body.notes) trade.notes = sanitize(req.body.notes, 500);

  saveJournal(entries);
  res.json(trade);
}));

// POST check prices - fetch current prices and auto-close if SL/target hit
router.post('/check-prices', withLock(async (req, res) => {
  const entries = getJournal();
  const openTrades = entries.filter(e => e.status === 'open');

  if (openTrades.length === 0) {
    return res.json({ checked: 0, results: [], timestamp: new Date().toISOString() });
  }

  const results = [];

  for (const trade of openTrades) {
    try {
      // Fetch current spot price
      let currentPrice = 0;
      if (['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(trade.symbol)) {
        const indexName = trade.symbol === 'BANKNIFTY' ? 'NIFTY BANK'
          : trade.symbol === 'NIFTY' ? 'NIFTY 50'
          : trade.symbol;
        const indexData = await nseService.getIndexData(indexName);
        if (indexData) {
          currentPrice = indexData.last || 0;
        }
        // Fallback: use option chain
        if (!currentPrice) {
          const oc = await nseService.getOptionChain(trade.symbol);
          currentPrice = oc?.records?.underlyingValue || 0;
        }
      }

      if (!currentPrice) {
        results.push({ id: trade.id, symbol: trade.symbol, error: 'Could not fetch price' });
        continue;
      }

      const tradeIdx = entries.findIndex(e => e.id === trade.id);
      if (tradeIdx === -1) continue;

      entries[tradeIdx].currentPrice = currentPrice;
      entries[tradeIdx].lastChecked = new Date().toISOString();

      // Calculate unrealized P&L based on spot movement
      const spotAtEntry = entries[tradeIdx].spotAtEntry || 0;
      const spotMove = currentPrice - spotAtEntry;
      const spotMovePercent = spotAtEntry ? ((spotMove / spotAtEntry) * 100) : 0;
      entries[tradeIdx].unrealizedSpotMove = parseFloat(spotMove.toFixed(2));
      entries[tradeIdx].unrealizedSpotMovePercent = parseFloat(spotMovePercent.toFixed(2));

      // Auto-close logic based on SPOT price vs SL/Target levels
      if (trade.direction === 'BULLISH') {
        if (trade.target && currentPrice >= trade.target) {
          entries[tradeIdx].status = 'target_hit';
          entries[tradeIdx].exitDate = new Date().toISOString();
          entries[tradeIdx].exitPrice = currentPrice;
          entries[tradeIdx].pnl = parseFloat((currentPrice - spotAtEntry).toFixed(2));
          entries[tradeIdx].pnlPercent = spotAtEntry > 0 ? parseFloat(((currentPrice - spotAtEntry) / spotAtEntry * 100).toFixed(2)) : 0;
        } else if (trade.stopLoss && currentPrice <= trade.stopLoss) {
          entries[tradeIdx].status = 'sl_hit';
          entries[tradeIdx].exitDate = new Date().toISOString();
          entries[tradeIdx].exitPrice = currentPrice;
          entries[tradeIdx].pnl = parseFloat((currentPrice - spotAtEntry).toFixed(2));
          entries[tradeIdx].pnlPercent = spotAtEntry > 0 ? parseFloat(((currentPrice - spotAtEntry) / spotAtEntry * 100).toFixed(2)) : 0;
        }
      } else if (trade.direction === 'BEARISH') {
        if (trade.target && currentPrice <= trade.target) {
          entries[tradeIdx].status = 'target_hit';
          entries[tradeIdx].exitDate = new Date().toISOString();
          entries[tradeIdx].exitPrice = currentPrice;
          entries[tradeIdx].pnl = parseFloat((spotAtEntry - currentPrice).toFixed(2));
          entries[tradeIdx].pnlPercent = spotAtEntry > 0 ? parseFloat(((spotAtEntry - currentPrice) / spotAtEntry * 100).toFixed(2)) : 0;
        } else if (trade.stopLoss && currentPrice >= trade.stopLoss) {
          entries[tradeIdx].status = 'sl_hit';
          entries[tradeIdx].exitDate = new Date().toISOString();
          entries[tradeIdx].exitPrice = currentPrice;
          entries[tradeIdx].pnl = parseFloat((spotAtEntry - currentPrice).toFixed(2));
          entries[tradeIdx].pnlPercent = spotAtEntry > 0 ? parseFloat(((spotAtEntry - currentPrice) / spotAtEntry * 100).toFixed(2)) : 0;
        }
      }

      results.push({ id: trade.id, symbol: trade.symbol, currentPrice, status: entries[tradeIdx].status });
      await new Promise(r => setTimeout(r, 500)); // Rate limit
    } catch (err) {
      results.push({ id: trade.id, symbol: trade.symbol, error: err.message });
    }
  }

  saveJournal(entries);
  res.json({ checked: results.length, results, timestamp: new Date().toISOString() });
}));

// POST add feedback
router.post('/:id/feedback', withLock((req, res) => {
  if (!req.body.feedback) {
    return res.status(400).json({ error: 'feedback field is required' });
  }

  const validFeedback = ['good_signal', 'bad_signal', 'early_exit', 'late_entry'];
  if (!validFeedback.includes(req.body.feedback)) {
    return res.status(400).json({ error: `feedback must be one of: ${validFeedback.join(', ')}` });
  }

  const entries = getJournal();
  const idx = entries.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trade not found' });

  entries[idx].feedback = req.body.feedback;
  entries[idx].feedbackNote = sanitize(req.body.feedbackNote || '', 300);
  entries[idx].feedbackDate = new Date().toISOString();

  saveJournal(entries);
  res.json(entries[idx]);
}));

// PUT update trade (general update)
router.put('/:id', withLock((req, res) => {
  const entries = getJournal();
  const idx = entries.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Trade not found' });

  const allowedFields = ['notes', 'entryPrice', 'stopLoss', 'target', 'feedback', 'feedbackNote', 'status'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'notes' || field === 'feedbackNote') {
        entries[idx][field] = sanitize(req.body[field], 500);
      } else if (field === 'entryPrice' || field === 'stopLoss' || field === 'target') {
        entries[idx][field] = parseFloat(req.body[field]) || entries[idx][field];
      } else {
        entries[idx][field] = req.body[field];
      }
    }
  });
  entries[idx].updatedAt = new Date().toISOString();

  saveJournal(entries);
  res.json(entries[idx]);
}));

// DELETE trade
router.delete('/:id', withLock((req, res) => {
  let entries = getJournal();
  const before = entries.length;
  entries = entries.filter(e => e.id !== req.params.id);
  if (entries.length === before) return res.status(404).json({ error: 'Trade not found' });
  saveJournal(entries);
  res.json({ success: true });
}));

module.exports = router;
