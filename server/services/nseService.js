const { NseIndia } = require('stock-nse-india');

/**
 * NSE Data Service with in-memory caching
 * Uses the stock-nse-india package which handles all cookie/session management.
 * Includes a TTL-based cache to reduce redundant NSE API calls.
 */

const REQUEST_TIMEOUT = 15000; // 15 seconds
const CACHE_TTL = 30000; // 30 seconds cache

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

/**
 * Simple TTL cache
 */
class MemoryCache {
  constructor(ttl = CACHE_TTL) {
    this.ttl = ttl;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data) {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }
}

class NSEService {
  constructor() {
    try {
      this.nse = new NseIndia();
    } catch (err) {
      console.error('Failed to initialize NseIndia:', err.message);
      this.nse = null;
    }
    this.cache = new MemoryCache(CACHE_TTL);
  }

  /**
   * Get option chain data for a symbol (cached 30s)
   */
  async getOptionChain(symbol) {
    if (!this.nse) throw new Error('NSE service not initialized');
    const cacheKey = `oc_${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await withTimeout(
        this.nse.getIndexOptionChain(symbol),
        REQUEST_TIMEOUT,
        `getOptionChain(${symbol})`
      );
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Option chain fetch error for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get India VIX data (cached 30s)
   */
  async getVIX() {
    if (!this.nse) return null;
    const cached = this.cache.get('vix');
    if (cached) return cached;

    try {
      const data = await withTimeout(
        this.nse.getAllIndices(),
        REQUEST_TIMEOUT,
        'getVIX'
      );
      if (!data || !data.data || !Array.isArray(data.data)) {
        return null;
      }
      const vix = data.data.find(idx => idx.indexSymbol === 'INDIA VIX');
      if (vix) this.cache.set('vix', vix);
      return vix || null;
    } catch (error) {
      console.error('Failed to fetch VIX:', error.message);
      return null;
    }
  }

  /**
   * Get market status (cached 60s)
   */
  async getMarketStatus() {
    if (!this.nse) throw new Error('NSE service not initialized');
    const cached = this.cache.get('market_status');
    if (cached) return cached;

    try {
      const data = await withTimeout(
        this.nse.getMarketStatus(),
        REQUEST_TIMEOUT,
        'getMarketStatus'
      );
      this.cache.set('market_status', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch market status:', error.message);
      throw error;
    }
  }

  /**
   * Get index data (cached 30s)
   */
  async getIndexData(symbol) {
    if (!this.nse) return null;
    const cacheKey = `idx_${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await withTimeout(
        this.nse.getAllIndices(),
        REQUEST_TIMEOUT,
        `getIndexData(${symbol})`
      );
      if (!data || !data.data || !Array.isArray(data.data)) return null;
      const index = data.data.find(idx => idx.indexSymbol === symbol);
      if (index) this.cache.set(cacheKey, index);
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
    if (!this.nse) throw new Error('NSE service not initialized');
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
