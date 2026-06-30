import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SignalCard from '../components/SignalCard';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

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
      setError(err.response?.data?.message || 'Failed to fetch signal. NSE might be down or market is closed.');
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
        <p>Select a symbol to generate options trading signal</p>
        {lastUpdate && <p style={{fontSize: '0.85rem', color: '#58a6ff', marginTop: '0.5rem'}}>Last updated: {lastUpdate}</p>}
      </div>

      <div className="symbol-selector">
        {SYMBOLS.map(sym => (
          <button
            key={sym}
            className={`symbol-btn ${selectedSymbol === sym ? 'active' : ''}`}
            onClick={() => setSelectedSymbol(sym)}
          >
            {sym}
          </button>
        ))}
      </div>
      <p style={{fontSize: '0.8rem', color: '#8b949e', marginBottom: '1rem'}}>
        💡 Signals for NSE index options. Score ≥ ±3 triggers a signal. Score ≥ ±5 = HIGH confidence.
      </p>

      <button
        className="symbol-btn"
        onClick={() => fetchSignal(selectedSymbol)}
        style={{marginBottom: '1.5rem', background: '#1c3a5e', borderColor: '#58a6ff'}}
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
