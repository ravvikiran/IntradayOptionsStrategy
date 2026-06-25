import React from 'react';

function SignalCard({ signal }) {
  const dirClass = signal.direction === 'BULLISH' ? 'bullish' : signal.direction === 'BEARISH' ? 'bearish' : 'neutral';
  const maxScore = 14; // Max possible absolute score
  const scorePercent = Math.min(Math.abs(signal.totalScore) / maxScore * 100, 100);

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
              className={`score-fill ${dirClass}`}
              style={{width: `${scorePercent}%`}}
            ></div>
          </div>
          <span className="score-value" style={{color: dirClass === 'bullish' ? '#3fb950' : dirClass === 'bearish' ? '#f85149' : '#8b949e'}}>
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
      </div>

      {/* Rule Breakdown */}
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

      {/* Strike Recommendation */}
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
    </div>
  );
}

export default SignalCard;
