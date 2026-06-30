/**
 * Signal Engine - The brain of the application
 * 
 * Generates BUY CE (Bullish) or BUY PE (Bearish) signals based on
 * a scoring system. Each rule adds/subtracts from the score.
 * Signal fires only when score crosses a threshold.
 * 
 * RULES USED (explained in learning module):
 * 1. OI Analysis - Where big money is positioned
 * 2. PCR (Put-Call Ratio) - Market sentiment gauge
 * 3. IV Analysis - Are options cheap or expensive?
 * 4. Max Pain - Where market makers want price to go
 * 5. OI-based Support/Resistance - Real walls in the market
 * 6. Volume-OI Divergence - Is the move real or fake?
 * 7. VIX Analysis - Should you even trade today?
 * 8. Change in OI - Who's entering/exiting now?
 */

class SignalEngine {
  constructor() {
    this.SIGNAL_THRESHOLD = 3; // Minimum score to trigger signal
    this.HIGH_CONFIDENCE_THRESHOLD = 5; // Score for HIGH confidence
    this.rules = [];
  }

  /**
   * RULE 1: PCR Analysis
   * PCR < 0.7 = Overbought (Bearish signal)
   * PCR > 1.3 = Oversold (Bullish signal)
   * PCR 0.7-1.3 = Neutral
   */
  analyzePCR(optionChainData) {
    const records = optionChainData.filtered?.data || [];
    let totalPutOI = 0;
    let totalCallOI = 0;

    records.forEach(record => {
      if (record.PE) totalPutOI += record.PE.openInterest || 0;
      if (record.CE) totalCallOI += record.CE.openInterest || 0;
    });

    const pcr = totalCallOI > 0 ? totalPutOI / totalCallOI : 1;
    let score = 0;
    let explanation = '';

    if (pcr > 1.3) {
      score = 2;
      explanation = `PCR is ${pcr.toFixed(2)} (>1.3) - Excessive put writing indicates bullish sentiment. Big players are selling puts = they expect market to go UP.`;
    } else if (pcr < 0.7) {
      score = -2;
      explanation = `PCR is ${pcr.toFixed(2)} (<0.7) - Excessive call writing indicates bearish sentiment. Big players are selling calls = they expect market to go DOWN.`;
    } else {
      explanation = `PCR is ${pcr.toFixed(2)} (neutral range 0.7-1.3) - No strong directional bias from options writers.`;
    }

    return { rule: 'PCR Analysis', score, explanation, value: pcr.toFixed(2) };
  }

  /**
   * RULE 2: Max Pain Analysis
   * If current price > max pain = Price likely to come down (Bearish)
   * If current price < max pain = Price likely to go up (Bullish)
   * Stronger signal closer to expiry
   */
  analyzeMaxPain(optionChainData) {
    const records = optionChainData.filtered?.data || [];
    const strikePrices = records
      .filter(r => r.strikePrice)
      .map(r => r.strikePrice);

    if (strikePrices.length === 0) {
      return { rule: 'Max Pain', score: 0, explanation: 'Insufficient data for Max Pain calculation.', value: 'N/A' };
    }

    let minPain = Infinity;
    let maxPainStrike = 0;

    // For each possible expiry price (strike), calculate total intrinsic value
    // paid out to option buyers. Max pain = strike where this is minimized.
    strikePrices.forEach(expiryPrice => {
      let totalPain = 0;
      records.forEach(record => {
        const s = record.strikePrice;
        // Call buyers profit when expiry price > their strike
        if (record.CE && expiryPrice > s) {
          totalPain += (expiryPrice - s) * (record.CE.openInterest || 0);
        }
        // Put buyers profit when expiry price < their strike
        if (record.PE && expiryPrice < s) {
          totalPain += (s - expiryPrice) * (record.PE.openInterest || 0);
        }
      });
      if (totalPain < minPain) {
        minPain = totalPain;
        maxPainStrike = expiryPrice;
      }
    });

    const spotPrice = optionChainData.records?.underlyingValue || 0;
    const diff = spotPrice - maxPainStrike;
    const diffPercent = spotPrice > 0 ? (diff / spotPrice) * 100 : 0;

    let score = 0;
    let explanation = '';

    if (diffPercent > 0.3) {
      score = -1;
      explanation = `Spot (${spotPrice}) is ABOVE Max Pain (${maxPainStrike}). Market makers profit if price drops. Bearish pull toward ${maxPainStrike}.`;
    } else if (diffPercent < -0.3) {
      score = 1;
      explanation = `Spot (${spotPrice}) is BELOW Max Pain (${maxPainStrike}). Market makers profit if price rises. Bullish pull toward ${maxPainStrike}.`;
    } else {
      explanation = `Spot (${spotPrice}) is near Max Pain (${maxPainStrike}). Price is at equilibrium - expect range-bound action.`;
    }

    return { rule: 'Max Pain', score, explanation, value: maxPainStrike };
  }

  /**
   * RULE 3: OI-Based Support & Resistance
   * Highest Put OI strike = Support (big money protecting this level)
   * Highest Call OI strike = Resistance (big money capping at this level)
   * If price near support = Bullish bounce expected
   * If price near resistance = Bearish rejection expected
   */
  analyzeOISupRes(optionChainData) {
    const records = optionChainData.filtered?.data || [];
    const spotPrice = optionChainData.records?.underlyingValue || 0;

    let maxPutOI = 0, maxPutStrike = 0;
    let maxCallOI = 0, maxCallStrike = 0;

    records.forEach(record => {
      if (record.PE && record.PE.openInterest > maxPutOI) {
        maxPutOI = record.PE.openInterest;
        maxPutStrike = record.strikePrice;
      }
      if (record.CE && record.CE.openInterest > maxCallOI) {
        maxCallOI = record.CE.openInterest;
        maxCallStrike = record.strikePrice;
      }
    });

    let score = 0;
    let explanation = '';
    const midPoint = (maxCallStrike + maxPutStrike) / 2;

    // Guard: If OI data is invalid or support > resistance, skip scoring
    if (maxPutStrike === 0 || maxCallStrike === 0 || maxPutStrike >= maxCallStrike) {
      explanation = `OI Support/Resistance levels unclear. Put OI max: ${maxPutStrike}, Call OI max: ${maxCallStrike}. Cannot determine range.`;
      return { rule: 'OI Support/Resistance', score: 0, explanation, value: `Support: ${maxPutStrike} | Resistance: ${maxCallStrike}` };
    }

    if (spotPrice <= maxPutStrike * 1.005) {
      score = 2;
      explanation = `Spot (${spotPrice}) is at/near PUT SUPPORT (${maxPutStrike} with ${maxPutOI.toLocaleString()} OI). Heavy put writing here = big players defending this level. Expect bullish bounce.`;
    } else if (spotPrice >= maxCallStrike * 0.995) {
      score = -2;
      explanation = `Spot (${spotPrice}) is at/near CALL RESISTANCE (${maxCallStrike} with ${maxCallOI.toLocaleString()} OI). Heavy call writing here = big players capping upside. Expect bearish rejection.`;
    } else if (spotPrice > midPoint) {
      score = -1;
      explanation = `Spot (${spotPrice}) is in upper half of OI range. Support: ${maxPutStrike} | Resistance: ${maxCallStrike}. Leaning bearish as approaching resistance.`;
    } else {
      score = 1;
      explanation = `Spot (${spotPrice}) is in lower half of OI range. Support: ${maxPutStrike} | Resistance: ${maxCallStrike}. Leaning bullish as closer to support.`;
    }

    return {
      rule: 'OI Support/Resistance',
      score,
      explanation,
      value: `Support: ${maxPutStrike} | Resistance: ${maxCallStrike}`
    };
  }

  /**
   * RULE 4: Change in OI Analysis
   * Rising OI + Rising Price = Long buildup (Bullish)
   * Rising OI + Falling Price = Short buildup (Bearish)
   * Falling OI + Rising Price = Short covering (Weak Bullish)
   * Falling OI + Falling Price = Long unwinding (Weak Bearish)
   */
  analyzeChangeInOI(optionChainData) {
    const records = optionChainData.filtered?.data || [];
    const spotPrice = optionChainData.records?.underlyingValue || 0;

    let totalCallOIChange = 0;
    let totalPutOIChange = 0;

    records.forEach(record => {
      if (record.CE) totalCallOIChange += record.CE.changeinOpenInterest || 0;
      if (record.PE) totalPutOIChange += record.PE.changeinOpenInterest || 0;
    });

    let score = 0;
    let explanation = '';

    if (totalPutOIChange > totalCallOIChange && totalPutOIChange > 0) {
      score = 2;
      explanation = `Put OI increasing (+${totalPutOIChange.toLocaleString()}) more than Call OI (+${totalCallOIChange.toLocaleString()}). Fresh put writing = Bullish. Writers are betting market WON'T fall.`;
    } else if (totalCallOIChange > totalPutOIChange && totalCallOIChange > 0) {
      score = -2;
      explanation = `Call OI increasing (+${totalCallOIChange.toLocaleString()}) more than Put OI (+${totalPutOIChange.toLocaleString()}). Fresh call writing = Bearish. Writers are betting market WON'T rise.`;
    } else if (totalPutOIChange < 0 && Math.abs(totalPutOIChange) > Math.abs(totalCallOIChange)) {
      score = -1;
      explanation = `Put OI unwinding (${totalPutOIChange.toLocaleString()}). Put writers closing positions = they no longer want to defend support. Mildly bearish.`;
    } else if (totalCallOIChange < 0 && Math.abs(totalCallOIChange) > Math.abs(totalPutOIChange)) {
      score = 1;
      explanation = `Call OI unwinding (${totalCallOIChange.toLocaleString()}). Call writers closing positions = resistance weakening. Mildly bullish.`;
    } else {
      explanation = `OI changes are balanced. Call OI change: ${totalCallOIChange.toLocaleString()}, Put OI change: ${totalPutOIChange.toLocaleString()}. No clear direction from OI flow.`;
    }

    return {
      rule: 'Change in OI',
      score,
      explanation,
      value: `Call OI Δ: ${totalCallOIChange.toLocaleString()} | Put OI Δ: ${totalPutOIChange.toLocaleString()}`
    };
  }

  /**
   * RULE 5: IV Analysis
   * High IV = Options expensive, avoid buying (or wait for IV drop)
   * Low IV = Options cheap, good to buy
   * IV Rank helps determine if current IV is high or low relative to history
   */
  analyzeIV(optionChainData) {
    const records = optionChainData.filtered?.data || [];
    const spotPrice = optionChainData.records?.underlyingValue || 0;

    // Find ATM strike
    let atmStrike = 0;
    let minDiff = Infinity;
    records.forEach(record => {
      const diff = Math.abs(record.strikePrice - spotPrice);
      if (diff < minDiff) {
        minDiff = diff;
        atmStrike = record.strikePrice;
      }
    });

    const atmRecord = records.find(r => r.strikePrice === atmStrike);
    const atmCallIV = atmRecord?.CE?.impliedVolatility || 0;
    const atmPutIV = atmRecord?.PE?.impliedVolatility || 0;
    const avgIV = (atmCallIV + atmPutIV) / 2;

    let score = 0;
    let explanation = '';

    // For Nifty, typical IV range is 10-25. Above 20 is high, below 12 is low
    if (avgIV > 20) {
      score = 0; // Don't add direction, but flag as warning
      explanation = `ATM IV is HIGH (${avgIV.toFixed(1)}%). Options are EXPENSIVE. Even if direction is right, theta decay and IV crush can eat profits. Consider waiting or reduce position size. ⚠️ WARNING: High IV environment.`;
    } else if (avgIV < 12) {
      score = 0; // Good environment to buy
      explanation = `ATM IV is LOW (${avgIV.toFixed(1)}%). Options are CHEAP. Good environment to buy options. If a directional move comes, IV expansion will add to profits.`;
    } else {
      explanation = `ATM IV is NORMAL (${avgIV.toFixed(1)}%). Standard pricing environment. No IV edge or penalty.`;
    }

    // IV Skew: If Put IV >> Call IV, market is hedging = expecting fall
    if (atmCallIV > 0 && atmPutIV > 0) {
      if (atmPutIV > atmCallIV * 1.15) {
        score -= 1;
        explanation += ` IV SKEW: Put IV (${atmPutIV.toFixed(1)}) > Call IV (${atmCallIV.toFixed(1)}). Market paying more for downside protection = bearish undercurrent.`;
      } else if (atmCallIV > atmPutIV * 1.15) {
        score += 1;
        explanation += ` IV SKEW: Call IV (${atmCallIV.toFixed(1)}) > Put IV (${atmPutIV.toFixed(1)}). Market paying more for upside = bullish undercurrent.`;
      }
    }

    return { rule: 'IV Analysis', score, explanation, value: `ATM IV: ${avgIV.toFixed(1)}%` };
  }

  /**
   * RULE 6: VIX Analysis
   * VIX > 20 = High fear, big moves expected, be cautious with position size
   * VIX < 12 = Low fear, range-bound market, option buying is harder
   * VIX rising = Uncertainty increasing, puts become more valuable
   * VIX falling = Confidence returning, calls benefit
   */
  analyzeVIX(vixData) {
    if (!vixData) {
      return { rule: 'VIX Analysis', score: 0, explanation: 'VIX data unavailable.', value: 'N/A' };
    }

    const vixValue = vixData.last || vixData.open || 0;
    const vixChange = vixData.percentChange || 0;

    let score = 0;
    let explanation = '';

    if (vixValue > 20) {
      explanation = `VIX is HIGH at ${vixValue.toFixed(2)}. Market is fearful. ⚠️ Big moves possible but options are expensive. Use strict stop-loss and smaller positions.`;
      if (vixChange > 5) {
        score = -1;
        explanation += ` VIX SPIKING (+${vixChange.toFixed(1)}%) = panic entering. Bearish pressure.`;
      }
    } else if (vixValue < 12) {
      explanation = `VIX is LOW at ${vixValue.toFixed(2)}. Market is complacent. Range-bound expected. Option buying is tough (low movement). Consider only strong setups.`;
    } else {
      explanation = `VIX is NORMAL at ${vixValue.toFixed(2)}. Healthy volatility for option trading.`;
      if (vixChange < -3) {
        score = 1;
        explanation += ` VIX falling (${vixChange.toFixed(1)}%) = fear reducing = bullish for markets.`;
      } else if (vixChange > 3) {
        score = -1;
        explanation += ` VIX rising (+${vixChange.toFixed(1)}%) = uncertainty increasing = bearish pressure.`;
      }
    }

    return { rule: 'VIX Analysis', score, explanation, value: `VIX: ${vixValue.toFixed(2)} (${vixChange > 0 ? '+' : ''}${vixChange.toFixed(1)}%)` };
  }

  /**
   * RULE 7: Volume-OI Divergence
   * High Volume + OI Increase = Fresh positions, move is genuine
   * High Volume + OI Decrease = Positions closing, move may reverse
   * Low Volume + any OI = No conviction, ignore the move
   */
  analyzeVolumeOI(optionChainData) {
    const records = optionChainData.filtered?.data || [];
    const spotPrice = optionChainData.records?.underlyingValue || 0;

    // Focus on strikes near ATM (+-5 strikes)
    const sortedByDist = [...records].sort(
      (a, b) => Math.abs(a.strikePrice - spotPrice) - Math.abs(b.strikePrice - spotPrice)
    );
    const nearATM = sortedByDist.slice(0, 10);

    let totalCallVolume = 0, totalPutVolume = 0;
    let totalCallOIChange = 0, totalPutOIChange = 0;

    nearATM.forEach(record => {
      if (record.CE) {
        totalCallVolume += record.CE.totalTradedVolume || 0;
        totalCallOIChange += record.CE.changeinOpenInterest || 0;
      }
      if (record.PE) {
        totalPutVolume += record.PE.totalTradedVolume || 0;
        totalPutOIChange += record.PE.changeinOpenInterest || 0;
      }
    });

    let score = 0;
    let explanation = '';

    // High put volume with put OI increase = genuine bearish hedge / genuine support
    if (totalPutVolume > totalCallVolume * 1.5 && totalPutOIChange > 0) {
      score = 1;
      explanation = `Near-ATM Put volume (${totalPutVolume.toLocaleString()}) >> Call volume (${totalCallVolume.toLocaleString()}) WITH OI increase. Fresh put writing (selling) = Bullish. They're collecting premium betting market stays up.`;
    } else if (totalCallVolume > totalPutVolume * 1.5 && totalCallOIChange > 0) {
      score = -1;
      explanation = `Near-ATM Call volume (${totalCallVolume.toLocaleString()}) >> Put volume (${totalPutVolume.toLocaleString()}) WITH OI increase. Fresh call writing (selling) = Bearish. They're collecting premium betting market stays down.`;
    } else if (totalPutVolume > totalCallVolume * 1.5 && totalPutOIChange < 0) {
      score = -1;
      explanation = `High put volume but PUT OI DECREASING. Put buyers are closing/booking profits. Support weakening. Mildly bearish.`;
    } else if (totalCallVolume > totalPutVolume * 1.5 && totalCallOIChange < 0) {
      score = 1;
      explanation = `High call volume but CALL OI DECREASING. Call writers are covering/exiting. Resistance weakening. Mildly bullish.`;
    } else {
      explanation = `Volume-OI balanced near ATM. Call Vol: ${totalCallVolume.toLocaleString()}, Put Vol: ${totalPutVolume.toLocaleString()}. No divergence detected.`;
    }

    return { rule: 'Volume-OI Divergence', score, explanation, value: `Call Vol: ${totalCallVolume.toLocaleString()} | Put Vol: ${totalPutVolume.toLocaleString()}` };
  }

  /**
   * RULE 8: Strike Selection Guide (Greeks-based)
   * Delta > 0.5 = ITM options, expensive but high probability
   * Delta 0.3-0.5 = ATM/slightly OTM, best risk-reward
   * Delta < 0.3 = Deep OTM, cheap but low probability (lottery ticket)
   * 
   * For intraday: Pick Delta 0.4-0.6 (ATM to slight ITM)
   * For positional: Pick Delta 0.3-0.5 (slight OTM is fine)
   */
  getStrikeRecommendation(optionChainData, direction, timeframe) {
    const records = optionChainData.filtered?.data || [];
    const spotPrice = optionChainData.records?.underlyingValue || 0;

    let recommendedStrike = 0;
    let explanation = '';

    if (direction === 'BULLISH') {
      // For calls, find ATM or 1 strike OTM
      const calls = records
        .filter(r => r.CE && r.strikePrice >= spotPrice)
        .sort((a, b) => a.strikePrice - b.strikePrice);

      if (timeframe === 'intraday') {
        // ATM call for intraday
        recommendedStrike = calls[0]?.strikePrice || 0;
        explanation = `BUY CE ${recommendedStrike} (ATM). For intraday, ATM gives best delta (~0.5) = ₹1 Nifty move ≈ ₹0.5 option move. Fast reaction to price.`;
      } else {
        // 1 strike OTM for positional
        recommendedStrike = calls[1]?.strikePrice || calls[0]?.strikePrice || 0;
        explanation = `BUY CE ${recommendedStrike} (1 strike OTM). For positional, slightly OTM gives better leverage with acceptable delta (~0.35-0.45).`;
      }
    } else {
      // For puts
      const puts = records
        .filter(r => r.PE && r.strikePrice <= spotPrice)
        .sort((a, b) => b.strikePrice - a.strikePrice);

      if (timeframe === 'intraday') {
        recommendedStrike = puts[0]?.strikePrice || 0;
        explanation = `BUY PE ${recommendedStrike} (ATM). For intraday, ATM gives best delta (~0.5). Quick profit capture on downmoves.`;
      } else {
        recommendedStrike = puts[1]?.strikePrice || puts[0]?.strikePrice || 0;
        explanation = `BUY PE ${recommendedStrike} (1 strike OTM). For positional, slightly OTM gives better leverage.`;
      }
    }

    return { strike: recommendedStrike, explanation };
  }

  /**
   * Master Signal Generator
   * Runs all rules and produces a final signal with full explanation
   */
  generateSignal(optionChainData, vixData, symbol) {
    const results = [];

    // Safety check - ensure we have minimum required data
    if (!optionChainData?.filtered?.data || optionChainData.filtered.data.length === 0) {
      return {
        symbol,
        spotPrice: optionChainData?.records?.underlyingValue || 0,
        signal: 'NO SIGNAL',
        direction: 'NEUTRAL',
        confidence: 'LOW',
        tradeType: '',
        totalScore: 0,
        threshold: this.SIGNAL_THRESHOLD,
        timestamp: new Date().toISOString(),
        ruleResults: [{ rule: 'Data Check', score: 0, explanation: 'Insufficient option chain data. Market may be closed or data unavailable.', value: 'N/A' }],
        strikeRecommendation: { intraday: null, positional: null },
        riskManagement: this.getRiskManagement('NEUTRAL', 0, { filtered: { data: [] } }),
      };
    }

    // Run all rules
    results.push(this.analyzePCR(optionChainData));
    results.push(this.analyzeMaxPain(optionChainData));
    results.push(this.analyzeOISupRes(optionChainData));
    results.push(this.analyzeChangeInOI(optionChainData));
    results.push(this.analyzeIV(optionChainData));
    results.push(this.analyzeVIX(vixData));
    results.push(this.analyzeVolumeOI(optionChainData));

    // Calculate total score
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const spotPrice = optionChainData.records?.underlyingValue || 0;

    // Determine signal
    let signal = 'NO SIGNAL';
    let direction = 'NEUTRAL';
    let confidence = 'LOW';
    let tradeType = '';

    if (totalScore >= this.SIGNAL_THRESHOLD) {
      signal = 'BUY CE (CALL)';
      direction = 'BULLISH';
      if (totalScore >= this.HIGH_CONFIDENCE_THRESHOLD) {
        confidence = 'HIGH';
      } else {
        confidence = 'MEDIUM';
      }
      tradeType = 'Long Call';
    } else if (totalScore <= -this.SIGNAL_THRESHOLD) {
      signal = 'BUY PE (PUT)';
      direction = 'BEARISH';
      if (totalScore <= -this.HIGH_CONFIDENCE_THRESHOLD) {
        confidence = 'HIGH';
      } else {
        confidence = 'MEDIUM';
      }
      tradeType = 'Long Put';
    } else if (totalScore >= 1) {
      signal = 'LEAN BULLISH (No trade - watch)';
      direction = 'NEUTRAL';
      confidence = 'LOW';
      tradeType = '';
    } else if (totalScore <= -1) {
      signal = 'LEAN BEARISH (No trade - watch)';
      direction = 'NEUTRAL';
      confidence = 'LOW';
      tradeType = '';
    }

    // Get strike recommendations
    const intradayRec = direction !== 'NEUTRAL'
      ? this.getStrikeRecommendation(optionChainData, direction, 'intraday')
      : null;
    const positionalRec = direction !== 'NEUTRAL'
      ? this.getStrikeRecommendation(optionChainData, direction, 'positional')
      : null;

    // Risk management
    const riskManagement = this.getRiskManagement(direction, spotPrice, optionChainData);

    return {
      symbol,
      spotPrice,
      signal,
      direction,
      confidence,
      tradeType,
      totalScore,
      threshold: this.SIGNAL_THRESHOLD,
      timestamp: new Date().toISOString(),
      ruleResults: results,
      strikeRecommendation: { intraday: intradayRec, positional: positionalRec },
      riskManagement,
    };
  }

  /**
   * Risk Management Rules
   * Every signal comes with stop-loss and target guidance
   */
  getRiskManagement(direction, spotPrice, optionChainData) {
    const records = optionChainData.filtered?.data || [];

    // Find OI-based support and resistance
    let maxPutOI = 0, maxPutStrike = 0;
    let maxCallOI = 0, maxCallStrike = 0;

    records.forEach(record => {
      if (record.PE && record.PE.openInterest > maxPutOI) {
        maxPutOI = record.PE.openInterest;
        maxPutStrike = record.strikePrice;
      }
      if (record.CE && record.CE.openInterest > maxCallOI) {
        maxCallOI = record.CE.openInterest;
        maxCallStrike = record.strikePrice;
      }
    });

    if (direction === 'BULLISH') {
      return {
        stopLoss: `If spot breaks below ${maxPutStrike} (highest put OI support), EXIT immediately. Option SL: 30% of premium paid.`,
        target: `First target: ${maxCallStrike} (highest call OI resistance). Trail stop-loss once 50% profit is achieved.`,
        positionSize: `Risk max 2% of capital on this trade. If capital is ₹1,00,000, max loss should be ₹2,000.`,
        timeRule: `Intraday: Exit by 3:15 PM regardless. Positional: Hold max 3 days unless target/SL hit.`,
        entryTiming: `Best entry: Wait for a small pullback after signal. Don't chase if already moved 0.5% in direction.`
      };
    } else if (direction === 'BEARISH') {
      return {
        stopLoss: `If spot breaks above ${maxCallStrike} (highest call OI resistance), EXIT immediately. Option SL: 30% of premium paid.`,
        target: `First target: ${maxPutStrike} (highest put OI support). Trail stop-loss once 50% profit is achieved.`,
        positionSize: `Risk max 2% of capital on this trade. If capital is ₹1,00,000, max loss should be ₹2,000.`,
        timeRule: `Intraday: Exit by 3:15 PM regardless. Positional: Hold max 3 days unless target/SL hit.`,
        entryTiming: `Best entry: Wait for a small bounce after signal. Don't chase if already moved 0.5% in direction.`
      };
    }

    return {
      stopLoss: 'No signal - no trade required.',
      target: 'Wait for signal threshold to be met.',
      positionSize: 'N/A',
      timeRule: 'N/A',
      entryTiming: 'N/A'
    };
  }
}

module.exports = new SignalEngine();
