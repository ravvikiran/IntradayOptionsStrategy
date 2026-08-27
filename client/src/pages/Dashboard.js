import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Activity, Clock, Zap } from 'lucide-react';
import axios from 'axios';
import SignalCard from '../components/SignalCard';
import { useToast } from '../context/ToastContext';

const SYMBOLS = [
  { symbol: 'NIFTY', label: 'NIFTY 50', emoji: '📈' },
  { symbol: 'BANKNIFTY', label: 'BANK NIFTY', emoji: '🏦' },
  { symbol: 'FINNIFTY', label: 'FIN NIFTY', emoji: '💳' },
  { symbol: 'MIDCPNIFTY', label: 'MIDCAP NIFTY', emoji: '🔷' },
];

function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [marketStatus, setMarketStatus] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);
  const toast = useToast();

  const fetchSignal = useCallback(async (symbol, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/signals/generate/${symbol}`);
      setSignal(response.data);
      setLastUpdate(new Date());
      if (silent) toast.success('Signal refreshed');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch signal. NSE might be down or market is closed.';
      setError(msg);
      setSignal(null);
      if (silent) toast.error('Refresh failed');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchMarketStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/nse/market-status');
      setMarketStatus(res.data);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchSignal(selectedSymbol);
    fetchMarketStatus();
  }, [selectedSymbol, fetchSignal, fetchMarketStatus]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchSignal(selectedSymbol, true);
      }, 60000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, selectedSymbol, fetchSignal]);

  // NSE returns { marketState: [{ market: "Capital Market", marketStatus: "Open", ... }] }
  const isMarketOpen = (() => {
    if (!marketStatus) return false;
    // Check marketState array for Capital Market status
    if (marketStatus.marketState && Array.isArray(marketStatus.marketState)) {
      const capitalMarket = marketStatus.marketState.find(m => m.market === 'Capital Market');
      if (capitalMarket) return capitalMarket.marketStatus === 'Open';
      // Fallback: check if any market is open
      return marketStatus.marketState.some(m => m.marketStatus === 'Open');
    }
    // Legacy/fallback checks
    if (Array.isArray(marketStatus)) {
      return marketStatus.some(m => m.marketStatus === 'Open' || m.status === 'Open');
    }
    return marketStatus.status === 'open' || marketStatus.marketStatus === 'Open';
  })();

  return (
    <div className="dashboard">
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>Signal Dashboard</h1>
        <p>Real-time options trading signals powered by 7-rule analysis engine</p>
        {marketStatus && (
          <div className={`market-status ${isMarketOpen ? 'open' : 'closed'}`}>
            <span className="market-status-dot" />
            <span>{isMarketOpen ? 'Market Open' : 'Market Closed'}</span>
          </div>
        )}
      </motion.div>

      <motion.div
        className="symbol-selector"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {SYMBOLS.map(({ symbol, label, emoji }) => (
          <button
            key={symbol}
            className={`symbol-btn ${selectedSymbol === symbol ? 'active' : ''}`}
            onClick={() => setSelectedSymbol(symbol)}
            aria-pressed={selectedSymbol === symbol}
          >
            <span aria-hidden="true">{emoji}</span> {label}
          </button>
        ))}
      </motion.div>

      <motion.div
        className="dashboard-actions"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <button
          className="btn btn-primary refresh-btn"
          onClick={() => fetchSignal(selectedSymbol)}
          disabled={loading}
          aria-label="Refresh signal data"
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Analyzing...' : 'Refresh Signal'}
        </button>

        <label className="auto-refresh-toggle">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <span>Auto-refresh (60s)</span>
        </label>

        {lastUpdate && (
          <span className="last-update">
            <Clock size={12} /> Updated {lastUpdate.toLocaleTimeString('en-IN')}
          </span>
        )}
      </motion.div>

      {loading && !signal && (
        <motion.div
          className="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="loading-spinner"></div>
          <p>Fetching data from NSE & analyzing 7 rules...</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <Activity size={12} /> This may take a few seconds during market hours
          </p>
        </motion.div>
      )}

      {error && (
        <motion.div
          className="error-msg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Zap size={16} /> {error}
        </motion.div>
      )}

      {signal && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <SignalCard signal={signal} />
        </motion.div>
      )}

      {/* Quick info footer */}
      <div style={{ marginTop: 'var(--space-xl)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <p>Score &ge; &pm;3 triggers a signal. Score &ge; &pm;5 = HIGH confidence. Nearest weekly expiry analyzed.</p>
      </div>
    </div>
  );
}

export default Dashboard;
