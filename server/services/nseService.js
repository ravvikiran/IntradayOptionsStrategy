const { NseIndia } = require('stock-nse-india');

/**
 * NSE Data Service
 * Uses the stock-nse-india package which handles all cookie/session management
 * for accessing NSE India data reliably.
 */

const REQUEST_TIMEOUT = 15000; // 15 seconds

/**
 * Wraps a promise with a timeout
 */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

class NSEService {
  constructor() {
    this.nse = new NseIndia();
  }

  /**
   * Get option chain data for a symbol
   * @param {string} symbol - NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY
   */
  async getOptionChain(symbol) {
    try {
      return await withTimeout(
        this.nse.getIndexOptionChain(symbol),
        REQUEST_TIMEOUT,
        `getOptionChain(${symbol})`
      );
    } catch (error) {
      console.error(`Option chain fetch error for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get India VIX data
   */
  async getVIX() {
    try {
      const data = await withTimeout(
        this.nse.getAllIndices(),
        REQUEST_TIMEOUT,
        'getVIX'
      );
      if (!data || !data.data || !Array.isArray(data.data)) {
        console.error('VIX: Unexpected data structure from getAllIndices');
        return null;
      }
      const vix = data.data.find(idx => idx.indexSymbol === 'INDIA VIX');
      return vix || null;
    } catch (error) {
      console.error('Failed to fetch VIX:', error.message);
      return null;
    }
  }

  /**
   * Get market status (open/closed)
   */
  async getMarketStatus() {
    try {
      return await withTimeout(
        this.nse.getMarketStatus(),
        REQUEST_TIMEOUT,
        'getMarketStatus'
      );
    } catch (error) {
      console.error('Failed to fetch market status:', error.message);
      throw error;
    }
  }

  /**
   * Get index data (Nifty 50, Bank Nifty)
   */
  async getIndexData(symbol) {
    try {
      const data = await withTimeout(
        this.nse.getAllIndices(),
        REQUEST_TIMEOUT,
        `getIndexData(${symbol})`
      );
      if (!data || !data.data || !Array.isArray(data.data)) {
        return null;
      }
      const index = data.data.find(idx => idx.indexSymbol === symbol);
      return index || null;
    } catch (error) {
      console.error('Failed to fetch index data:', error.message);
      return null;
    }
  }

  /**
   * Get equity quote for stock options
   */
  async getEquityQuote(symbol) {
    try {
      return await withTimeout(
        this.nse.getEquityDetails(symbol),
        REQUEST_TIMEOUT,
        `getEquityQuote(${symbol})`
      );
    } catch (error) {
      console.error(`Failed to fetch equity quote for ${symbol}:`, error.message);
      throw error;
    }
  }
}

module.exports = new NSEService();
