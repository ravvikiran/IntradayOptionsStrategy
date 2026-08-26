import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, Trash2, X, Check, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

function Journal() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [checkingPrices, setCheckingPrices] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [closePrice, setClosePrice] = useState('');
  const [feedbackModal, setFeedbackModal] = useState(null);
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [entriesRes, statsRes] = await Promise.all([
        axios.get('/api/journal'),
        axios.get('/api/journal/stats'),
      ]);
      setEntries(entriesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to fetch journal data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckPrices = async () => {
    setCheckingPrices(true);
    try {
      await axios.post('/api/journal/check-prices');
      await fetchData();
      toast.success('Prices updated');
    } catch (err) {
      toast.error('Failed to check prices. Market may be closed.');
    } finally {
      setCheckingPrices(false);
    }
  };

  const handleCloseTrade = async (id) => {
    if (!closePrice) { toast.warning('Enter exit price'); return; }
    try {
      await axios.post(`/api/journal/${id}/close`, { exitPrice: parseFloat(closePrice) });
      setClosingId(null);
      setClosePrice('');
      await fetchData();
      toast.success('Trade closed successfully');
    } catch (err) {
      toast.error('Failed to close trade');
    }
  };

  const handleFeedback = async (id, feedback) => {
    try {
      await axios.post(`/api/journal/${id}/feedback`, { feedback, feedbackNote: '' });
      await fetchData();
      toast.success('Feedback saved');
      setFeedbackModal(null);
    } catch (err) {
      toast.error('Failed to save feedback');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/journal/${id}`);
      await fetchData();
      toast.info('Trade deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'open': { label: 'OPEN', cls: 'status-open' },
      'target_hit': { label: 'TARGET HIT', cls: 'status-profit' },
      'sl_hit': { label: 'SL HIT', cls: 'status-loss' },
      'closed_manual': { label: 'CLOSED', cls: 'status-closed' },
    };
    return map[status] || { label: status, cls: '' };
  };

  const filteredEntries = activeTab === 'open'
    ? entries.filter(e => e.status === 'open')
    : entries.filter(e => e.status !== 'open');

  // Build cumulative P&L chart data
  const closedTrades = entries
    .filter(e => e.status !== 'open' && e.pnl !== null)
    .sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));

  let cumPnl = 0;
  const chartData = closedTrades.map(trade => {
    cumPnl += trade.pnl;
    return {
      date: format(new Date(trade.exitDate), 'dd MMM'),
      pnl: cumPnl,
      trade: `${trade.symbol} ${trade.strikeType} ${trade.pnl > 0 ? '+' : ''}${trade.pnl}`,
    };
  });

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-ring"><div className="loader-ring-inner"></div></div>
        <p>Loading journal...</p>
      </div>
    );
  }

  return (
    <div className="journal-page">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Trade Journal</h1>
        <p>Track trades, monitor live prices, auto-close at SL/target, and review your performance.</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="journal-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stat-card">
          <span className="stat-value">{stats.total || 0}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--color-accent)' }}>{stats.open || 0}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.wins || 0}</span>
          <span className="stat-label">Wins</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: 'var(--color-danger)' }}>{stats.losses || 0}</span>
          <span className="stat-label">Losses</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.winRate || 0}%</span>
          <span className="stat-label">Win Rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: parseFloat(stats.totalPnl) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {parseFloat(stats.totalPnl) >= 0 ? '+' : ''}{stats.totalPnl || '0'}
          </span>
          <span className="stat-label">Total P&L</span>
        </div>
        {stats.signalAccuracy && (
          <div className="stat-card">
            <span className="stat-value" style={{ color: 'var(--color-accent)' }}>{stats.signalAccuracy}%</span>
            <span className="stat-label">Signal Accuracy</span>
          </div>
        )}
      </motion.div>

      {/* P&L Chart */}
      {chartData.length > 1 && (
        <motion.div
          className="pnl-chart-container"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3>Cumulative P&L (points)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Line
                type="monotone"
                dataKey="pnl"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-accent)', r: 3 }}
                activeDot={{ r: 5, fill: 'var(--color-accent)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

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
          <button className="btn btn-primary" onClick={handleCheckPrices} disabled={checkingPrices}>
            <RefreshCw size={14} className={checkingPrices ? 'spinning' : ''} />
            {checkingPrices ? 'Checking...' : 'Check Prices'}
          </button>
        )}
      </div>

      {/* Trade Cards */}
      {filteredEntries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{activeTab === 'open' ? '📊' : '📝'}</div>
          <h3>{activeTab === 'open' ? 'No open trades' : 'No closed trades yet'}</h3>
          <p>{activeTab === 'open' ? 'Save a signal from the Dashboard to start tracking.' : 'Close some trades to see your history here.'}</p>
        </div>
      ) : (
        <div className="journal-entries">
          <AnimatePresence>
            {filteredEntries.map(trade => {
              const statusInfo = getStatusBadge(trade.status);
              const isOpen = trade.status === 'open';
              const hasUnrealized = trade.unrealizedSpotMove !== undefined;

              return (
                <motion.div
                  className={`journal-entry ${statusInfo.cls}`}
                  key={trade.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                >
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
                          {trade.feedback === 'good_signal' ? '✓ Good' : trade.feedback === 'bad_signal' ? '✗ Bad' : trade.feedback === 'early_exit' ? '⏰ Early' : '⏳ Late'}
                        </span>
                      )}
                    </div>
                    <div className="journal-actions">
                      {isOpen && closingId !== trade.id && (
                        <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }} onClick={() => setClosingId(trade.id)}>Close</button>
                      )}
                      {!trade.feedback && (
                        <button className="btn btn-ghost btn-icon" onClick={() => setFeedbackModal(trade.id)} title="Give feedback">
                          <MessageSquare size={14} />
                        </button>
                      )}
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(trade.id)} title="Delete trade">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

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
                      <span style={{ color: 'var(--color-danger)' }}>₹{trade.stopLoss?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="journal-detail">
                      <span className="detail-label">Target</span>
                      <span style={{ color: 'var(--color-success)' }}>₹{trade.target?.toLocaleString('en-IN')}</span>
                    </div>
                    {trade.riskReward && (
                      <div className="journal-detail">
                        <span className="detail-label">R:R</span>
                        <span>{trade.riskReward}</span>
                      </div>
                    )}
                    <div className="journal-detail">
                      <span className="detail-label">Score</span>
                      <span>{trade.qualityScore} / {trade.confidence}</span>
                    </div>
                    <div className="journal-detail">
                      <span className="detail-label">Entry Date</span>
                      <span>{format(new Date(trade.entryDate), 'dd MMM yy, HH:mm')}</span>
                    </div>
                    {isOpen && hasUnrealized && (
                      <div className="journal-detail">
                        <span className="detail-label">Unrealized</span>
                        <span style={{ color: trade.unrealizedSpotMove >= 0 ? (trade.direction === 'BULLISH' ? 'var(--color-success)' : 'var(--color-danger)') : (trade.direction === 'BEARISH' ? 'var(--color-success)' : 'var(--color-danger)'), fontWeight: 700 }}>
                          {trade.unrealizedSpotMove >= 0 ? '+' : ''}{trade.unrealizedSpotMove} pts
                        </span>
                      </div>
                    )}
                    {!isOpen && trade.pnl !== null && (
                      <div className="journal-detail">
                        <span className="detail-label">P&L</span>
                        <span style={{ color: trade.pnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>
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
                  </div>

                  {trade.signals && trade.signals.length > 0 && (
                    <div className="trade-signals">
                      <span className="detail-label">Signals</span>
                      <div className="signal-tags">
                        {trade.signals.map((s, i) => <span key={i} className="signal-tag">{s}</span>)}
                      </div>
                    </div>
                  )}

                  {trade.notes && (
                    <div className="trade-notes">
                      <span className="detail-label">Notes</span>
                      <p>{trade.notes}</p>
                    </div>
                  )}

                  {/* Close Trade Form */}
                  {closingId === trade.id && (
                    <motion.div
                      className="close-trade-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <input
                        type="number"
                        placeholder="Exit price (spot)"
                        value={closePrice}
                        onChange={e => setClosePrice(e.target.value)}
                        autoFocus
                      />
                      <button className="btn btn-success" style={{ padding: '0.4rem 0.7rem' }} onClick={() => handleCloseTrade(trade.id)}>
                        <Check size={14} /> Confirm
                      </button>
                      <button className="btn btn-ghost" onClick={() => { setClosingId(null); setClosePrice(''); }}>
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFeedbackModal(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3>Rate this Signal</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
                How did this signal perform? Your feedback improves accuracy tracking.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-success" onClick={() => handleFeedback(feedbackModal, 'good_signal')} style={{ justifyContent: 'center' }}>
                  <Check size={14} /> Good Signal
                </button>
                <button className="btn btn-danger" onClick={() => handleFeedback(feedbackModal, 'bad_signal')} style={{ justifyContent: 'center' }}>
                  <X size={14} /> Bad Signal
                </button>
                <button className="btn btn-secondary" onClick={() => handleFeedback(feedbackModal, 'early_exit')} style={{ justifyContent: 'center' }}>
                  ⏰ Early Exit
                </button>
                <button className="btn btn-secondary" onClick={() => handleFeedback(feedbackModal, 'late_entry')} style={{ justifyContent: 'center' }}>
                  ⏳ Late Entry
                </button>
              </div>
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setFeedbackModal(null)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Journal;
