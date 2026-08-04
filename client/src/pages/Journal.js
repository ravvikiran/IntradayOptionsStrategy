import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function Journal() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [checkingPrices, setCheckingPrices] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [closePrice, setClosePrice] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [entriesRes, statsRes] = await Promise.all([
        axios.get('/api/journal'),
        axios.get('/api/journal/stats'),
      ]);
      setEntries(entriesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch journal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckPrices = async () => {
    setCheckingPrices(true);
    try {
      await axios.post('/api/journal/check-prices');
      await fetchData();
    } catch (err) {
      alert('Failed to check prices. Market may be closed.');
    } finally {
      setCheckingPrices(false);
    }
  };

  const handleCloseTrade = async (id) => {
    if (!closePrice) { alert('Enter exit price'); return; }
    try {
      await axios.post(`/api/journal/${id}/close`, { exitPrice: parseFloat(closePrice) });
      setClosingId(null);
      setClosePrice('');
      await fetchData();
    } catch (err) {
      alert('Failed to close trade');
    }
  };

  const handleFeedback = async (id, feedback) => {
    const feedbackNote = prompt('Any notes about this feedback? (optional)') || '';
    try {
      await axios.post(`/api/journal/${id}/feedback`, { feedback, feedbackNote });
      await fetchData();
    } catch (err) {
      alert('Failed to save feedback');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trade?')) return;
    try {
      await axios.delete(`/api/journal/${id}`);
      await fetchData();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'open': { label: 'OPEN', cls: 'status-open' },
      'target_hit': { label: 'TARGET HIT ✓', cls: 'status-profit' },
      'sl_hit': { label: 'SL HIT ✗', cls: 'status-loss' },
      'closed_manual': { label: 'CLOSED', cls: 'status-closed' },
    };
    return map[status] || { label: status, cls: '' };
  };

  const filteredEntries = activeTab === 'open'
    ? entries.filter(e => e.status === 'open')
    : entries.filter(e => e.status !== 'open');

  if (loading) return <div className="loading"><div className="loading-spinner"></div></div>;

  return (
    <div className="journal-page">
      <h1>📔 Trade Journal</h1>
      <p>Track trades, monitor live prices, auto-close at SL/target, give feedback.</p>

      {/* Stats */}
      <div className="journal-stats">
        <div className="stat-card">
          <span className="stat-value">{stats.total || 0}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{color:'#58a6ff'}}>{stats.open || 0}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{color:'#3fb950'}}>{stats.wins || 0}</span>
          <span className="stat-label">Wins</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{color:'#f85149'}}>{stats.losses || 0}</span>
          <span className="stat-label">Losses</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.winRate || 0}%</span>
          <span className="stat-label">Win Rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{color: parseFloat(stats.totalPnl) >= 0 ? '#3fb950' : '#f85149'}}>
            {parseFloat(stats.totalPnl) >= 0 ? '+' : ''}{stats.totalPnl || '0'}
          </span>
          <span className="stat-label">Total P&L (pts)</span>
        </div>
        {stats.signalAccuracy && (
          <div className="stat-card">
            <span className="stat-value" style={{color:'#a5d6ff'}}>{stats.signalAccuracy}%</span>
            <span className="stat-label">Signal Accuracy</span>
          </div>
        )}
      </div>

      {/* Tabs + Check Prices */}
      <div className="journal-toolbar">
        <div className="journal-tabs">
          <button className={`tab-btn ${activeTab === 'open' ? 'active' : ''}`} onClick={() => setActiveTab('open')}>
            Open ({entries.filter(e => e.status === 'open').length})
          </button>
          <button className={`tab-btn ${activeTab === 'closed' ? 'active' : ''}`} onClick={() => setActiveTab('closed')}>
            Closed ({entries.filter(e => e.status !== 'open').length})
          </button>
        </div>
        {activeTab === 'open' && (
          <button className="check-prices-btn" onClick={handleCheckPrices} disabled={checkingPrices}>
            {checkingPrices ? '⏳ Checking...' : '🔄 Check Prices'}
          </button>
        )}
      </div>

      {/* Trade Cards */}
      {filteredEntries.length === 0 ? (
        <div className="journal-empty">
          <p>{activeTab === 'open' ? 'No open trades. Save a signal from the Dashboard.' : 'No closed trades yet.'}</p>
        </div>
      ) : (
        <div className="journal-entries">
          {filteredEntries.map(trade => {
            const statusInfo = getStatusBadge(trade.status);
            const isOpen = trade.status === 'open';
            const hasUnrealized = trade.unrealizedSpotMove !== undefined;

            return (
              <div className={`journal-entry ${statusInfo.cls}`} key={trade.id}>
                <div className="journal-entry-header">
                  <div className="trade-title">
                    <span className="journal-symbol">{trade.symbol}</span>
                    {trade.strikeType && trade.strikePrice && (
                      <span className={`journal-badge ${trade.direction === 'BULLISH' ? 'bullish' : 'bearish'}`}>
                        {trade.strikeType} {trade.strikePrice}
                      </span>
                    )}
                    <span className={`journal-status ${statusInfo.cls}`}>{statusInfo.label}</span>
                    {trade.feedback && (
                      <span className={`journal-feedback-tag ${trade.feedback}`}>
                        {trade.feedback === 'good_signal' ? '✓ Good' : trade.feedback === 'bad_signal' ? '✗ Bad' : trade.feedback === 'early_exit' ? '⏰ Early Exit' : '⏳ Late Entry'}
                      </span>
                    )}
                  </div>
                  <div className="journal-actions">
                    {isOpen && closingId !== trade.id && (
                      <button className="journal-btn" onClick={() => setClosingId(trade.id)}>Close Trade</button>
                    )}
                    <button className="journal-btn delete" onClick={() => handleDelete(trade.id)}>🗑️</button>
                  </div>
                </div>

                {/* Trade Details Grid */}
                <div className="journal-entry-details">
                  <div className="journal-detail">
                    <span className="detail-label">Spot at Entry</span>
                    <span>₹{trade.spotAtEntry?.toLocaleString('en-IN')}</span>
                  </div>
                  {trade.currentPrice && isOpen && (
                    <div className="journal-detail">
                      <span className="detail-label">Current Spot</span>
                      <span>₹{trade.currentPrice?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="journal-detail">
                    <span className="detail-label">Stop Loss</span>
                    <span style={{color:'#f85149'}}>₹{trade.stopLoss?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="journal-detail">
                    <span className="detail-label">Target</span>
                    <span style={{color:'#3fb950'}}>₹{trade.target?.toLocaleString('en-IN')}</span>
                  </div>
                  {trade.riskReward && (
                    <div className="journal-detail">
                      <span className="detail-label">R:R</span>
                      <span>{trade.riskReward}</span>
                    </div>
                  )}
                  <div className="journal-detail">
                    <span className="detail-label">Score / Confidence</span>
                    <span>{trade.qualityScore} / {trade.confidence}</span>
                  </div>
                  <div className="journal-detail">
                    <span className="detail-label">Entry Date</span>
                    <span>{new Date(trade.entryDate).toLocaleString('en-IN')}</span>
                  </div>
                  {/* Unrealized P&L for open trades */}
                  {isOpen && hasUnrealized && (
                    <div className="journal-detail">
                      <span className="detail-label">Unrealized Move</span>
                      <span style={{color: trade.unrealizedSpotMove >= 0 ? (trade.direction === 'BULLISH' ? '#3fb950' : '#f85149') : (trade.direction === 'BEARISH' ? '#3fb950' : '#f85149'), fontWeight: 700}}>
                        {trade.unrealizedSpotMove >= 0 ? '+' : ''}{trade.unrealizedSpotMove} pts ({trade.unrealizedSpotMovePercent}%)
                      </span>
                    </div>
                  )}
                  {/* Realized P&L for closed trades */}
                  {!isOpen && trade.pnl !== null && (
                    <div className="journal-detail">
                      <span className="detail-label">P&L</span>
                      <span style={{color: trade.pnl >= 0 ? '#3fb950' : '#f85149', fontWeight: 700}}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl} pts ({trade.pnlPercent}%)
                      </span>
                    </div>
                  )}
                  {trade.exitPrice && (
                    <div className="journal-detail">
                      <span className="detail-label">Exit Price</span>
                      <span>₹{trade.exitPrice?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {trade.lastChecked && isOpen && (
                    <div className="journal-detail">
                      <span className="detail-label">Last Checked</span>
                      <span>{new Date(trade.lastChecked).toLocaleTimeString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {/* Signals */}
                {trade.signals && trade.signals.length > 0 && (
                  <div className="trade-signals">
                    <span className="detail-label">Signals</span>
                    <div className="signal-tags">
                      {trade.signals.map((s, i) => <span key={i} className="signal-tag">{s}</span>)}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {trade.notes && (
                  <div className="trade-notes">
                    <span className="detail-label">Notes</span>
                    <p>{trade.notes}</p>
                  </div>
                )}
                {trade.feedbackNote && (
                  <div className="trade-notes">
                    <span className="detail-label">Feedback Note</span>
                    <p>{trade.feedbackNote}</p>
                  </div>
                )}

                {/* Close Trade Form */}
                {closingId === trade.id && (
                  <div className="close-trade-form">
                    <input
                      type="number"
                      placeholder="Exit price (spot)"
                      value={closePrice}
                      onChange={e => setClosePrice(e.target.value)}
                    />
                    <button className="journal-btn save" onClick={() => handleCloseTrade(trade.id)}>Confirm Close</button>
                    <button className="journal-btn cancel" onClick={() => { setClosingId(null); setClosePrice(''); }}>Cancel</button>
                  </div>
                )}

                {/* Feedback Buttons */}
                {!trade.feedback && (
                  <div className="feedback-buttons">
                    <span className="detail-label">Rate Signal:</span>
                    <button className="fb-btn good" onClick={() => handleFeedback(trade.id, 'good_signal')}>✓ Good Signal</button>
                    <button className="fb-btn bad" onClick={() => handleFeedback(trade.id, 'bad_signal')}>✗ Bad Signal</button>
                    <button className="fb-btn early" onClick={() => handleFeedback(trade.id, 'early_exit')}>⏰ Early Exit</button>
                    <button className="fb-btn late" onClick={() => handleFeedback(trade.id, 'late_entry')}>⏳ Late Entry</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Journal;
