import { Radio, TrendingUp, TrendingDown, Activity, Wifi, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { createMarketDataService, MARKET_DATA_CONFIGS, LiveTickData, RealMarketDataConfig } from "../../services/realMarketData";

interface MarketFeedScreenProps {
  isDarkMode: boolean;
  exchange: "NSE" | "BSE";
}

interface FeedItem {
  id: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
}

export function MarketFeedScreen({ isDarkMode, exchange }: MarketFeedScreenProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLiveData, setIsLiveData] = useState(false);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [marketDataService, setMarketDataService] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [dataProvider, setDataProvider] = useState<'MOCK' | 'YAHOO_FINANCE'>('MOCK');

  // Comprehensive Indian stock symbols by exchange
  const stockSymbols = {
    NSE: [
      "NIFTY50", "BANKNIFTY", "FINNIFTY", "RELIANCE", "TCS", "INFY", "HDFCBANK", 
      "ICICIBANK", "SBIN", "BHARTIARTL", "ITC", "LT", "HCLTECH", "ASIANPAINT", 
      "MARUTI", "KOTAKBANK", "WIPRO", "ULTRACEMCO", "AXISBANK", "TITAN",
      "NESTLEIND", "BAJFINANCE", "M&M", "SUNPHARMA", "TECHM", "POWERGRID", "NTPC"
    ],
    BSE: [
      "SENSEX", "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "ITC", 
      "LT", "BHARTIARTL", "HCLTECH", "ASIANPAINT", "MARUTI", "KOTAKBANK", "WIPRO", 
      "ULTRACEMCO", "AXISBANK", "TITAN", "NESTLEIND", "BAJFINANCE", "M&M", "SUNPHARMA"
    ]
  };

  useEffect(() => {
    // Initialize with exchange-specific symbols
    const symbols = stockSymbols[exchange].slice(0, 12); // Show first 12 symbols
    setSelectedSymbols(symbols);
    initializeDataService();
    
    return () => {
      if (marketDataService) {
        marketDataService.disconnect();
      }
    };
  }, [exchange]); // Update when exchange changes
  
  // Initialize market data service
  const initializeDataService = async () => {
    try {
      const config = isLiveData ? MARKET_DATA_CONFIGS.YAHOO_FINANCE : MARKET_DATA_CONFIGS.DEMO;
      const service = createMarketDataService(config);
      
      // Subscribe to real-time updates
      service.subscribe('tick', (tickData: LiveTickData) => {
        setFeedItems(prev => prev.map(item => 
          item.symbol === tickData.symbol ? {
            id: item.id,
            symbol: tickData.symbol,
            price: tickData.price,
            change: tickData.change,
            changePercent: tickData.changePercent,
            volume: tickData.volume,
            timestamp: new Date(tickData.timestamp)
          } : item
        ));
      });
      
      const connected = await service.connect();
      setMarketDataService(service);
      setConnectionStatus(connected ? 'Connected' : 'Failed');
      
      if (connected) {
        console.log(`✅ Connected to ${config.provider} market data`);
      }
      
    } catch (error) {
      console.error('Failed to initialize market data service:', error);
      setConnectionStatus('Error');
    }
  };
  
  // Toggle between live and demo data
  const toggleDataMode = async () => {
    if (marketDataService) {
      marketDataService.disconnect();
    }
    
    setIsLiveData(!isLiveData);
    setDataProvider(isLiveData ? 'MOCK' : 'YAHOO_FINANCE');
    
    // Reinitialize with new mode
    setTimeout(() => {
      initializeDataService();
    }, 500);
  };
  
  // Update feed when selected symbols change
  useEffect(() => {
    const newFeed = selectedSymbols.map((symbol, index) => ({
      id: `${symbol}-${Date.now()}-${index}`,
      symbol,
      price: 1000 + Math.random() * 20000,
      change: (Math.random() - 0.5) * 200,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
      timestamp: new Date(Date.now() - index * 1000),
    }));
    setFeedItems(newFeed);
  }, [selectedSymbols]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Market Feed - {exchange}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {isLiveData ? `Real-time market data via ${dataProvider.replace('_', ' ')}` : 'Demo market data for development'}
          </p>
        </div>
        
        {/* Data Source Indicator & Toggle */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
            isLiveData
              ? isDarkMode ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-green-50 border-green-200 text-green-700'
              : isDarkMode ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700'
          }`}>
            {isLiveData ? (
              <>
                <Wifi className="size-4" />
                <span className="text-sm font-medium">Yahoo Finance</span>
              </>
            ) : (
              <>
                <Activity className="size-4" />
                <span className="text-sm font-medium">Demo Mode</span>
              </>
            )}
            <div className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
              connectionStatus === 'Connected' 
                ? isDarkMode ? 'bg-green-400/20 text-green-300' : 'bg-green-100 text-green-700'
                : isDarkMode ? 'bg-red-400/20 text-red-300' : 'bg-red-100 text-red-700'
            }`}>
              {connectionStatus}
            </div>
          </div>
          
          {/* Live Data Toggle */}
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Demo</span>
            <button
              onClick={toggleDataMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isLiveData
                  ? 'bg-green-500'
                  : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                isLiveData ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Live</span>
          </div>
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Table Header */}
        <div className={`grid grid-cols-6 gap-4 p-4 border-b font-semibold text-sm ${
          isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          <div>Symbol</div>
          <div className="text-right">Price</div>
          <div className="text-right">Change</div>
          <div className="text-right">Change %</div>
          <div className="text-right">Volume</div>
          <div className="text-right">Updated</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-700">
          {feedItems.map((item) => (
            <div
              key={item.id}
              className={`grid grid-cols-6 gap-4 p-4 transition-colors ${
                isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Radio className={`size-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {item.symbol}
                </span>
              </div>
              <div className={`text-right font-semibold tabular-nums ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-right font-semibold tabular-nums flex items-center justify-end gap-1 ${
                item.change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {item.change >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
              </div>
              <div className={`text-right font-semibold tabular-nums ${
                item.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
              </div>
              <div className={`text-right tabular-nums text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {(item.volume / 1000).toFixed(0)}K
              </div>
              <div className={`text-right tabular-nums text-xs ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {formatTime(item.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
