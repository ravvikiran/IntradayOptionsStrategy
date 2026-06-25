# Technical Documentation - Options Signal Engine

## Architecture Overview

The application follows a client-server architecture:

```
[React Frontend] → [Express API Server] → [NSE India API]
                                         → [Signal Engine (Scoring)]
                                         → [Learning Content (Static)]
```

## How the Signal Engine Works

### Core Philosophy
The signal engine uses a **weighted scoring system** where each rule independently analyzes one aspect of the options market. A signal only fires when multiple rules agree (confluence-based approach).

### Scoring Mechanism

| Rule | Max Score | What it Measures |
|------|-----------|-----------------|
| PCR Analysis | ±2 | Overall market sentiment from option writers |
| Max Pain | ±1 | Where market makers want price at expiry |
| OI Support/Resistance | ±2 | Where institutional money is defending levels |
| Change in OI | ±2 | Who is entering/exiting positions right now |
| IV Analysis | ±1 | Are options cheap or expensive + IV skew |
| VIX Analysis | ±1 | Should you trade at all today |
| Volume-OI Divergence | ±1 | Is the current move genuine or a trap |

**Total possible score: ±10**
**Signal threshold: ±5**

This means at minimum 3 strong rules or 5 moderate rules must agree for a signal to trigger.

### Signal Output

Every signal includes:
1. **Direction**: BULLISH (BUY CE) / BEARISH (BUY PE) / NEUTRAL (no trade)
2. **Confidence**: HIGH (score ≥7) / MEDIUM (score 5-6)
3. **Rule breakdown**: Each rule's individual score and plain-English explanation
4. **Strike recommendation**: Specific strikes for intraday and positional
5. **Risk management**: Stop-loss, target, position size, time rules

## Rule Details

### Rule 1: PCR (Put-Call Ratio) Analysis

**What**: Ratio of total Put OI to total Call OI across all strikes.

**Logic**:
- PCR > 1.3 → Score +2 (Bullish). Heavy put writing means institutions believe market won't fall.
- PCR < 0.7 → Score -2 (Bearish). Heavy call writing means institutions believe market won't rise.
- PCR 0.7-1.3 → Score 0 (Neutral).

**Why it works**: Option writers (sellers) are institutional players with large capital. They sell options when they're confident about direction. PCR extreme readings reflect their aggregate confidence.

**Limitation**: PCR can stay extreme for days during trending markets. It's not a timing tool alone.

---

### Rule 2: Max Pain Analysis

**What**: The strike price where maximum option buyers (both call and put) lose money.

**Logic**:
- Spot significantly above max pain (>0.3%) → Score -1 (Bearish pull down)
- Spot significantly below max pain (>0.3%) → Score +1 (Bullish pull up)
- Spot near max pain → Score 0 (Equilibrium)

**Why it works**: Option writers profit when buyers lose. The aggregate financial incentive across all writers is to push price toward max pain. This effect is strongest on expiry day.

**Limitation**: Fails on trending days, high VIX days, or when FII cash market activity overwhelms option positioning.

---

### Rule 3: OI-Based Support & Resistance

**What**: Highest Put OI strike = Support. Highest Call OI strike = Resistance.

**Logic**:
- Spot at/near Put support → Score +2 (Bounce expected)
- Spot at/near Call resistance → Score -2 (Rejection expected)
- Spot in lower half of range → Score +1 (Leaning bullish)
- Spot in upper half of range → Score -1 (Leaning bearish)

**Why it works**: When institutions write options at a strike, they have margin blocked and financial incentive to defend that level. They'll actively buy/sell the underlying to prevent their written options from going ITM.

**Limitation**: Support/resistance can shift if writers decide to cut losses (OI unwinding). That's why Rule 4 exists.

---

### Rule 4: Change in OI Analysis

**What**: Whether new positions are being created or existing ones are closing.

**Logic**:
- Put OI increasing > Call OI increasing → Score +2 (Fresh put writing = bullish)
- Call OI increasing > Put OI increasing → Score -2 (Fresh call writing = bearish)
- Put OI unwinding → Score -1 (Support weakening)
- Call OI unwinding → Score +1 (Resistance weakening)

**Why it works**: This is the REAL-TIME flow of money. Static OI tells you where money WAS positioned. Change in OI tells you what's happening RIGHT NOW.

**Limitation**: Early morning OI changes (9:15-9:45) can be noisy due to position adjustments. Best after 10:00 AM.

---

### Rule 5: IV (Implied Volatility) Analysis

**What**: How expensive are options right now? Is there an IV skew?

**Logic**:
- High IV (>20%) → Score 0 but WARNING flag (don't buy expensive options)
- Low IV (<12%) → Score 0 but FAVORABLE flag (cheap options = good to buy)
- Put IV >> Call IV → Score -1 (Market hedging downside)
- Call IV >> Put IV → Score +1 (Market chasing upside)

**Why it works**: IV determines option pricing independent of direction. High IV means you overpay and can lose money even when direction is right (IV crush). The skew component reveals hidden demand for one side.

**Limitation**: IV analysis doesn't give direction by itself. It's a filter (should I trade?) and a supporting indicator (skew).

---

### Rule 6: VIX Analysis

**What**: India VIX - the overall market fear/greed gauge.

**Logic**:
- VIX > 20 + rising sharply → Score -1 (Panic = bearish)
- VIX falling > 3% → Score +1 (Fear reducing = bullish)
- VIX rising > 3% → Score -1 (Uncertainty increasing)
- Otherwise → Score 0

**Why it works**: VIX reflects the aggregate option pricing across the market. Rising VIX means institutions are buying protection (puts), which is bearish. Falling VIX means they're selling protection (confidence).

**Limitation**: VIX direction matters more than absolute level for scoring. Very high VIX is more of a "trade small or don't trade" signal than a directional one.

---

### Rule 7: Volume-OI Divergence

**What**: Is the current activity creating new positions or closing old ones?

**Logic**:
- High put volume + put OI rising → Score +1 (Fresh put writing = bullish)
- High call volume + call OI rising → Score -1 (Fresh call writing = bearish)
- High put volume + put OI falling → Score -1 (Put unwinding = support breaking)
- High call volume + call OI falling → Score +1 (Call covering = resistance breaking)

**Why it works**: Volume without OI increase means churning (no new commitment). Volume WITH OI increase means fresh money entering with conviction.

**Limitation**: Needs sufficient volume to be meaningful. Pre-market and post-3 PM data is unreliable.

## API Reference

### NSE Data Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nse/option-chain/:symbol` | GET | Raw option chain from NSE |
| `/api/nse/vix` | GET | India VIX current value |
| `/api/nse/index/:symbol` | GET | Index data (NIFTY 50, BANK NIFTY) |
| `/api/nse/market-status` | GET | Whether market is open/closed |

### Signal Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/signals/generate/:symbol` | GET | Generate signal for one symbol |
| `/api/signals/scan` | GET | Generate signals for all tracked symbols |

### Learning Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/learning/modules` | GET | List all learning modules |
| `/api/learning/modules/:id` | GET | Get specific module content |
| `/api/learning/rules` | GET | Get trading rules/checklist |

## NSE Data Handling

### Cookie Management
NSE blocks direct API calls. The service:
1. Hits `nseindia.com` main page to get session cookies
2. Uses those cookies for subsequent API calls
3. Refreshes cookies every 5 minutes

### Rate Limiting
- Minimum 1 second between requests to same endpoint
- Cookie refresh limited to once per 5 minutes
- Frontend shows loading state to prevent rapid-fire requests

### Error Handling
- Network errors return 500 with descriptive message
- NSE downtime (weekends, holidays) returns appropriate error
- Stale cookie errors trigger automatic refresh

## Frontend Architecture

### Pages
1. **Dashboard** - Symbol selector + signal display
2. **Learning** - Grid of learning modules
3. **LearningModule** - Individual module content
4. **Rules** - Trading rules checklist

### State Management
Simple React state (useState/useEffect). No Redux needed for this scale.

### Styling
Single CSS file with dark theme. No external UI library - keeps bundle small and loads fast.

## Deployment Notes

### Local Development
- Backend on port 5000
- Frontend on port 3000 with proxy to 5000
- Hot reload on frontend, manual restart on backend

### Production
- Run `npm run build` in client/ to create static build
- Backend serves static files from client/build/
- Single port (5000) serves everything

## Limitations & Disclaimers

1. **Data Delay**: NSE free API data is delayed by 3-5 minutes
2. **Market Hours Only**: Data is only meaningful during 9:15 AM - 3:30 PM IST
3. **No Historical Data**: Signals are point-in-time; no backtesting capability
4. **Not Financial Advice**: This is an educational tool. Trade at your own risk.
5. **NSE API Changes**: NSE may change API structure without notice. If data stops loading, the API format may need updating.
