import { TrendingUp, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { InfoTooltip } from "./info-tooltip";

interface MarketDataCardProps {
  isDarkMode: boolean;
  onPriceChange: (price: number) => void;
  exchange: "NSE" | "BSE";
  /** Live spot price from the Pathway risk event — overrides local simulation when present */
  liveSpotPrice?: number;
}

const symbols = ["NIFTY50", "BANKNIFTY"];

export function MarketDataCard({ isDarkMode, onPriceChange, exchange, liveSpotPrice }: MarketDataCardProps) {
  const [selectedSymbol, setSelectedSymbol] = useState("NIFTY50");
  const [price, setPrice] = useState(liveSpotPrice ?? 21453.75);
  const [strikePrice, setStrikePrice] = useState(21500);
  const [volatility, setVolatility] = useState(15.32);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(false);

  // When Pathway sends a real spot_price, use it directly
  useEffect(() => {
    if (liveSpotPrice !== undefined) {
      setPrice(liveSpotPrice);
      setLastUpdate(new Date());
      setIsLive(true);
      onPriceChange(liveSpotPrice);
    }
  }, [liveSpotPrice, onPriceChange]);

  // Simulate real-time price updates only when no live Pathway data
  useEffect(() => {
    if (liveSpotPrice !== undefined) return; // skip simulation when live data present
    const interval = setInterval(() => {
      setPrice(prev => {
        const change = (Math.random() - 0.5) * 50;
        const newPrice = parseFloat((prev + change).toFixed(2));
        onPriceChange(newPrice);
        return newPrice;
      });
      setVolatility(prev => {
        const change = (Math.random() - 0.5) * 0.5;
        return parseFloat((prev + change).toFixed(2));
      });
      setLastUpdate(new Date());
    }, 2000);

    return () => clearInterval(interval);
  }, [onPriceChange, liveSpotPrice]);

  // Update strike price based on symbol
  useEffect(() => {
    if (selectedSymbol === "NIFTY50") {
      setPrice(21453.75 + (Math.random() - 0.5) * 100);
      setStrikePrice(21500);
      setVolatility(15.32 + (Math.random() - 0.5) * 2);
    } else {
      setPrice(46892.30 + (Math.random() - 0.5) * 200);
      setStrikePrice(47000);
      setVolatility(18.45 + (Math.random() - 0.5) * 2);
    }
  }, [selectedSymbol]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className={`rounded-xl p-6 shadow-lg ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className={`size-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Live Market Data
          </h2>
          {isLive && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
              Pathway Live
            </span>
          )}
          <InfoTooltip 
            content="Real-time market prices streaming from NSE for options pricing and risk calculation"
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* Symbol Dropdown */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Symbol Selection
        </label>
        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className={`w-full px-4 py-3 rounded-lg border font-medium transition-colors ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-600 text-white hover:border-blue-500 focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 hover:border-blue-500 focus:border-blue-500'
          } outline-none`}
        >
          {symbols.map((symbol) => (
            <option key={symbol} value={symbol}>
              {symbol}
            </option>
          ))}
        </select>
      </div>

      {/* Live Price */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Current Price
          </p>
          <div className="flex items-center gap-1">
            <div className={`size-1.5 rounded-full animate-pulse ${
              isDarkMode ? 'bg-green-400' : 'bg-green-500'
            }`}></div>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold tabular-nums ${
            isDarkMode ? 'text-green-400' : 'text-green-600'
          }`}>
            ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>INR</span>
        </div>
      </div>

      {/* Strike Price and Volatility */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${
          isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Strike Price
            </p>
            <InfoTooltip 
              content="The predetermined price at which the option can be exercised"
              isDarkMode={isDarkMode}
            />
          </div>
          <p className={`text-xl font-semibold tabular-nums ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            ₹{strikePrice.toLocaleString('en-IN')}
          </p>
        </div>

        <div className={`p-4 rounded-lg ${
          isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Volatility
            </p>
            <InfoTooltip 
              content="Implied volatility indicating expected price fluctuation magnitude"
              isDarkMode={isDarkMode}
            />
          </div>
          <p className={`text-xl font-semibold tabular-nums ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {volatility.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Timestamp */}
      <div className={`flex items-center gap-2 text-sm ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        <Clock className="size-4" />
        <span>Last updated: {formatTime(lastUpdate)}</span>
      </div>
    </div>
  );
}