const { NseIndia } = require('stock-nse-india');

/**
 * NSE Data Service
 * Uses the stock-nse-india package which handles all cookie/session management
 * for accessing NSE India data reliably.
 */

class NSEService {
  constructor() {
    this.nse = new NseIndia();
  }

  /**
   * Get option chain data for a symbol
   * @param {string} symbol - NIFTY, BANKNIFTY, or stock symbol
   */
  async getOptionChain(symbol) {
    try {
      // Index symbols that use getIndexOptionChain
      const indexSymbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
      if (indexSymbols.includes(symbol)) {
        return await this.nse.getIndexOptionChain(symbol);
      } else {
        // For equity options, try getDataByEndpoint with the equities URL
        // This may return limited data due to NSE restrictions
        const data = await this.nse.getDataByEndpoint(`/api/option-chain-equities?symbol=${symbol}`);
        if (data && data.records && data.filtered) {
          return data;
        }
        // Fallback: throw descriptive error
        throw new Error(`Equity option chain for ${symbol} is currently unavailable. NSE restricts access to equity option data. Try NIFTY or BANKNIFTY for reliable signals.`);
      }
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
      const data = await this.nse.getAllIndices();
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
      return await this.nse.getMarketStatus();
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
      const data = await this.nse.getAllIndices();
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
      return await this.nse.getEquityDetails(symbol);
    } catch (error) {
      console.error(`Failed to fetch equity quote for ${symbol}:`, error.message);
      throw error;
    }
  }
}

module.exports = new NSEService();
