import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SignalCard from '../components/SignalCard';

const SYMBOLS = [
  { symbol: 'NIFTY', label: 'NIFTY 50' },
  { symbol: 'BANKNIFTY', label: 'BANK NIFTY' },
  { symbol: 'FINNIFTY', label: 'FIN NIFTY' },
  { symbol: 'MIDCPNIFTY', label: 'MIDCAP NIFTY' },
];

function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchSignal = useCallback(async (symbol) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/signals/generate/${symbol}`);
      setSignal(response.data);
      setLastUpdate(new Date().toLocaleTimeString('en-IN'));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch signal. NSE might be down or market is closed.');
      setSignal(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignal(selectedSymbol);
  }, [selectedSymbol, fetchSignal]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Signal Dashboard</h1>
        <p>Select an index to generate options trading signal</p>
        {lastUpdate && <p style={{fontSize: '0.85rem', color: '#58a6ff', marginTop: '0.5rem'}}>Last updated: {lastUpdate}</p>}
      </div>

      <div className="symbol-selector">
        {SYMBOLS.map(({ symbol, label }) => (
          <button
            key={symbol}
            className={`symbol-btn ${selectedSymbol === symbol ? 'active' : ''}`}
            onClick={() => setSelectedSymbol(symbol)}
          >
            {label}
          </button>
        ))}
      </div>

      <p style={{fontSize: '0.8rem', color: '#8b949e', marginBottom: '1rem'}}>
        Score ≥ ±3 triggers a signal. Score ≥ ±5 = HIGH confidence. Nearest weekly expiry analyzed.
      </p>

      <button
        className="symbol-btn refresh-btn"
        onClick={() => fetchSignal(selectedSymbol)}
        disabled={loading}
      >
        🔄 Refresh Signal
      </button>

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Fetching data from NSE & analyzing...</p>
        </div>
      )}

      {error && <div className="error-msg">⚠️ {error}</div>}

      {signal && !loading && <SignalCard signal={signal} />}
    </div>
  );
}

export default Dashboard;
