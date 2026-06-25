const axios = require('axios');

/**
 * NSE Data Service
 * Fetches option chain, indices, and market data from NSE India
 * 
 * NOTE: NSE blocks direct API calls without proper headers.
 * We mimic a browser session by first hitting the main page for cookies,
 * then making API calls with those cookies.
 */

class NSEService {
  constructor() {
    this.baseUrl = 'https://www.nseindia.com';
    this.cookies = '';
    this.lastCookieTime = 0;
    this.cookieExpiry = 5 * 60 * 1000; // 5 minutes
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
    };
  }

  async refreshCookies() {
    const now = Date.now();
    if (now - this.lastCookieTime < this.cookieExpiry && this.cookies) {
      return;
    }
    try {
      const response = await axios.get(this.baseUrl, {
        headers: this.headers,
        timeout: 10000,
        maxRedirects: 5,
      });
      const setCookies = response.headers['set-cookie'];
      if (setCookies) {
        this.cookies = setCookies.map(c => c.split(';')[0]).join('; ');
        this.lastCookieTime = now;
      }
    } catch (error) {
      // Reset cookie time so next request retries
      this.lastCookieTime = 0;
      this.cookies = '';
      console.error('Failed to refresh NSE cookies:', error.message);
    }
  }

  async fetchData(url) {
    await this.refreshCookies();
    try {
      const response = await axios.get(url, {
        headers: {
          ...this.headers,
          'Cookie': this.cookies,
          'Referer': this.baseUrl,
        },
        timeout: 15000,
      });
      return response.data;
    } catch (error) {
      console.error(`NSE fetch error for ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Get option chain data for a symbol
   * @param {string} symbol - NIFTY, BANKNIFTY, or stock symbol
   */
  async getOptionChain(symbol) {
    const url = symbol === 'NIFTY' || symbol === 'BANKNIFTY'
      ? `${this.baseUrl}/api/option-chain-indices?symbol=${symbol}`
      : `${this.baseUrl}/api/option-chain-equities?symbol=${symbol}`;
    return this.fetchData(url);
  }

  /**
   * Get India VIX data
   */
  async getVIX() {
    try {
      const url = `${this.baseUrl}/api/allIndices`;
      const data = await this.fetchData(url);
      if (!data || !data.data || !Array.isArray(data.data)) {
        console.error('VIX: Unexpected data structure from allIndices');
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
    const url = `${this.baseUrl}/api/marketStatus`;
    return this.fetchData(url);
  }

  /**
   * Get index data (Nifty 50, Bank Nifty)
   */
  async getIndexData(symbol) {
    try {
      const url = `${this.baseUrl}/api/allIndices`;
      const data = await this.fetchData(url);
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
    const url = `${this.baseUrl}/api/quote-equity?symbol=${symbol}`;
    return this.fetchData(url);
  }
}

module.exports = new NSEService();
