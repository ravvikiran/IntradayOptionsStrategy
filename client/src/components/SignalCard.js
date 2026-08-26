import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Save, Target, Shield, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

function ScoreRing({ score, maxScore = 10 }) {
  const percent = Math.min(Math.abs(score) / maxScore * 100, 100);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color = score > 0 ? 'var(--color-success)' : score < 0 ? 'var(--color-danger)' : 'var(--text-muted)';

  return (
    <div className="score-ring">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="6" />
        <motion.circle
          cx="40" cy="40" r={radius}
          fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="score-ring-text" style={{ color }}>
        {score > 0 ? '+' : ''}{score}
      </div>
    </div>
  );
}

function ConfidenceMeter({ confidence }) {
  const levels = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
  const level = levels[confidence] || 0;
  const isHigh = confidence === 'HIGH';

  return (
    <div className="confidence-meter">
      <span className="confidence-label">{confidence}</span>
      <div className="confidence-dots">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            className={`confidence-dot ${i <= level ? 'filled' : ''} ${isHigh ? 'high' : ''}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
}

function SignalCard({ signal }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedRules, setExpandedRules] = useState(true);
  const toast = useToast();

  const isNoSignal = signal.direction === 'NEUTRAL';
  const dirClass = signal.direction === 'BULLISH' ? 'bullish' : signal.direction === 'BEARISH' ? 'bearish' : 'neutral';

  const handleSaveToJournal = async () => {
    setSaving(true);
    try {
      const strikePrice = signal.strikeRecommendation?.intraday?.strike || 0;
      const oiRule = signal.ruleResults?.find(r => r.rule === 'OI Support/Resistance');
      let stopLoss = 0, target = 0;

      if (oiRule && oiRule.value) {
        const supportMatch = oiRule.value.match(/Support:\s*(\d+)/);
        const resistanceMatch = oiRule.value.match(/Resistance:\s*(\d+)/);
        if (signal.direction === 'BULLISH') {
          stopLoss = supportMatch ? parseFloat(supportMatch[1]) : 0;
          target = resistanceMatch ? parseFloat(resistanceMatch[1]) : 0;
        } else if (signal.direction === 'BEARISH') {
          stopLoss = resistanceMatch ? parseFloat(resistanceMatch[1]) : 0;
          target = supportMatch ? parseFloat(supportMatch[1]) : 0;
        }
      }

      const entry = {
        symbol: signal.symbol,
        name: signal.symbol,
        sector: 'Index',
        exchange: 'NSE',
        market: 'india',
        scanType: 'signal_engine',
        entryPrice: strikePrice,
        stopLoss,
        target,
        qualityScore: signal.totalScore,
        confidence: signal.confidence,
        direction: signal.direction,
        strikePrice,
        strikeType: signal.direction === 'BULLISH' ? 'CE' : signal.direction === 'BEARISH' ? 'PE' : '',
        spotAtEntry: signal.spotPrice,
        signals: signal.ruleResults?.filter(r => r.score !== 0).map(r => `${r.rule}: ${r.score > 0 ? '+' : ''}${r.score}`) || [],
        notes: `Signal: ${signal.signal} | Confidence: ${signal.confidence} | Intraday: ${signal.strikeRecommendation?.intraday?.explanation || 'N/A'}`,
      };
      await axios.post('/api/journal', entry);
      setSaved(true);
      toast.success('Signal saved to journal');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error('Failed to save signal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Main Signal Card */}
      <motion.div
        className={`signal-card ${dirClass}`}
        layout
      >
        <div className="signal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {signal.direction === 'BULLISH' ? <TrendingUp size={20} color="var(--color-success)" /> :
             signal.direction === 'BEARISH' ? <TrendingDown size={20} color="var(--color-danger)" /> : null}
            <span className="signal-symbol">{signal.symbol} — ₹{signal.spotPrice?.toLocaleString('en-IN')}</span>
          </div>
          <span className={`signal-badge ${dirClass}`}>{signal.signal}</span>
        </div>

        <div className="score-gauge">
          <ScoreRing score={signal.totalScore} />
          <div className="score-details">
            <div className="signal-score">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Score:</span>
              <div className="score-bar">
                <motion.div
                  className={`score-fill ${dirClass}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.abs(signal.totalScore) / 10 * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span className="score-value" style={{ color: signal.totalScore > 0 ? 'var(--color-success)' : signal.totalScore < 0 ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                {signal.totalScore > 0 ? '+' : ''}{signal.totalScore} / ±{signal.threshold}
              </span>
            </div>
            <ConfidenceMeter confidence={signal.confidence} />
            {signal.confidence !== 'LOW' && (
              <p style={{ color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.85rem', marginTop: '0.35rem' }}>
                Trade Type: {signal.tradeType}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary save-journal-btn"
            onClick={handleSaveToJournal}
            disabled={saving || saved || isNoSignal}
            title={isNoSignal ? 'Cannot save — no actionable signal' : 'Save this signal to your trade journal'}
          >
            <Save size={14} />
            {saved ? 'Saved!' : saving ? 'Saving...' : isNoSignal ? 'No Signal' : 'Save to Journal'}
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {new Date(signal.timestamp).toLocaleString('en-IN')}
          </span>
        </div>
      </motion.div>

      {/* Strike Recommendation */}
      {signal.strikeRecommendation?.intraday && (
        <motion.div
          className="strike-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3><Target size={16} /> Strike Recommendation</h3>
          <div className="strike-rec">
            <h4>Intraday</h4>
            <p>{signal.strikeRecommendation.intraday.explanation}</p>
          </div>
          {signal.strikeRecommendation.positional && (
            <div className="strike-rec">
              <h4>Positional (2-5 days)</h4>
              <p>{signal.strikeRecommendation.positional.explanation}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Risk Management */}
      {signal.riskManagement && signal.direction !== 'NEUTRAL' && (
        <motion.div
          className="risk-section"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3><Shield size={16} /> Risk Management</h3>
          <div className="risk-item">
            <div className="risk-label">Stop-Loss</div>
            <div className="risk-value">{signal.riskManagement.stopLoss}</div>
          </div>
          <div className="risk-item">
            <div className="risk-label">Target</div>
            <div className="risk-value">{signal.riskManagement.target}</div>
          </div>
          <div className="risk-item">
            <div className="risk-label">Position Sizing</div>
            <div className="risk-value">{signal.riskManagement.positionSize}</div>
          </div>
          <div className="risk-item">
            <div className="risk-label">Time Rule</div>
            <div className="risk-value">{signal.riskManagement.timeRule}</div>
          </div>
          <div className="risk-item">
            <div className="risk-label">Entry Timing</div>
            <div className="risk-value">{signal.riskManagement.entryTiming}</div>
          </div>
        </motion.div>
      )}

      {/* Rule Breakdown */}
      <motion.div
        className="rule-results"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setExpandedRules(!expandedRules)}
        >
          Rule-by-Rule Breakdown
          {expandedRules ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </h3>
        <AnimatePresence>
          {expandedRules && signal.ruleResults?.map((rule, idx) => (
            <motion.div
              className="rule-item"
              key={idx}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
            >
              <div className="rule-item-header">
                <span className="rule-name">{rule.rule}</span>
                <span className={`rule-score ${rule.score > 0 ? 'positive' : rule.score < 0 ? 'negative' : 'zero'}`}>
                  {rule.score > 0 ? '+' : ''}{rule.score}
                </span>
              </div>
              <p className="rule-explanation">{rule.explanation}</p>
              {rule.value && <p className="rule-value">{rule.value}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default SignalCard;
