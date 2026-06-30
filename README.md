# Options Signal Engine - Indian Market

A web application that generates options trading signals for NSE (Nifty, BankNifty, and stock options) using a professional-grade scoring system based on options-specific data analysis.

## Features

- **Signal Dashboard**: Real-time signal generation for NIFTY, BANKNIFTY, and major stocks
- **Scoring System**: 7 independent rules that must agree before a signal fires
- **Full Transparency**: Every signal shows exactly which rules triggered and why
- **Risk Management**: Stop-loss, targets, position sizing with every signal
- **Learning Module**: Complete educational content explaining every concept used
- **Trading Rules**: Professional trading checklist enforced by the engine

## How to Run

### Prerequisites
- Node.js (v16 or higher) - Download from https://nodejs.org
- npm (comes with Node.js)

### Installation

```bash
# 1. Install server dependencies
npm install

# 2. Install client dependencies
cd client
npm install
cd ..
```

### Running the Application

**Option 1: Run both server and client separately (Development)**

Terminal 1 - Start the backend server:
```bash
npm start
```

Terminal 2 - Start the React frontend:
```bash
cd client
npm start
```

The app will open at http://localhost:3000 (frontend) with API on http://localhost:5000.

**Option 2: Production build**

```bash
cd client
npm run build
cd ..
npm start
```

Then open http://localhost:5000 in your browser.

### Important Notes

1. **NSE Data**: The app fetches live data from NSE India using the `stock-nse-india` package. This works during market hours (9:15 AM - 3:30 PM IST, Mon-Fri). Outside market hours, you'll get the last available data.

2. **Rate Limiting**: Don't refresh too frequently (wait at least 10 seconds between refreshes). NSE has rate limits.

3. **Data Delay**: Free NSE data has a ~3-5 minute delay. Fine for learning and positional trades.

4. **Stock Options**: NIFTY and BANKNIFTY are the most reliable. Stock options (RELIANCE, TCS, etc.) may have limited availability due to NSE data restrictions.

5. **Not Financial Advice**: This is a learning tool. Always do your own analysis before trading.

## Quick Start Guide

1. Open the app → Dashboard shows signal for NIFTY by default
2. Click any symbol button to analyze that instrument
3. Read the **Rule-by-Rule Breakdown** to understand why the signal was generated
4. Check **Risk Management** section for stop-loss and targets
5. Visit **Learning** tab to understand each concept in depth
6. Visit **Trading Rules** tab for the complete pre-trade checklist

## Project Structure

```
├── server/                 # Backend (Node.js + Express)
│   ├── index.js           # Server entry point
│   ├── routes/            # API routes
│   │   ├── nseRoutes.js   # NSE data endpoints
│   │   ├── signalRoutes.js # Signal generation endpoints
│   │   └── learningRoutes.js # Learning module endpoints
│   ├── services/          # Business logic
│   │   ├── nseService.js  # NSE data fetching
│   │   └── signalEngine.js # Signal scoring engine (THE BRAIN)
│   └── data/
│       └── learningContent.js # Educational content
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── App.js        # Main app with routing
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   └── styles.css    # All styling
│   └── public/
├── TECHNICAL_DOCS.md      # Detailed technical documentation
├── package.json           # Server dependencies
└── README.md              # This file
```
