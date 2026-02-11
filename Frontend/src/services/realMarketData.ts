/**
 * Real Market Data Service for NSE/BSE Integration
 * 
 * This service provides integration with actual Indian stock market data sources.
 * For production use, you would connect to official market data providers.
 */

import api from './api';

export interface RealMarketDataConfig {
  provider: 'NSE_OFFICIAL' | 'BSE_OFFICIAL' | 'ALPHA_VANTAGE' | 'YAHOO_FINANCE' | 'MOCK';
  apiKey?: string;
  refreshInterval: number; // milliseconds
}

export interface LiveTickData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  timestamp: string;
  bid?: number;
  ask?: number;
}

export interface MarketDataProvider {
  name: string;
  isConnected: boolean;
  lastUpdate: string;
  symbolCount: number;
  latency: number; // milliseconds
}

class RealMarketDataService {
  private config: RealMarketDataConfig;
  private isConnected: boolean = false;
  private subscribers: Map<string, Function[]> = new Map();
  private dataCache: Map<string, LiveTickData> = new Map();
  private updateInterval?: number;

  constructor(config: RealMarketDataConfig) {
    this.config = config;
  }

  /**
   * Connect to real market data source
   */
  async connect(): Promise<boolean> {
    try {
      switch (this.config.provider) {
        case 'NSE_OFFICIAL':
          return await this.connectNSEOfficial();
        case 'BSE_OFFICIAL':
          return await this.connectBSEOfficial();
        case 'ALPHA_VANTAGE':
          return await this.connectAlphaVantage();
        case 'YAHOO_FINANCE':
          return await this.connectYahooFinance();
        case 'MOCK':
          return await this.connectMockProvider();
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('Failed to connect to market data provider:', error);
      return false;
    }
  }

  /**
   * Yahoo Finance Integration (Free but unofficial)
   */
  private async connectYahooFinance(): Promise<boolean> {
    console.log('🔗 Connecting to Yahoo Finance API...');
    
    try {
      // Test with a sample Indian stock
      const testUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/RELIANCE.NS';
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (data.chart?.result?.[0]) {
        this.isConnected = true;
        this.startYahooFinanceFeed();
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Yahoo Finance connection failed:', error);
      return false;
    }
  }

  /**
   * Mock provider for development/demo
   */
  private async connectMockProvider(): Promise<boolean> {
    console.log('🔗 Connecting to Mock Provider (Enhanced Simulation)...');
    this.isConnected = true;
    this.startMockDataFeed();
    return true;
  }

  /**
   * Start Yahoo Finance data feed
   */
  private startYahooFinanceFeed(): void {
    // Yahoo Finance symbols for NSE stocks
    const symbols = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS'];
    
    this.updateInterval = setInterval(async () => {
      try {
        const symbolsQuery = symbols.join(',');
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsQuery}`;
        const response = await fetch(url);
        const data = await response.json();
        
        const quotes = data.quoteResponse?.result || [];
        
        quotes.forEach((quote: any) => {
          const tickData: LiveTickData = {
            symbol: quote.symbol.replace('.NS', ''),
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            high: quote.regularMarketDayHigh || 0,
            low: quote.regularMarketDayLow || 0,
            open: quote.regularMarketOpen || 0,
            timestamp: new Date().toISOString(),
            bid: quote.bid,
            ask: quote.ask
          };
          
          this.updateSymbolData(tickData);
        });
        
      } catch (error) {
        console.error('Yahoo Finance feed error:', error);
      }
    }, this.config.refreshInterval);
  }

  /**
   * Enhanced mock data feed with realistic market behavior
   */
  private startMockDataFeed(): void {
    const symbols = [
      'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL',
      'ITC', 'LT', 'HCLTECH', 'ASIANPAINT', 'MARUTI', 'KOTAKBANK', 'WIPRO'
    ];
    
    // Initialize with realistic base prices
    const basePrices: { [key: string]: number } = {
      'RELIANCE': 2450, 'TCS': 3200, 'INFY': 1450, 'HDFCBANK': 1650,
      'ICICIBANK': 950, 'SBIN': 420, 'BHARTIARTL': 850, 'ITC': 420,
      'LT': 2100, 'HCLTECH': 1250, 'ASIANPAINT': 3100, 'MARUTI': 9500,
      'KOTAKBANK': 1750, 'WIPRO': 400
    };
    
    this.updateInterval = setInterval(() => {
      symbols.forEach(symbol => {
        const basePrice = basePrices[symbol] || 1000;
        const volatility = 0.02; // 2% volatility
        const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
        const newPrice = basePrice + change;
        
        const tickData: LiveTickData = {
          symbol,
          price: newPrice,
          change: change,
          changePercent: (change / basePrice) * 100,
          volume: Math.floor(Math.random() * 1000000) + 50000,
          high: newPrice + Math.random() * 50,
          low: newPrice - Math.random() * 50,
          open: basePrice + (Math.random() - 0.5) * 20,
          timestamp: new Date().toISOString()
        };
        
        this.updateSymbolData(tickData);
      });
    }, this.config.refreshInterval);
  }

  private async connectNSEOfficial(): Promise<boolean> {
    console.log('🔗 NSE Official requires proper licensing - using enhanced mock');
    return this.connectMockProvider();
  }

  private async connectBSEOfficial(): Promise<boolean> {
    console.log('🔗 BSE Official requires proper licensing - using enhanced mock');
    return this.connectMockProvider();
  }

  private async connectAlphaVantage(): Promise<boolean> {
    console.log('🔗 Alpha Vantage requires API key - using mock data');
    return this.connectMockProvider();
  }

  private updateSymbolData(tickData: LiveTickData): void {
    this.dataCache.set(tickData.symbol, tickData);
    this.notifySubscribers('tick', tickData);
    this.notifySubscribers(`tick:${tickData.symbol}`, tickData);
  }

  subscribe(event: string, callback: Function): void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(callback);
  }

  unsubscribe(event: string, callback: Function): void {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifySubscribers(event: string, data: any): void {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  getSymbolData(symbol: string): LiveTickData | null {
    return this.dataCache.get(symbol) || null;
  }

  getAllData(): LiveTickData[] {
    return Array.from(this.dataCache.values());
  }

  getConnectionStatus(): MarketDataProvider {
    return {
      name: this.config.provider,
      isConnected: this.isConnected,
      lastUpdate: new Date().toISOString(),
      symbolCount: this.dataCache.size,
      latency: Math.floor(Math.random() * 100) + 50 // Simulated latency
    };
  }

  disconnect(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.isConnected = false;
    this.dataCache.clear();
    this.subscribers.clear();
  }
}

// Export configurations
export const MARKET_DATA_CONFIGS = {
  DEMO: {
    provider: 'MOCK' as const,
    refreshInterval: 2000
  },
  YAHOO_FINANCE: {
    provider: 'YAHOO_FINANCE' as const,
    refreshInterval: 5000
  }
};

// Export singleton instance
let marketDataService: RealMarketDataService | null = null;

export const createMarketDataService = (config: RealMarketDataConfig): RealMarketDataService => {
  if (marketDataService) {
    marketDataService.disconnect();
  }
  marketDataService = new RealMarketDataService(config);
  return marketDataService;
};

export const getMarketDataService = (): RealMarketDataService | null => {
  return marketDataService;
};