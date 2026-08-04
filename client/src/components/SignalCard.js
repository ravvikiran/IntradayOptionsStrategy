import React, { useState } from 'react';
import axios from 'axios';

function SignalCard({ signal }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const isLean = signal.signal?.includes('LEAN');
  const dirClass = signal.direction === 'BULLISH' ? 'bullish' : signal.direction === 'BEARISH' ? 'bearish' : 'neutral';
  const scoreBarClass = signal.totalScore > 0 ? 'bullish' : signal.totalScore < 0 ? 'bearish' : 'neutral';
  const maxScore = 10; // Max possible absolute score (2+1+2+2+1+1+1)
  const scorePercent = Math.min(Math.abs(signal.totalScore) / maxScore * 100, 100);

  const handleSaveToJournal = async () => {
    setSaving(true);
    try {
      const strikePrice = signal.strikeRecommendation?.intraday?.strike || 0;
      const riskMgmt = signal.riskManagement || {};

      // Parse stop loss and target from risk management text
      let stopLoss = 0;
      let target = 0;

      // Get OI-based support/resistance from rule results
      const oiRule = signal.ruleResults?.find(r => r.rule === 'OI Support/Resistance');
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
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Main Signal */}
      <div className={`signal-card ${dirClass}`}>
        <div className="signal-header">
          <span className="signal-symbol">{signal.symbol} - ₹{signal.spotPrice?.toLocaleString('en-IN')}</span>
          <span className={`signal-badge ${dirClass}`}>{signal.signal}</span>
        </div>

        <div className="signal-score">
          <span style={{color: '#8b949e', fontSize: '0.85rem'}}>Score:</span>
          <div className="score-bar">
            <div 
              className={`score-fill ${scoreBarClass}`}
              style={{width: `${scorePercent}%`}}
            ></div>
          </div>
          <span className="score-value" style={{color: signal.totalScore > 0 ? '#3fb950' : signal.totalScore < 0 ? '#f85149' : '#8b949e'}}>
            {signal.totalScore > 0 ? '+' : ''}{signal.totalScore} / ±{signal.threshold}
          </span>
        </div>

        {signal.confidence !== 'LOW' && (
          <p style={{color: '#f0883e', fontWeight: 500, marginTop: '0.5rem'}}>
            Confidence: {signal.confidence} | Trade Type: {signal.tradeType}
          </p>
        )}

        <p style={{color: '#8b949e', fontSize: '0.8rem', marginTop: '0.5rem'}}>
          Generated: {new Date(signal.timestamp).toLocaleString('en-IN')}
        </p>

        <button
          className="save-journal-btn"
          onClick={handleSaveToJournal}
          disabled={saving || saved}
        >
          {saved ? '✅ Saved to Journal' : saving ? 'Saving...' : '📝 Save to Journal'}
        </button>
      </div>

      {/* Strike Recommendation - FIRST */}
      {signal.strikeRecommendation?.intraday && (
        <div className="strike-section">
          <h3>🎯 Strike Recommendation</h3>
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
        </div>
      )}

      {/* Risk Management */}
      {signal.riskManagement && signal.direction !== 'NEUTRAL' && (
        <div className="risk-section">
          <h3>⚠️ Risk Management</h3>
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
        </div>
      )}

      {/* Rule Breakdown - at the bottom for detailed explanation */}
      <div className="rule-results">
        <h3>📋 Rule-by-Rule Breakdown (Why this signal was generated)</h3>
        {signal.ruleResults?.map((rule, idx) => (
          <div className="rule-item" key={idx}>
            <div className="rule-item-header">
              <span className="rule-name">{rule.rule}</span>
              <span className={`rule-score ${rule.score > 0 ? 'positive' : rule.score < 0 ? 'negative' : 'zero'}`}>
                {rule.score > 0 ? '+' : ''}{rule.score}
              </span>
            </div>
            <p className="rule-explanation">{rule.explanation}</p>
            {rule.value && <p className="rule-value">📊 {rule.value}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SignalCard;
