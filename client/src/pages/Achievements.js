import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { differenceInDays, parseISO, isSameDay, subDays } from 'date-fns';

const ACHIEVEMENTS = [
  {
    id: 'first_trade',
    name: 'First Steps',
    icon: '🎯',
    description: 'Save your first trade to the journal',
    check: (entries) => entries.length >= 1,
    progress: (entries) => Math.min(entries.length, 1),
    target: 1,
  },
  {
    id: 'five_trades',
    name: 'Getting Started',
    icon: '📈',
    description: 'Complete 5 trades',
    check: (entries) => entries.filter(e => e.status !== 'open').length >= 5,
    progress: (entries) => Math.min(entries.filter(e => e.status !== 'open').length, 5),
    target: 5,
  },
  {
    id: 'twenty_trades',
    name: 'Serious Trader',
    icon: '💼',
    description: 'Complete 20 trades',
    check: (entries) => entries.filter(e => e.status !== 'open').length >= 20,
    progress: (entries) => Math.min(entries.filter(e => e.status !== 'open').length, 20),
    target: 20,
  },
  {
    id: 'first_win',
    name: 'Winner Winner',
    icon: '🏆',
    description: 'Get your first winning trade',
    check: (entries) => entries.some(e => e.pnl > 0),
    progress: (entries) => entries.some(e => e.pnl > 0) ? 1 : 0,
    target: 1,
  },
  {
    id: 'win_streak_3',
    name: 'Hot Streak',
    icon: '🔥',
    description: 'Win 3 trades in a row',
    check: (entries) => {
      const closed = entries.filter(e => e.status !== 'open' && e.pnl !== null).sort((a, b) => new Date(b.exitDate) - new Date(a.exitDate));
      let streak = 0;
      for (const e of closed) {
        if (e.pnl > 0) { streak++; if (streak >= 3) return true; }
        else break;
      }
      return false;
    },
    progress: (entries) => {
      const closed = entries.filter(e => e.status !== 'open' && e.pnl !== null).sort((a, b) => new Date(b.exitDate) - new Date(a.exitDate));
      let streak = 0;
      for (const e of closed) {
        if (e.pnl > 0) streak++;
        else break;
      }
      return Math.min(streak, 3);
    },
    target: 3,
  },
  {
    id: 'feedback_5',
    name: 'Self Aware',
    icon: '🪞',
    description: 'Give feedback on 5 trades',
    check: (entries) => entries.filter(e => e.feedback).length >= 5,
    progress: (entries) => Math.min(entries.filter(e => e.feedback).length, 5),
    target: 5,
  },
  {
    id: 'all_symbols',
    name: 'Diversified',
    icon: '🌐',
    description: 'Trade all 4 index symbols',
    check: (entries) => {
      const symbols = new Set(entries.map(e => e.symbol));
      return ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].every(s => symbols.has(s));
    },
    progress: (entries) => {
      const symbols = new Set(entries.map(e => e.symbol));
      return ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].filter(s => symbols.has(s)).length;
    },
    target: 4,
  },
  {
    id: 'profitable_week',
    name: 'Green Week',
    icon: '💚',
    description: 'End a week with positive total P&L',
    check: (entries) => {
      const closed = entries.filter(e => e.status !== 'open' && e.pnl !== null);
      return closed.reduce((sum, e) => sum + e.pnl, 0) > 0;
    },
    progress: (entries) => {
      const closed = entries.filter(e => e.status !== 'open' && e.pnl !== null);
      return closed.reduce((sum, e) => sum + e.pnl, 0) > 0 ? 1 : 0;
    },
    target: 1,
  },
  {
    id: 'risk_reward_master',
    name: 'Risk Manager',
    icon: '🛡️',
    description: 'Complete 5 trades with R:R > 1:2',
    check: (entries) => {
      return entries.filter(e => {
        if (!e.riskReward) return false;
        const match = e.riskReward.match(/1:([\d.]+)/);
        return match && parseFloat(match[1]) >= 2;
      }).length >= 5;
    },
    progress: (entries) => {
      return Math.min(entries.filter(e => {
        if (!e.riskReward) return false;
        const match = e.riskReward.match(/1:([\d.]+)/);
        return match && parseFloat(match[1]) >= 2;
      }).length, 5);
    },
    target: 5,
  },
  {
    id: 'high_confidence',
    name: 'Sharpshooter',
    icon: '🎯',
    description: 'Win 3 trades with HIGH confidence signals',
    check: (entries) => entries.filter(e => e.confidence === 'HIGH' && e.pnl > 0).length >= 3,
    progress: (entries) => Math.min(entries.filter(e => e.confidence === 'HIGH' && e.pnl > 0).length, 3),
    target: 3,
  },
];

function Achievements() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/journal')
      .then(res => setEntries(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Calculate trading streak (consecutive days with trades)
  const tradingStreak = useMemo(() => {
    if (entries.length === 0) return 0;
    const tradeDates = entries
      .map(e => e.entryDate || e.createdAt)
      .filter(Boolean)
      .map(d => new Date(d).toDateString());
    const uniqueDates = [...new Set(tradeDates)].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (const dateStr of uniqueDates) {
      const tradeDate = new Date(dateStr);
      tradeDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((checkDate - tradeDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        streak++;
        checkDate = tradeDate;
      } else {
        break;
      }
    }
    return streak;
  }, [entries]);

  const unlockedCount = ACHIEVEMENTS.filter(a => a.check(entries)).length;

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-ring"><div className="loader-ring-inner"></div></div>
        <p>Loading achievements...</p>
      </div>
    );
  }

  return (
    <div className="achievements-page">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Achievements</h1>
        <p>Track your progress and unlock achievements as you improve your trading discipline.</p>
      </motion.div>

      {/* Streak Banner */}
      <motion.div
        className="streak-banner"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="streak-number">{tradingStreak}</div>
        <div className="streak-label">
          {tradingStreak === 0 ? 'Start your streak today!' :
           tradingStreak === 1 ? 'Day trading streak' :
           `Day trading streak`}
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}>
          {unlockedCount}/{ACHIEVEMENTS.length} achievements unlocked
        </div>
      </motion.div>

      {/* Achievement Cards */}
      <div className="achievements-grid">
        {ACHIEVEMENTS.map((achievement, idx) => {
          const unlocked = achievement.check(entries);
          const progress = achievement.progress(entries);
          const percent = Math.round((progress / achievement.target) * 100);

          return (
            <motion.div
              key={achievement.id}
              className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-name">{achievement.name}</div>
              <div className="achievement-desc">{achievement.description}</div>
              {!unlocked && (
                <div className="achievement-progress">
                  <div className="achievement-progress-fill" style={{ width: `${percent}%` }} />
                </div>
              )}
              {!unlocked && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {progress}/{achievement.target}
                </div>
              )}
              {unlocked && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ Unlocked
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default Achievements;
