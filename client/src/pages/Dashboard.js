import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SignalCard from '../components/SignalCard';

const INDEX_SYMBOLS = [
  { symbol: 'NIFTY', label: 'NIFTY 50' },
  { symbol: 'BANKNIFTY', label: 'BANK NIFTY' },
  { symbol: 'FINNIFTY', label: 'FIN NIFTY' },
  { symbol: 'MIDCPNIFTY', label: 'MIDCAP NIFTY' },
];

const STOCK_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
  'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
  'LT', 'AXISBANK', 'BAJFINANCE', 'MARUTI', 'TITAN',
  'SUNPHARMA', 'TATAMOTORS', 'WIPRO', 'HCLTECH', 'ADANIENT',
];

function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showStockDropdown, setShowStockDropdown] = useState(false);

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

  const handleStockSelect = (symbol) => {
    setSelectedSymbol(symbol);
    setShowStockDropdown(false);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Signal Dashboard</h1>
        <p>Select an index or stock to generate options trading signal</p>
        {lastUpdate && <p style={{fontSize: '0.85rem', color: '#58a6ff', marginTop: '0.5rem'}}>Last updated: {lastUpdate}</p>}
      </div>

      {/* Index Symbols - Primary */}
      <div className="symbol-section">
        <span className="symbol-section-label">Index Options</span>
        <div className="symbol-selector">
          {INDEX_SYMBOLS.map(({ symbol, label }) => (
            <button
              key={symbol}
              className={`symbol-btn ${selectedSymbol === symbol ? 'active' : ''}`}
              onClick={() => setSelectedSymbol(symbol)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Symbols - Dropdown */}
      <div className="symbol-section">
        <span className="symbol-section-label">Stock Options (Nifty 50)</span>
        <div className="stock-dropdown-wrapper">
          <button
            className={`symbol-btn stock-dropdown-btn ${STOCK_SYMBOLS.includes(selectedSymbol) ? 'active' : ''}`}
            onClick={() => setShowStockDropdown(!showStockDropdown)}
          >
            {STOCK_SYMBOLS.includes(selectedSymbol) ? selectedSymbol : 'Select Stock ▾'}
          </button>
          {showStockDropdown && (
            <div className="stock-dropdown">
              {STOCK_SYMBOLS.map(sym => (
                <button
                  key={sym}
                  className={`stock-dropdown-item ${selectedSymbol === sym ? 'active' : ''}`}
                  onClick={() => handleStockSelect(sym)}
                >
                  {sym}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="stock-note">⚠️ Stock option data may be limited due to NSE API restrictions</span>
      </div>

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
