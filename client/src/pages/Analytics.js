import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import axios from 'axios';
import { format, parseISO, startOfWeek, eachWeekOfInterval } from 'date-fns';

function Analytics() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/journal'),
      axios.get('/api/journal/stats'),
    ]).then(([entriesRes, statsRes]) => {
      setEntries(entriesRes.data);
      setStats(statsRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-ring"><div className="loader-ring-inner"></div></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  const closed = entries.filter(e => e.status !== 'open' && e.pnl !== null);

  // Win rate by symbol
  const symbolStats = {};
  closed.forEach(trade => {
    if (!symbolStats[trade.symbol]) {
      symbolStats[trade.symbol] = { wins: 0, losses: 0, total: 0, pnl: 0 };
    }
    symbolStats[trade.symbol].total++;
    symbolStats[trade.symbol].pnl += trade.pnl;
    if (trade.pnl > 0) symbolStats[trade.symbol].wins++;
    else symbolStats[trade.symbol].losses++;
  });

  const symbolChartData = Object.entries(symbolStats).map(([symbol, data]) => ({
    symbol,
    winRate: data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0,
    trades: data.total,
    pnl: Math.round(data.pnl * 100) / 100,
  }));

  // Win/Loss pie
  const winLossData = [
    { name: 'Wins', value: parseInt(stats.wins) || 0 },
    { name: 'Losses', value: parseInt(stats.losses) || 0 },
  ];
  const COLORS = ['var(--color-success)', 'var(--color-danger)'];

  // P&L over time (cumulative)
  const sortedClosed = [...closed].sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));
  let cumPnl = 0;
  const pnlTimeline = sortedClosed.map(trade => {
    cumPnl += trade.pnl;
    return {
      date: format(new Date(trade.exitDate), 'dd MMM'),
      pnl: Math.round(cumPnl * 100) / 100,
    };
  });

  // Direction breakdown
  const bullish = closed.filter(t => t.direction === 'BULLISH');
  const bearish = closed.filter(t => t.direction === 'BEARISH');
  const bullWinRate = bullish.length > 0 ? Math.round((bullish.filter(t => t.pnl > 0).length / bullish.length) * 100) : 0;
  const bearWinRate = bearish.length > 0 ? Math.round((bearish.filter(t => t.pnl > 0).length / bearish.length) * 100) : 0;

  // Average holding time
  const holdingTimes = sortedClosed
    .filter(t => t.entryDate && t.exitDate)
    .map(t => (new Date(t.exitDate) - new Date(t.entryDate)) / (1000 * 60 * 60));
  const avgHoldingHrs = holdingTimes.length > 0 ? Math.round(holdingTimes.reduce((a, b) => a + b, 0) / holdingTimes.length * 10) / 10 : 0;

  // Best & worst trade
  const bestTrade = sortedClosed.reduce((best, t) => (t.pnl > (best?.pnl || -Infinity) ? t : best), null);
  const worstTrade = sortedClosed.reduce((worst, t) => (t.pnl < (worst?.pnl || Infinity) ? t : worst), null);

  return (
    <div className="analytics-page">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Performance Analytics</h1>
        <p>Deep insights into your trading performance and patterns</p>
      </motion.div>

      {closed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No data yet</h3>
          <p>Close some trades to see your performance analytics here.</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <motion.div
            className="journal-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-card">
              <span className="stat-value" style={{ fontSize: '1.2rem' }}>{stats.winRate}%</span>
              <span className="stat-label">Win Rate</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ fontSize: '1.2rem', color: parseFloat(stats.totalPnl) >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {parseFloat(stats.totalPnl) >= 0 ? '+' : ''}{stats.totalPnl}
              </span>
              <span className="stat-label">Total P&L (pts)</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ fontSize: '1.2rem' }}>{closed.length}</span>
              <span className="stat-label">Closed Trades</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ fontSize: '1.2rem' }}>{avgHoldingHrs}h</span>
              <span className="stat-label">Avg Hold Time</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--color-success)' }}>
                <TrendingUp size={14} style={{ display: 'inline' }} /> {bullWinRate}%
              </span>
              <span className="stat-label">Bullish Win Rate</span>
            </div>
            <div className="stat-card">
              <span className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--color-danger)' }}>
                <TrendingDown size={14} style={{ display: 'inline' }} /> {bearWinRate}%
              </span>
              <span className="stat-label">Bearish Win Rate</span>
            </div>
          </motion.div>

          <div className="analytics-grid">
            {/* Cumulative P&L */}
            {pnlTimeline.length > 1 && (
              <motion.div className="analytics-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h3>Cumulative P&L</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={pnlTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem' }}
                    />
                    <Line type="monotone" dataKey="pnl" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Win/Loss Pie */}
            <motion.div className="analytics-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3>Win/Loss Distribution</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {winLossData.map((entry, idx) => (
                        <Cell key={idx} fill={idx === 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '0.5rem' }}>
                <span style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.85rem' }}>● Wins: {stats.wins}</span>
                <span style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.85rem' }}>● Losses: {stats.losses}</span>
              </div>
            </motion.div>

            {/* P&L by Symbol */}
            {symbolChartData.length > 0 && (
              <motion.div className="analytics-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h3>P&L by Symbol</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={symbolChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="symbol" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem' }}
                    />
                    <Bar dataKey="pnl" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Best & Worst */}
            <motion.div className="analytics-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h3>Best & Worst Trades</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bestTrade && (
                  <div style={{ padding: '1rem', background: 'var(--color-success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-success-border)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-success)', marginBottom: '0.25rem' }}>
                      <TrendingUp size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                      Best: +{bestTrade.pnl} pts
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {bestTrade.symbol} {bestTrade.strikeType} — {bestTrade.entryDate ? format(new Date(bestTrade.entryDate), 'dd MMM yy') : ''}
                    </div>
                  </div>
                )}
                {worstTrade && (
                  <div style={{ padding: '1rem', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-danger-border)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: '0.25rem' }}>
                      <TrendingDown size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                      Worst: {worstTrade.pnl} pts
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {worstTrade.symbol} {worstTrade.strikeType} — {worstTrade.entryDate ? format(new Date(worstTrade.entryDate), 'dd MMM yy') : ''}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
