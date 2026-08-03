import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function Journal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [refreshingId, setRefreshingId] = useState(null);
  const [liveData, setLiveData] = useState({}); // {entryId: {spotPrice, timestamp}}

  const fetchEntries = useCallback(async () => {
    try {
      const res = await axios.get('/api/journal');
      setEntries(res.data);
    } catch (err) {
      console.error('Failed to fetch journal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setEditForm({
      entryPrice: entry.entryPrice || '',
      exitPrice: entry.exitPrice || '',
      quantity: entry.quantity || '',
      notes: entry.notes || '',
      status: entry.status || 'OPEN',
      feedback: entry.feedback || '',
      feedbackRating: entry.feedbackRating || '',
    });
  };

  const handleSave = async (id) => {
    const updates = { ...editForm };
    if (updates.entryPrice) updates.entryPrice = parseFloat(updates.entryPrice);
    if (updates.exitPrice) updates.exitPrice = parseFloat(updates.exitPrice);
    if (updates.quantity) updates.quantity = parseInt(updates.quantity);

    // Calculate P&L if both entry and exit exist
    if (updates.entryPrice && updates.exitPrice && updates.quantity) {
      updates.pnl = (updates.exitPrice - updates.entryPrice) * updates.quantity;
      if (updates.status === 'OPEN') {
        updates.status = updates.pnl >= 0 ? 'PROFIT' : 'LOSS';
      }
    }

    try {
      await axios.put(`/api/journal/${id}`, updates);
      setEditingId(null);
      fetchEntries();
    } catch (err) {
      alert('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await axios.delete(`/api/journal/${id}`);
      fetchEntries();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  // Refresh: fetch current spot price for the entry's symbol
  const handleRefresh = async (entry) => {
    setRefreshingId(entry.id);
    try {
      const res = await axios.get(`/api/signals/generate/${entry.symbol}`);
      const currentSpot = res.data.spotPrice;
      const spotAtSignal = entry.spotPrice;
      const direction = entry.direction;
      const move = currentSpot - spotAtSignal;
      const movePercent = ((move / spotAtSignal) * 100).toFixed(2);

      let tradeStatus = '';
      if (direction === 'BULLISH') {
        tradeStatus = move > 0 ? `✅ Moved in favor (+${move.toFixed(1)} pts, +${movePercent}%)` : `❌ Moved against (${move.toFixed(1)} pts, ${movePercent}%)`;
      } else {
        tradeStatus = move < 0 ? `✅ Moved in favor (${move.toFixed(1)} pts, ${movePercent}%)` : `❌ Moved against (+${move.toFixed(1)} pts, +${movePercent}%)`;
      }

      setLiveData(prev => ({
        ...prev,
        [entry.id]: {
          currentSpot,
          spotAtSignal,
          move: move.toFixed(1),
          movePercent,
          tradeStatus,
          timestamp: new Date().toLocaleTimeString('en-IN'),
          currentSignal: res.data.signal,
          currentScore: res.data.totalScore,
        }
      }));
    } catch (err) {
      setLiveData(prev => ({
        ...prev,
        [entry.id]: { error: 'Failed to fetch. Market may be closed.' }
      }));
    } finally {
      setRefreshingId(null);
    }
  };

  const getStatusClass = (status) => {
    if (status === 'PROFIT') return 'status-profit';
    if (status === 'LOSS') return 'status-loss';
    return 'status-open';
  };

  // Stats
  const totalTrades = entries.filter(e => e.status !== 'OPEN').length;
  const winners = entries.filter(e => e.status === 'PROFIT').length;
  const losers = entries.filter(e => e.status === 'LOSS').length;
  const totalPnl = entries.reduce((sum, e) => sum + (e.pnl || 0), 0);
  const winRate = totalTrades > 0 ? ((winners / totalTrades) * 100).toFixed(0) : 0;

  // Feedback stats
  const feedbackEntries = entries.filter(e => e.feedbackRating);
  const accurateSignals = feedbackEntries.filter(e => e.feedbackRating === 'accurate').length;
  const signalAccuracy = feedbackEntries.length > 0 ? ((accurateSignals / feedbackEntries.length) * 100).toFixed(0) : '-';

  if (loading) return <div className="loading"><div className="loading-spinner"></div></div>;

  return (
    <div className="journal-page">
      <h1>📔 Trade Journal</h1>
      <p>Track signals, give feedback on accuracy, and monitor live status.</p>

      {/* Stats Summary */}
      <div className="journal-stats">
        <div className="stat-card">
          <span className="stat-value">{entries.length}</span>
          <span className="stat-label">Total Saved</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalTrades}</span>
          <span className="stat-label">Closed</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{color: '#3fb950'}}>{winners}</span>
          <span className="stat-label">Winners</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{color: '#f85149'}}>{losers}</span>
          <span className="stat-label">Losers</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{winRate}%</span>
          <span className="stat-label">Win Rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{color: totalPnl >= 0 ? '#3fb950' : '#f85149'}}>
            ₹{totalPnl.toLocaleString('en-IN')}
          </span>
          <span className="stat-label">Total P&L</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{color: '#58a6ff'}}>{signalAccuracy}%</span>
          <span className="stat-label">Signal Accuracy</span>
        </div>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="journal-empty">
          <p>No entries yet. Save a signal from the Dashboard to start tracking.</p>
        </div>
      ) : (
        <div className="journal-entries">
          {entries.map(entry => (
            <div className={`journal-entry ${getStatusClass(entry.status)}`} key={entry.id}>
              <div className="journal-entry-header">
                <div>
                  <span className="journal-symbol">{entry.symbol}</span>
                  <span className={`journal-badge ${entry.direction === 'BULLISH' ? 'bullish' : 'bearish'}`}>
                    {entry.strikeType} {entry.strikeIntraday}
                  </span>
                  <span className={`journal-status ${getStatusClass(entry.status)}`}>{entry.status}</span>
                  {entry.feedbackRating && (
                    <span className={`journal-feedback-tag ${entry.feedbackRating}`}>
                      {entry.feedbackRating === 'accurate' ? '✓ Accurate' : entry.feedbackRating === 'partial' ? '~ Partial' : '✗ Wrong'}
                    </span>
                  )}
                </div>
                <div className="journal-actions">
                  {editingId !== entry.id && (
                    <>
                      <button
                        className="journal-btn refresh"
                        onClick={() => handleRefresh(entry)}
                        disabled={refreshingId === entry.id}
                      >
                        {refreshingId === entry.id ? '⏳' : '🔄'} Live
                      </button>
                      <button className="journal-btn edit" onClick={() => handleEdit(entry)}>✏️ Edit</button>
                      <button className="journal-btn delete" onClick={() => handleDelete(entry.id)}>🗑️</button>
                    </>
                  )}
                </div>
              </div>

              {/* Live Refresh Data */}
              {liveData[entry.id] && !liveData[entry.id].error && (
                <div className="journal-live-data">
                  <div className="live-header">📡 Live Status (as of {liveData[entry.id].timestamp})</div>
                  <div className="live-grid">
                    <div>
                      <span className="detail-label">Current Spot</span>
                      <span>₹{liveData[entry.id].currentSpot?.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="detail-label">Move from Signal</span>
                      <span>{liveData[entry.id].tradeStatus}</span>
                    </div>
                    <div>
                      <span className="detail-label">Current Signal</span>
                      <span>{liveData[entry.id].currentSignal} (Score: {liveData[entry.id].currentScore})</span>
                    </div>
                  </div>
                </div>
              )}
              {liveData[entry.id]?.error && (
                <div className="journal-live-data error">
                  <span>⚠️ {liveData[entry.id].error}</span>
                </div>
              )}

              <div className="journal-entry-details">
                <div className="journal-detail">
                  <span className="detail-label">Signal</span>
                  <span>{entry.signal} (Score: {entry.totalScore})</span>
                </div>
                <div className="journal-detail">
                  <span className="detail-label">Spot at Signal</span>
                  <span>₹{entry.spotPrice?.toLocaleString('en-IN')}</span>
                </div>
                <div className="journal-detail">
                  <span className="detail-label">Confidence</span>
                  <span>{entry.confidence}</span>
                </div>
                <div className="journal-detail">
                  <span className="detail-label">Saved On</span>
                  <span>{new Date(entry.createdAt).toLocaleString('en-IN')}</span>
                </div>
                {entry.entryPrice && (
                  <div className="journal-detail">
                    <span className="detail-label">Entry Price</span>
                    <span>₹{entry.entryPrice}</span>
                  </div>
                )}
                {entry.exitPrice && (
                  <div className="journal-detail">
                    <span className="detail-label">Exit Price</span>
                    <span>₹{entry.exitPrice}</span>
                  </div>
                )}
                {entry.quantity && (
                  <div className="journal-detail">
                    <span className="detail-label">Quantity</span>
                    <span>{entry.quantity}</span>
                  </div>
                )}
                {entry.pnl !== null && entry.pnl !== undefined && (
                  <div className="journal-detail">
                    <span className="detail-label">P&L</span>
                    <span style={{color: entry.pnl >= 0 ? '#3fb950' : '#f85149', fontWeight: 700}}>
                      {entry.pnl >= 0 ? '+' : ''}₹{entry.pnl?.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {entry.notes && (
                  <div className="journal-detail full-width">
                    <span className="detail-label">Notes</span>
                    <span>{entry.notes}</span>
                  </div>
                )}
                {entry.feedback && (
                  <div className="journal-detail full-width">
                    <span className="detail-label">Feedback</span>
                    <span>{entry.feedback}</span>
                  </div>
                )}
              </div>

              {/* Edit Form */}
              {editingId === entry.id && (
                <div className="journal-edit-form">
                  <div className="edit-row">
                    <label>Entry Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 150"
                      value={editForm.entryPrice}
                      onChange={e => setEditForm({...editForm, entryPrice: e.target.value})}
                    />
                  </div>
                  <div className="edit-row">
                    <label>Exit Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 200"
                      value={editForm.exitPrice}
                      onChange={e => setEditForm({...editForm, exitPrice: e.target.value})}
                    />
                  </div>
                  <div className="edit-row">
                    <label>Quantity (lots × lot size)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25"
                      value={editForm.quantity}
                      onChange={e => setEditForm({...editForm, quantity: e.target.value})}
                    />
                  </div>
                  <div className="edit-row">
                    <label>Status</label>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm({...editForm, status: e.target.value})}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="PROFIT">PROFIT</option>
                      <option value="LOSS">LOSS</option>
                      <option value="EXITED">EXITED</option>
                    </select>
                  </div>
                  <div className="edit-row full-width">
                    <label>Signal Accuracy Rating</label>
                    <select
                      value={editForm.feedbackRating}
                      onChange={e => setEditForm({...editForm, feedbackRating: e.target.value})}
                    >
                      <option value="">-- Rate this signal --</option>
                      <option value="accurate">✓ Accurate - Direction was correct</option>
                      <option value="partial">~ Partially correct - Direction right but timing/entry was off</option>
                      <option value="wrong">✗ Wrong - Direction was incorrect</option>
                    </select>
                  </div>
                  <div className="edit-row full-width">
                    <label>Feedback (What went right/wrong? What would you improve?)</label>
                    <textarea
                      placeholder="e.g. Signal said bearish but market gapped up due to global cues. OI analysis was correct but VIX rule gave wrong weight. Consider reducing VIX weight on gap days."
                      value={editForm.feedback}
                      onChange={e => setEditForm({...editForm, feedback: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <div className="edit-row full-width">
                    <label>Notes (Personal trade notes)</label>
                    <textarea
                      placeholder="Why did you take/skip this trade? Emotions? What happened?"
                      value={editForm.notes}
                      onChange={e => setEditForm({...editForm, notes: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="edit-actions">
                    <button className="journal-btn save" onClick={() => handleSave(entry.id)}>💾 Save</button>
                    <button className="journal-btn cancel" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Journal;
