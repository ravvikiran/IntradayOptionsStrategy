# Options Signal Engine - Indian Market 📊

A web application that generates options trading signals for NSE (Nifty, BankNifty) using a professional-grade scoring system based on options-specific data like Open Interest, PCR, IV, Max Pain, and VIX.

**This is a learning tool** — every signal comes with a full explanation of *why* it was generated and what rules triggered.

![Signal Dashboard](https://img.shields.io/badge/Status-Active-green) ![Node.js](https://img.shields.io/badge/Node.js-18%2B-green) ![React](https://img.shields.io/badge/React-18-blue) ![License](https://img.shields.io/badge/License-ISC-yellow)

---

## Features

- **Live Signal Dashboard** — Real-time signal generation for NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY
- **7-Rule Scoring System** — Multiple independent indicators must agree before a signal fires
- **Full Transparency** — Every signal shows exactly which rules triggered and why
- **Risk Management** — Stop-loss, targets, position sizing included with every signal
- **Learning Module** — 10 educational modules explaining every concept used in signal generation
- **Trading Rules** — Professional trading checklist (pre-trade, entry, exit, position sizing)
- **Dark Theme UI** — Clean, responsive dashboard

---

## How the Signal Engine Works

The engine uses a **weighted scoring system**:

| Rule | Max Score | What it Measures |
|------|-----------|-----------------|
| PCR Analysis | ±2 | Market sentiment from option writers |
| Max Pain | ±1 | Where market makers want price at expiry |
| OI Support/Resistance | ±2 | Where institutional money defends levels |
| Change in OI | ±2 | Fresh positions entering/exiting right now |
| IV Analysis | ±1 | Are options cheap or expensive + IV skew |
| VIX Analysis | ±1 | Should you trade at all today |
| Volume-OI Divergence | ±1 | Is the current move genuine or a trap |

**Signal Threshold: ±3** → Minimum 2 strong rules must agree.  
**HIGH Confidence: ±5** → Strong consensus across indicators.

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher (includes npm)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd IntradayOptionsStrategy

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Running the Application

**Option 1: Production mode (single terminal)**
```bash
# Build the client first
cd client
npm run build
cd ..

# Start the server (serves both API + frontend)
npm start
```
Open `http://localhost:5000` in your browser.

**Option 2: Development mode (two terminals)**
```bash
# Terminal 1: Start backend server
npm start

# Terminal 2: Start React dev server (hot-reload)
cd client
npm start
```
Frontend opens at `http://localhost:3000`, API at `http://localhost:5000`.

---

## Usage Guide

1. Open the app → Dashboard shows NIFTY by default
2. Click any symbol button to analyze that instrument
3. Read the **Rule-by-Rule Breakdown** to understand why the signal was generated
4. Check **Risk Management** section for stop-loss and targets
5. Visit the **Learning** tab to understand each concept in depth
6. Visit the **Trading Rules** tab for the complete pre-trade checklist

### Signal Types

| Signal | Meaning |
|--------|---------|
| BUY CE (CALL) | Bullish — Buy Call option at recommended strike |
| BUY PE (PUT) | Bearish — Buy Put option at recommended strike |
| LEAN BULLISH | Mildly bullish, not enough for trade — watch |
| LEAN BEARISH | Mildly bearish, not enough for trade — watch |
| NO SIGNAL | Market is undecided — stay out |

---

## Project Structure

```
├── server/                    # Backend (Node.js + Express)
│   ├── index.js              # Server entry point
│   ├── routes/
│   │   ├── nseRoutes.js      # NSE raw data endpoints
│   │   ├── signalRoutes.js   # Signal generation endpoints
│   │   └── learningRoutes.js # Learning module endpoints
│   ├── services/
│   │   ├── nseService.js     # NSE data fetching (stock-nse-india)
│   │   └── signalEngine.js   # Signal scoring engine (THE BRAIN)
│   └── data/
│       └── learningContent.js # Educational content (10 modules)
├── client/                    # Frontend (React 18)
│   ├── src/
│   │   ├── App.js            # Main app with routing
│   │   ├── pages/            # Dashboard, Learning, Rules pages
│   │   ├── components/       # SignalCard component
│   │   └── styles.css        # Dark theme styling
│   ├── public/
│   └── package.json
├── TECHNICAL_DOCS.md          # Detailed technical documentation
├── package.json               # Server dependencies
├── .gitignore
└── README.md
```

---

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React 18, React Router v6
- **Data Source**: NSE India (via [stock-nse-india](https://www.npmjs.com/package/stock-nse-india) package)
- **Styling**: Custom CSS (dark theme, no external UI libraries)

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/signals/generate/:symbol` | GET | Generate signal for a symbol |
| `/api/signals/scan` | GET | Generate signals for all tracked symbols |
| `/api/nse/option-chain/:symbol` | GET | Raw option chain data |
| `/api/nse/vix` | GET | India VIX current value |
| `/api/learning/modules` | GET | List all learning modules |
| `/api/learning/modules/:id` | GET | Get specific module content |
| `/api/learning/rules` | GET | Get trading rules checklist |

---

## Important Notes

1. **Market Hours**: Data is live during 9:15 AM - 3:30 PM IST (Mon-Fri). Outside hours you'll get last available data.
2. **Rate Limiting**: Wait at least 10 seconds between refreshes.
3. **Data Delay**: Free NSE data has ~3-5 minute delay.
4. **Indices Only**: NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY. Stock options are blocked by NSE's free API.
5. **Not Financial Advice**: This is a learning/educational tool. Trade at your own risk with limited quantities.

---

## Disclaimer

This application is for **educational purposes only**. It is not financial advice. Options trading involves significant risk of loss. The signals generated by this application should be used as a learning tool and not as the sole basis for trading decisions. Always do your own research and consult with a qualified financial advisor before making investment decisions.

---

## License

ISC
