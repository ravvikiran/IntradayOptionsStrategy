/**
 * Learning Content Module
 * Complete educational material for understanding options signals
 */

const learningContent = [
  {
    id: 'basics',
    title: 'Options Basics - What You Need to Know',
    description: 'Foundation concepts before trading options',
    difficulty: 'Beginner',
    order: 1,
    content: {
      sections: [
        {
          title: 'What is an Option?',
          body: `An option is a CONTRACT that gives you the RIGHT (not obligation) to buy or sell an underlying asset at a specific price before a specific date.

CE (Call Option) = Right to BUY. You buy CE when you think market will GO UP.
PE (Put Option) = Right to SELL. You buy PE when you think market will GO DOWN.

Example: Nifty is at 22,000. You buy Nifty 22,000 CE for ₹150.
- If Nifty goes to 22,200, your CE might be worth ₹300 (100% profit)
- If Nifty falls to 21,800, your CE might be worth ₹50 (66% loss)

KEY POINT: In options, you can lose 100% of what you paid (premium), but your loss is LIMITED to that amount.`
        },
        {
          title: 'Why Technical Analysis Alone Fails in Options',
          body: `You mentioned you know support/resistance/EMAs. Here's why that's not enough for options:

1. TIME DECAY (Theta): Unlike stocks, options LOSE value every day just by existing. Even if Nifty stays flat at your predicted level, your option loses money.

2. IV CRUSH: Before events (RBI policy, earnings, elections), options become expensive. After the event, they crash in value EVEN if price moves in your direction.

3. WRONG STRIKE SELECTION: Buying deep OTM options because they're "cheap" is the #1 retail mistake. They need massive moves to profit.

4. OPTIONS HAVE THEIR OWN SUPPLY-DEMAND: Big players (FIIs, institutions) write (sell) options. Where they position tells you the REAL expected range.

SOLUTION: This app combines technical levels with OPTIONS-SPECIFIC data (OI, IV, PCR) to give you an edge that chart patterns alone cannot provide.`
        },
        {
          title: 'How This App Generates Signals',
          body: `The signal engine uses a SCORING SYSTEM:

Each rule analyzes one aspect of the options market and gives a score:
- Positive score = Bullish evidence
- Negative score = Bearish evidence
- Zero = Neutral/no opinion

SIGNAL TRIGGERS when total score crosses ±3:
- Score ≥ +3 → BUY CE (CALL) signal
- Score ≤ -3 → BUY PE (PUT) signal
- Score between -3 and +3 → NO SIGNAL (stay out)

WHY ±3? This means at least 2 strong rules must agree. Single-rule signals are unreliable. We want CONFLUENCE - multiple independent indicators pointing the same direction.

CONFIDENCE LEVELS:
- Score ±3 to ±4 = MEDIUM confidence (trade with smaller size)
- Score ±5 or more = HIGH confidence (full position size allowed)`
        },
        {
          title: '📘 WORKED EXAMPLE: Reading a Signal',
          body: `Let's say the app generates this signal for NIFTY at 11:00 AM:

┌─────────────────────────────────────────────┐
│ NIFTY 24,000 | BUY CE (CALL) | Score: +5   │
├─────────────────────────────────────────────┤
│ PCR Analysis:          +2 (PCR = 1.4)       │
│ OI Support/Resistance: +2 (At put support)  │
│ Change in OI:          +2 (Put OI rising)   │
│ Max Pain:              +1 (Below max pain)  │
│ IV Analysis:            0 (Normal IV)       │
│ VIX Analysis:          -1 (VIX rising)      │
│ Volume-OI Divergence:  -1 (Mixed)           │
└─────────────────────────────────────────────┘

HOW TO READ THIS:
• Total score = +2+2+2+1+0-1-1 = +5 → Crosses threshold (+3) → Signal fires
• 4 rules are bullish, 2 rules are bearish, 1 neutral
• Confidence: HIGH (score ≥ 5)

WHAT TO DO:
1. Check pre-trade checklist (VIX <20? ✅ No event? ✅)
2. Buy NIFTY 24,000 CE or 24,050 CE (ATM)
3. Set SL: 30% of premium paid (or if Nifty breaks below 23,900)
4. Target: 24,200 (next call OI resistance)
5. Exit by 3:15 PM if intraday

WHAT ABOUT THE BEARISH RULES (-1, -1)?
They exist but are outnumbered. The engine accepts that not ALL rules will agree. That's normal. The threshold ensures enough agreement exists.`
        }
      ]
    }
  },
  {
    id: 'pcr-analysis',
    title: 'PCR (Put-Call Ratio) - Market Sentiment Gauge',
    description: 'How to read what the market is collectively thinking',
    difficulty: 'Beginner',
    order: 2,
    content: {
      sections: [
        {
          title: 'What is PCR?',
          body: `PCR = Total Put Open Interest / Total Call Open Interest

It tells you the RATIO of bearish bets to bullish bets in the market.

PCR > 1.0 = More puts than calls = More people are bearish
PCR < 1.0 = More calls than puts = More people are bullish

BUT HERE'S THE TWIST (what most retailers miss):
Options WRITERS (sellers) are the smart money. When PCR is very high (>1.3), it means heavy PUT WRITING. Writers sell puts when they believe market WON'T fall. So HIGH PCR = BULLISH.

Similarly, very low PCR (<0.7) means heavy CALL WRITING = writers believe market WON'T rise = BEARISH.`
        },
        {
          title: 'PCR Ranges for Indian Market',
          body: `For NIFTY:
- PCR < 0.7 → Overbought zone, expect correction (BEARISH)
- PCR 0.7 - 0.95 → Mildly bearish or neutral
- PCR 0.95 - 1.05 → Perfectly balanced (NO TRADE zone)
- PCR 1.05 - 1.3 → Mildly bullish or neutral
- PCR > 1.3 → Oversold zone, expect bounce (BULLISH)

IMPORTANT: PCR alone is not a signal. It's one input to the scoring system. A high PCR with other bearish signals means the market might break down despite put writers' confidence.`
        },
        {
          title: 'How Signal Engine Uses PCR',
          body: `Score allocation:
- PCR > 1.3 → +2 (Strong bullish evidence)
- PCR < 0.7 → -2 (Strong bearish evidence)
- PCR 0.7-1.3 → 0 (No score, neutral)

The engine checks PCR across all strikes. A sudden shift in PCR during the day (from 1.2 to 0.8) is a powerful reversal signal, as it means put writers are closing and call writers are entering.`
        },
        {
          title: '📘 WORKED EXAMPLE: PCR Shift',
          body: `SCENARIO: Thursday (expiry day), 10:30 AM

NIFTY at 23,500. You check the signal app:
• PCR at 9:30 AM: 1.35 (heavily put-written = bullish)
• PCR at 10:30 AM: 0.85 (shifted to neutral/bearish)

WHAT HAPPENED?
Put writers who had sold puts at 23,400 and 23,500 are CLOSING their positions (buying back puts). Simultaneously, new call writers are entering at 23,600 and 23,700.

┌──────────────────────────────────────┐
│  PCR Timeline on Expiry Day          │
│                                      │
│  9:15 AM  ████████████ 1.35 Bullish  │
│  9:45 AM  █████████░░░ 1.20 Bullish  │
│  10:15 AM ██████░░░░░░ 1.00 Neutral  │
│  10:30 AM ████░░░░░░░░ 0.85 Bearish  │
│           ↑ SHIFT! Writers flipping  │
└──────────────────────────────────────┘

SIGNAL INTERPRETATION:
• PCR dropping from 1.35 → 0.85 = put writers are SCARED
• They no longer believe 23,500 will hold as support
• Call writers entering = they believe upside is capped
• Combined = BEARISH shift

TRADE: BUY PE 23,500 at ~₹120
RESULT (hypothetical): Nifty fell to 23,350 by 2 PM. PE went to ₹200. Profit: 66%

NOTE: PCR alone didn't trigger this signal. The engine would also check OI unwinding (Rule 4), Volume-OI divergence (Rule 7), etc. The score from PCR (-2) plus other confirming rules pushed total past threshold.`
        }
      ]
    }
  },
  {
    id: 'oi-analysis',
    title: 'Open Interest - Where Big Money is Positioned',
    description: 'Reading institutional positioning through OI data',
    difficulty: 'Intermediate',
    order: 3,
    content: {
      sections: [
        {
          title: 'What is Open Interest?',
          body: `Open Interest (OI) = Total number of ACTIVE option contracts that haven't been closed.

Think of it as "how many bets are currently alive at each strike price."

Example: Nifty 22,000 CE has OI of 1 crore.
This means 1 crore contracts are currently active at this strike. Some people bought these calls, and some people SOLD (wrote) these calls.

KEY INSIGHT: The SELLERS of these 1 crore contracts at 22,000 CE are mostly institutions. They have sold these calls because they believe Nifty WON'T cross 22,000. This makes 22,000 a RESISTANCE LEVEL as per options data.

Similarly, if 22,000 PE has high OI, institutions have sold puts = they believe Nifty WON'T fall below 22,000 = SUPPORT LEVEL.`
        },
        {
          title: 'How to Read OI for Direction',
          body: `CHANGE IN OI is more important than absolute OI:

1. OI INCREASES at a Call strike → Fresh call writing → BEARISH for that level
2. OI INCREASES at a Put strike → Fresh put writing → BULLISH for that level
3. OI DECREASES at a Call strike → Call writers covering → Resistance weakening → BULLISH
4. OI DECREASES at a Put strike → Put writers covering → Support weakening → BEARISH

REAL EXAMPLE:
If Nifty is at 22,000 and you see:
- 22,200 CE OI jumping from 50L to 80L → Writers adding at 22,200 = strong resistance
- 21,800 PE OI jumping from 40L to 70L → Writers adding at 21,800 = strong support
- Expected range: 21,800 - 22,200

If 22,200 CE OI suddenly drops from 80L to 50L → Writers are SCARED, covering their calls → 22,200 resistance may break → BULLISH BREAKOUT possible.`
        },
        {
          title: 'OI-Based Support & Resistance vs Chart-Based',
          body: `Chart-based S/R: Based on historical price action. Backward-looking.
OI-based S/R: Based on CURRENT money positioning. Forward-looking.

For options trading, OI-based levels are MORE relevant because:
1. They update in real-time as money flows in/out
2. They represent actual financial commitment (writers have margin blocked)
3. Writers actively defend these levels (they lose money if broken)

The signal engine identifies:
- Highest PUT OI strike = Strongest support
- Highest CALL OI strike = Strongest resistance
- Position of spot relative to these = Directional bias`
        },
        {
          title: '📘 WORKED EXAMPLE: OI Levels in Action',
          body: `SCENARIO: Wednesday, 11:00 AM. NIFTY at 24,050.

Option Chain Data (simplified):
┌──────────┬──────────────┬──────────────┐
│ Strike   │ Call OI (Lk) │ Put OI (Lk)  │
├──────────┼──────────────┼──────────────┤
│ 23,800   │    45        │    120 ★★    │
│ 23,900   │    60        │    95        │
│ 24,000   │    80        │    150 ★★★  │ ← Highest Put OI = SUPPORT
│ 24,100   │    110       │    70        │
│ 24,200   │    180 ★★★  │    40        │ ← Highest Call OI = RESISTANCE
│ 24,300   │    95        │    25        │
└──────────┴──────────────┴──────────────┘

READING THIS:
• Support = 24,000 (Put OI: 1.5 crore contracts sold here)
  → Writers collected premium betting Nifty WON'T fall below 24,000
  → They have ₹100s of crores in margin blocked to defend this

• Resistance = 24,200 (Call OI: 1.8 crore contracts sold here)
  → Writers collected premium betting Nifty WON'T cross 24,200
  → They will sell Nifty futures if it approaches 24,200 to push it down

• Spot (24,050) is in LOWER HALF of range (24,000 to 24,200)
  → Score: +1 (closer to support = mild bullish lean)

NEXT DAY (Thursday):
If you see 24,000 Put OI DROP from 150L to 80L → Put writers are EXITING
→ They no longer believe 24,000 will hold
→ Support is BREAKING
→ Score for this rule flips from +1 to -1 or -2
→ Expect fall below 24,000

THIS is why Change in OI (Rule 4) works alongside OI S/R (Rule 3).`
        }
      ]
    }
  },
  {
    id: 'iv-analysis',
    title: 'Implied Volatility - The Hidden Cost of Options',
    description: 'Why you can be right about direction and still lose money',
    difficulty: 'Intermediate',
    order: 4,
    content: {
      sections: [
        {
          title: 'What is Implied Volatility (IV)?',
          body: `IV represents the market's EXPECTATION of how much price will move. It's baked into option prices.

Higher IV = Higher option premium = More expensive to buy
Lower IV = Lower option premium = Cheaper to buy

Think of it like insurance pricing: Before a storm (event), insurance is expensive. After the storm passes, it becomes cheap again.

Same with options: Before RBI policy, budget, elections, or earnings, IV rises (options become expensive). After the event, IV drops sharply (IV CRUSH) and options lose value.`
        },
        {
          title: 'IV Crush - The #1 Retail Killer',
          body: `SCENARIO (happens to most beginners):
- Budget day is tomorrow
- You think Nifty will go up, buy 22,000 CE at ₹200 (high because of event IV)
- Budget happens, Nifty moves up 100 points
- You check your option... it's at ₹180 (LOSS!)

WHY? The IV dropped from 18% to 12% after the event. The 100-point move helped, but the IV crash hurt MORE.

RULE: Never buy options just before major events unless you're buying both CE + PE (straddle). The IV crush will likely eat your gains.

The signal engine WARNS you when IV is high (>20%) by flagging it. It doesn't add directional score from IV, but it gives you a WARNING to reduce position size or avoid the trade entirely.`
        },
        {
          title: 'IV Skew - Hidden Directional Clue',
          body: `IV SKEW means Put IV and Call IV are different at the same distance from spot.

If Put IV > Call IV by significant margin:
→ Market is paying MORE for downside protection
→ Smart money is hedging against a fall
→ BEARISH undercurrent

If Call IV > Put IV by significant margin:
→ Market is paying MORE for upside participation
→ Demand for calls is high
→ BULLISH undercurrent

The signal engine checks: If ATM Put IV > ATM Call IV by >15%, it adds -1 (bearish). Vice versa for bullish. This is a subtle but powerful signal that most retail traders completely ignore.`
        },
        {
          title: '📘 WORKED EXAMPLE: IV Crush Loss',
          body: `SCENARIO: RBI Policy Day (Tuesday)

BEFORE RBI ANNOUNCEMENT (Monday 3:30 PM):
• Nifty: 23,800
• ATM IV (23,800 CE): 22% (normally 12-14%)
• 23,800 CE price: ₹280 (inflated due to high IV)

YOU BUY: 23,800 CE at ₹280, thinking "RBI will cut rates = bullish"

AFTER RBI ANNOUNCEMENT (Tuesday 10:30 AM):
• RBI cuts rates (you were RIGHT about direction!)
• Nifty moves UP to 23,900 (+100 points in your favor)
• ATM IV drops from 22% → 13% (IV CRUSH after event)
• Your 23,800 CE is now worth... ₹240 (LOSS of ₹40!)

┌─────────────────────────────────────────────┐
│  Your P&L Breakdown:                        │
│                                             │
│  Gain from direction (100pt move):  +₹60    │
│  Loss from IV crush (22%→13%):     -₹100    │
│  Net P&L:                          -₹40     │
│                                             │
│  You were RIGHT on direction.               │
│  You still LOST money.                      │
│  This is IV crush.                          │
└─────────────────────────────────────────────┘

HOW THE ENGINE PROTECTS YOU:
When IV > 20%, the engine flags: "⚠️ HIGH IV environment"
It doesn't add directional score but WARNS you.
The pre-trade checklist says: "If IV warning present, reduce size or skip."

CORRECT APPROACH:
• Don't buy options before RBI/Budget/Election
• Wait for IV to normalize AFTER the event
• Enter the next day when IV is back to 12-14%
• Or use spreads (buy + sell) to neutralize IV risk`
        }
      ]
    }
  },
  {
    id: 'max-pain',
    title: 'Max Pain Theory - Where Market Makers Want Price',
    description: 'Understanding the financial incentive that moves expiry-day prices',
    difficulty: 'Intermediate',
    order: 5,
    content: {
      sections: [
        {
          title: 'What is Max Pain?',
          body: `Max Pain is the strike price at which the MAXIMUM number of option BUYERS lose money (both call and put buyers).

Since option WRITERS (mostly institutions) profit when buyers lose, there's a financial incentive to push price toward Max Pain at expiry.

Calculation: For each strike, calculate total loss of all CE buyers + all PE buyers if price expires there. The strike with maximum total loss = Max Pain.

DOES IT ALWAYS WORK? No. But on weekly expiry days (especially last 2 hours), price gravitates toward Max Pain with ~70% accuracy for Nifty.`
        },
        {
          title: 'How to Use Max Pain',
          body: `EXPIRY DAY STRATEGY:
- If spot is significantly ABOVE max pain → Expect pullback toward max pain → BEARISH
- If spot is significantly BELOW max pain → Expect recovery toward max pain → BULLISH
- If spot is near max pain → Range-bound, theta decay benefits writers

"Significantly" means > 0.3% away from max pain for Nifty.

NON-EXPIRY DAYS:
Max Pain is less relevant on Monday/Tuesday of the week. It becomes increasingly relevant from Wednesday onward as expiry approaches (Thursday for weekly).

The signal engine gives ±1 score for max pain. It's a supporting indicator, not a primary one. But on expiry days, this single indicator can be very accurate.`
        },
        {
          title: 'Limitations of Max Pain',
          body: `Max Pain FAILS when:
1. Strong trending day (FII buying/selling heavily)
2. Global events (US market crash, war, etc.)
3. Very high VIX days (>20) - market moves too fast for max pain gravity

NEVER trade max pain alone. Use it as confirmation with other signals. The scoring system ensures max pain is just one voice in the chorus.`
        },
        {
          title: '📘 WORKED EXAMPLE: Max Pain on Expiry Day',
          body: `SCENARIO: Thursday (Weekly Expiry), 12:00 PM

• Nifty spot: 24,250
• Max Pain (calculated from OI): 24,100
• Spot is 150 points ABOVE max pain (0.62% above)

┌─────────────────────────────────────────────┐
│  Max Pain Visualization                     │
│                                             │
│  23,900  24,000  24,100  24,200  24,250     │
│    │       │      ▲│       │       ●        │
│    │       │  Max Pain     │    Spot Price   │
│    │       │       │       │       │        │
│    ←─── If spot was here, option buyers     │
│          lose MAXIMUM money                 │
│                                             │
│  Spot is 150pts above → Bearish pull ↓      │
│  Score: -1 (spot > max pain by > 0.3%)      │
└─────────────────────────────────────────────┘

WHY THIS WORKS:
• At 24,100, Call buyers with strikes 24,200+ lose (calls expire worthless)
• At 24,100, Put buyers with strikes 24,000- lose (puts expire worthless)
• Market makers who SOLD these options WANT price at 24,100
• They will actively sell Nifty to push it from 24,250 → 24,100

RESULT (hypothetical):
• 12:00 PM: Nifty at 24,250
• 1:30 PM: Nifty at 24,180 (pullback started)
• 3:15 PM: Nifty at 24,120 (gravitating toward max pain)
• 3:30 PM: Expiry at 24,110 (within 10pts of max pain!)

IMPORTANT: This was ONE rule adding -1 to the score. The engine only takes a trade if 2+ other rules also agree (bearish OI, bearish PCR, etc.). Max pain alone = watch, don't trade.`
        }
      ]
    }
  },
  {
    id: 'vix-analysis',
    title: 'India VIX - The Fear Gauge',
    description: 'Should you even trade today? VIX tells you.',
    difficulty: 'Beginner',
    order: 6,
    content: {
      sections: [
        {
          title: 'What is India VIX?',
          body: `VIX (Volatility Index) measures the market's EXPECTATION of volatility over next 30 days.

High VIX = Market expects BIG moves (fear/uncertainty)
Low VIX = Market expects SMALL moves (complacency)

For option BUYERS, VIX matters because:
- High VIX = Options are expensive (IV is high everywhere)
- Low VIX = Options are cheap (low IV)

COUNTER-INTUITIVE RULE:
- VIX rising = BAD for option buyers (you pay more, and if VIX drops later, your option loses value)
- VIX falling = GOOD for existing positions (but new entries get cheaper premiums)
- VIX stable at moderate level (13-17) = BEST environment for option buying`
        },
        {
          title: 'VIX Levels for Indian Market',
          body: `VIX < 12: Ultra-low volatility. Market barely moves. Option buying is TOUGH because you need big moves to profit. Avoid buying far OTM options.

VIX 12-17: Sweet spot. Normal volatility. Good for directional bets. Best risk-reward for option buyers.

VIX 17-20: Elevated. Market is nervous. Options are getting expensive. Be selective, use tight stop-losses.

VIX > 20: High fear. Big moves happen but options are VERY expensive. Only trade if signal is HIGH confidence. Reduce position size by 50%.

VIX > 25: Extreme fear (elections, crisis). Do NOT buy options unless you're very experienced. Even ATM options cost 2-3x normal premium.`
        },
        {
          title: 'VIX Direction Matters',
          body: `VIX DIRECTION tells you about momentum:

VIX falling sharply (>3% in a day) → Fear is reducing → BULLISH for Nifty (score +1)
VIX rising sharply (>3% in a day) → Fear is increasing → BEARISH for Nifty (score -1)
VIX stable → No volatility edge

PRO TIP: If Nifty is falling but VIX is NOT rising → The fall is likely a small pullback, not a crash. Smart money isn't scared.
If Nifty is rising but VIX is ALSO rising → Something unusual. Smart money is hedging despite rally. Be cautious.`
        },
        {
          title: '📘 WORKED EXAMPLE: VIX Divergence',
          body: `SCENARIO A - Normal Correlation:
• Nifty falls 200 points (1%)
• VIX rises from 13 to 16 (+23%)
• Interpretation: Fall is genuine, fear is entering. Stay bearish.

SCENARIO B - Divergence (Bullish):
• Nifty falls 150 points (0.7%)
• VIX rises from 13 to 13.5 (+3.8%)
• Interpretation: Market fell but smart money ISN'T scared.
  They're not buying puts aggressively. This is likely a pullback,
  not a crash. Look for buying opportunity.

┌─────────────────────────────────────────────┐
│  VIX vs Nifty - What to Look For            │
│                                             │
│  Nifty ↓ + VIX ↑↑↑  = Real fall. Stay out. │
│  Nifty ↓ + VIX →    = Pullback. Buy dips.  │
│  Nifty ↑ + VIX ↓↓↓  = Healthy rally. Join. │
│  Nifty ↑ + VIX ↑↑   = Suspicious. Caution. │
└─────────────────────────────────────────────┘

SCENARIO C - VIX Spike (Real-world example):
• Date: Election result day
• VIX at open: 14
• VIX at 10 AM: 25 (+78%!)
• Nifty: Gap up 500 points

WHAT TO DO: NOTHING. VIX at 25 means:
• Options are 3x expensive
• Even buying ATM CE at ₹400 (normally ₹150)
• If VIX normalizes to 15 tomorrow, your ₹400 CE becomes ₹200
  even if Nifty stays at same level (IV crush)

The engine would say: "⚠️ VIX HIGH. Reduce position size."
Best action: WAIT for VIX to drop below 18, then enter.`
        }
      ]
    }
  },
  {
    id: 'volume-oi',
    title: 'Volume-OI Divergence - Is the Move Real?',
    description: 'Distinguishing genuine moves from traps',
    difficulty: 'Advanced',
    order: 7,
    content: {
      sections: [
        {
          title: 'Volume vs OI - The Difference',
          body: `VOLUME = Number of contracts TRADED today (includes opening and closing)
OPEN INTEREST = Number of contracts currently ACTIVE (only new positions)

A trade can happen two ways:
1. NEW position created → Both volume AND OI increase
2. EXISTING position closed → Volume increases but OI DECREASES

This distinction is CRITICAL:
- High volume + OI increase = FRESH MONEY entering = Move is genuine
- High volume + OI decrease = MONEY EXITING = Move may reverse

Example: 22,000 CE volume is 10 lakh today.
- If OI also increased by 8 lakh → 80% is fresh buying/writing → Genuine activity
- If OI decreased by 5 lakh → People are EXITING, not entering → Don't trust the move`
        },
        {
          title: 'How to Read the Signals',
          body: `BULLISH signals from Volume-OI:
1. PUT volume high + PUT OI increasing → Fresh put WRITING → Writers selling puts = Bullish
2. CALL volume high + CALL OI decreasing → Call writers COVERING → Resistance breaking = Bullish

BEARISH signals from Volume-OI:
1. CALL volume high + CALL OI increasing → Fresh call WRITING → Writers selling calls = Bearish
2. PUT volume high + PUT OI decreasing → Put writers COVERING → Support breaking = Bearish

TRAPS (no signal):
- High volume + flat OI → Intraday traders churning, no directional commitment
- Low volume + any OI change → Thin market, unreliable moves`
        },
        {
          title: 'Practical Application',
          body: `The signal engine focuses on strikes NEAR ATM (within 5 strikes each side) because:
1. That's where institutional activity is concentrated
2. Far OTM volume is often retail speculation (noise)
3. ATM volume-OI divergence is the earliest signal of a real move

TIMING: This signal is most powerful between 10:00 AM - 11:30 AM. Early morning (9:15-10:00) has opening noise. After 2:00 PM, expiry-day effects dominate.`
        },
        {
          title: '📘 WORKED EXAMPLE: Spotting a Fake Move',
          body: `SCENARIO: Tuesday, 10:45 AM. Nifty suddenly drops 80 points in 15 minutes.

You see: Nifty at 23,920 (was 24,000 at 10:30 AM)

Panicking traders might BUY PE thinking "crash is coming!"
But what does Volume-OI tell us?

Near-ATM data:
┌──────────┬─────────┬─────────┬──────────┬──────────┐
│ Strike   │ CE Vol  │ CE OI Δ │ PE Vol   │ PE OI Δ  │
├──────────┼─────────┼─────────┼──────────┼──────────┤
│ 23,900   │ 2.5L    │ +0.8L   │ 4.2L     │ -1.5L    │
│ 23,950   │ 1.8L    │ +0.5L   │ 3.8L     │ -2.0L    │
│ 24,000   │ 3.0L    │ +1.2L   │ 5.0L     │ -3.0L    │
│ 24,050   │ 1.5L    │ +0.3L   │ 2.0L     │ -0.8L    │
└──────────┴─────────┴─────────┴──────────┴──────────┘

READING THIS:
• Put Volume is HIGH (lots of trading in puts) ✓
• But Put OI is DECREASING (−1.5L, −2.0L, −3.0L)
• This means: Put holders are CLOSING positions, not opening new ones!

INTERPRETATION:
High put volume + OI decrease = PUT UNWINDING
→ People who sold puts earlier are buying them back (taking profits)
→ This is NOT fresh bearish activity
→ The 80-point drop is likely SHORT COVERING / profit booking
→ Score: -1 (support weakening, mildly bearish but NOT a crash signal)

TRAP AVOIDED:
If you had bought PE at 23,900 for ₹180 thinking "crash!"...
Nifty bounced back to 23,980 by 12:30 PM.
Your PE would be at ₹120. Loss: 33%.

The Volume-OI divergence rule PREVENTED this by showing the move wasn't backed by fresh conviction.`
        }
      ]
    }
  },
  {
    id: 'trading-rules',
    title: 'Trading Rules & Checklist',
    description: 'The complete set of rules the signal engine follows',
    difficulty: 'All Levels',
    order: 8,
    content: {
      sections: [
        {
          title: 'Pre-Trade Checklist (MUST check before every trade)',
          body: `Before taking any signal, verify:

✅ 1. Market is open (9:15 AM - 3:30 PM IST)
✅ 2. VIX is below 20 (if above, reduce size by 50%)
✅ 3. No major event in next 2 hours (RBI, budget, earnings)
✅ 4. Signal confidence is MEDIUM or HIGH (score ≥ 3)
✅ 5. At least 2 rules are agreeing in the same direction
✅ 6. IV is not abnormally high (check IV warning in signal)
✅ 7. You have clear stop-loss level BEFORE entering
✅ 8. Position size is within 2% risk rule

If ANY of these fail → DO NOT TRADE. Wait for next signal.`
        },
        {
          title: 'Entry Rules',
          body: `WHEN to enter:
- Best window: 10:00 AM - 11:30 AM (institutional activity settles)
- Second window: 2:00 PM - 2:30 PM (afternoon session)
- AVOID: 9:15-9:45 AM (opening volatility, gap adjustments)
- AVOID: 3:00-3:30 PM (last 30 min, theta crush on expiry)

HOW to enter:
- Wait for a small pullback AFTER signal fires (don't chase)
- If price has already moved 0.5% in signal direction, SKIP
- Use limit orders, not market orders (avoid slippage)
- Buy ATM for intraday, 1 strike OTM for positional

STRIKE SELECTION:
- Intraday: ATM (delta ~0.5, fast movement)
- Positional: 1 strike OTM (better leverage, acceptable delta ~0.35-0.45)
- NEVER buy deep OTM (>3 strikes away). Probability is too low.`
        },
        {
          title: 'Exit Rules',
          body: `STOP-LOSS (Non-negotiable):
- Option premium SL: Exit if premium drops 30% from entry
- Spot-based SL: Exit if spot breaks key OI level (shown in signal)
- Time-based SL: Intraday - exit by 3:15 PM. Positional - max 3 days hold.

TARGET:
- First target: Next major OI level (shown in signal)
- Trail SL: Once 50% profit achieved, move SL to entry price (free trade)
- Let profits run if VIX is supportive and OI levels haven't shifted

MANDATORY EXITS:
- Exit if VIX suddenly spikes >15% intraday (panic event)
- Exit if your strike's OI suddenly drops >30% (institutional exit)
- Exit ALL positions before major events (budget day, RBI day)`
        },
        {
          title: 'Position Sizing Rules',
          body: `THE 2% RULE:
Never risk more than 2% of total capital on a single trade.

Example: Capital = ₹1,00,000
Max risk per trade = ₹2,000
If option premium = ₹200 and SL is at ₹140 (30% SL)
Loss per lot = ₹60 × lot size
Adjust quantity so max loss ≤ ₹2,000

SCALING:
- MEDIUM confidence signal → Use 50% of allowed position
- HIGH confidence signal → Use 100% of allowed position
- Never average down on a losing option position
- Never add to a position that's already at target

DIVERSIFICATION:
- Max 2 open option positions at any time
- Don't buy CE and PE on same underlying simultaneously (unless it's a strategy)
- Don't trade if you already have 2 losing trades today (stop for the day)`
        },
        {
          title: 'Psychological Rules',
          body: `These are as important as technical rules:

1. NO REVENGE TRADING: Lost money? Don't immediately take another trade to "recover"
2. NO FOMO: Missed a move? Don't chase. Next signal will come.
3. ACCEPT LOSSES: 30% SL hit = you did the right thing. Move on.
4. JOURNAL: Record every trade - entry reason, exit reason, emotion during trade
5. MAX 3 TRADES PER DAY: Even if signals fire, more than 3 trades = overtrading
6. WEEKLY LOSS LIMIT: If you lose 6% of capital in a week, STOP trading that week
7. CELEBRATE DISCIPLINE: Following rules > making money. Profits follow discipline.`
        }
      ]
    }
  },
  {
    id: 'strike-selection',
    title: 'Strike Selection & Greeks',
    description: 'Choosing the right strike price using Delta and Theta',
    difficulty: 'Intermediate',
    order: 9,
    content: {
      sections: [
        {
          title: 'Understanding Delta',
          body: `Delta tells you how much your option price moves for every ₹1 move in the underlying.

CE Delta ranges from 0 to 1:
- Deep ITM Call: Delta ~0.9 (moves almost like the stock)
- ATM Call: Delta ~0.5 (moves half of stock)
- Deep OTM Call: Delta ~0.1 (barely moves)

PE Delta ranges from 0 to -1:
- Deep ITM Put: Delta ~-0.9
- ATM Put: Delta ~-0.5
- Deep OTM Put: Delta ~-0.1

PRACTICAL MEANING:
If you buy Nifty 22,000 CE (ATM, delta 0.5) at ₹150:
- Nifty moves up 100 points → Option gains ~₹50 (delta × move)
- Nifty moves down 100 points → Option loses ~₹50

If you buy Nifty 22,200 CE (OTM, delta 0.25) at ₹60:
- Nifty moves up 100 points → Option gains only ~₹25
- You need 200+ point move just to double your money

THIS IS WHY cheap OTM options are traps. Low delta = you need massive moves.`
        },
        {
          title: 'Understanding Theta (Time Decay)',
          body: `Theta tells you how much your option LOSES per day just by time passing.

Example: Nifty 22,000 CE, Theta = -₹15
This means the option loses ₹15 EVERY DAY even if Nifty doesn't move.

THETA ACCELERATION:
- 5 days to expiry: Theta = -₹8/day
- 2 days to expiry: Theta = -₹15/day  
- Expiry day: Theta = -₹40/day (MASSIVE)

THIS IS WHY:
1. Don't hold options to expiry unless deeply ITM
2. Intraday trades on expiry day face brutal theta (trade early, exit early)
3. Positional trades: Enter with at least 3-5 days to expiry

The signal engine accounts for this by recommending:
- Intraday: Current week expiry ATM (accept the theta, ride the delta)
- Positional: Next week expiry or current week early in the week`
        },
        {
          title: 'Recommended Strike Selection Matrix',
          body: `Based on timeframe and confidence:

INTRADAY TRADES:
| Confidence | Strike | Why |
|-----------|--------|-----|
| HIGH | ATM | Best delta, fast profits |
| MEDIUM | ATM | Same, but smaller quantity |

POSITIONAL TRADES (2-5 days):
| Confidence | Strike | Why |
|-----------|--------|-----|
| HIGH | 1 strike OTM | Good leverage, acceptable theta |
| MEDIUM | ATM | Safer, higher delta compensates for smaller move |

NEVER DO:
❌ Buy 3+ strikes OTM (lottery tickets, >90% expire worthless)
❌ Buy deep ITM (too expensive, no leverage benefit - just trade futures)
❌ Buy current expiry on Monday for positional (too much theta decay by Thursday)
❌ Buy on expiry day after 2:00 PM (theta is killing machine)`
        }
      ]
    }
  },
  {
    id: 'common-mistakes',
    title: 'Common Mistakes & How to Avoid Them',
    description: 'The expensive lessons that most traders learn the hard way',
    difficulty: 'All Levels',
    order: 10,
    content: {
      sections: [
        {
          title: 'Mistake #1: Buying Cheap OTM Options',
          body: `THE TRAP: "This option is only ₹10! If Nifty moves 200 points, it'll be ₹50 - 5x return!"

REALITY: 
- ₹10 options are deep OTM with delta < 0.1
- Nifty needs to move 300+ points for meaningful profit
- 95% of deep OTM options expire at ₹0
- You end up buying 10 lottery tickets hoping one hits

THE FIX: Buy ATM or 1 strike OTM. Pay more premium but get higher probability. ₹150 becoming ₹250 (67% gain) is better than ₹10 becoming ₹0 nine times out of ten.`
        },
        {
          title: 'Mistake #2: Not Having a Stop-Loss',
          body: `THE TRAP: "Let me hold, it'll come back." / "I'll average down if it falls more."

REALITY:
- Options decay with time. Stocks can recover; options cannot (they expire)
- Averaging down on options = doubling your bet on a losing horse
- Without SL, a ₹200 option can go to ₹20 in a single day

THE FIX:
- Set 30% premium SL BEFORE entering
- Use spot-based SL (key OI level broken = exit)
- Accept the loss. ₹2,000 lost is better than ₹10,000 lost
- Rule: "If the reason I entered is no longer valid, I exit"`
        },
        {
          title: 'Mistake #3: Trading Before/During Events',
          body: `THE TRAP: "Budget/RBI policy will be bullish! Let me buy calls!"

REALITY:
- IV is already 2-3x normal before events
- You're buying extremely expensive options
- Even if direction is right, IV crush wipes out gains
- Market often does the opposite of consensus

THE FIX:
- Exit ALL positions 1 day before major events
- Re-enter AFTER the event when IV normalizes
- If you must trade events, use defined-risk strategies (spreads, not naked buys)
- The signal engine will warn you when IV is elevated`
        },
        {
          title: 'Mistake #4: Overtrading',
          body: `THE TRAP: "I'll take every signal!" / "Markets are moving, I should be trading!"

REALITY:
- Brokerage + taxes eat 1-2% per trade (both sides)
- 10 trades/day × ₹50 brokerage = ₹500 gone in costs alone
- Mental fatigue leads to poor decisions by afternoon
- More trades ≠ more profits

THE FIX:
- Max 3 trades per day (this app enforces this in its rules)
- Only trade MEDIUM/HIGH confidence signals
- Quality over quantity
- Some of the best days are when you DON'T trade`
        },
        {
          title: 'Mistake #5: Ignoring Options-Specific Data',
          body: `THE TRAP: "Chart shows support at 22,000, let me buy calls!"

REALITY:
- Chart support might hold, but if all PUT OI at 22,000 is unwinding, writers are abandoning that level
- Chart says resistance at 22,500, but if CALL OI at 22,500 is reducing, writers are covering = resistance will break
- You can be right on the chart and wrong on the option trade

THE FIX:
- Use OI data alongside charts (this app does this for you)
- Chart tells you WHERE. OI tells you WHO is defending that level.
- If big money (OI) disagrees with your chart level, trust the money
- The signal engine combines both: OI-based levels + scoring system`
        }
      ]
    }
  }
];

module.exports = learningContent;
