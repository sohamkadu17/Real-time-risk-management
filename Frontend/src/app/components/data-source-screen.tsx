import { Building2, Radio, CheckCircle2, Clock, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { getMarketStatus, getMarketSessions, MarketStatus, MarketSession } from "../../services/market";
import { useISTClock } from "../../hooks/useISTClock";

interface DataSourceScreenProps {
  isDarkMode: boolean;
  exchange: "NSE" | "BSE";
  dataMode: "live" | "simulated";
  onExchangeChange: (exchange: "NSE" | "BSE") => void;
  onDataModeChange: (mode: "live" | "simulated") => void;
}

export function DataSourceScreen({ 
  isDarkMode, 
  exchange, 
  dataMode, 
  onExchangeChange, 
  onDataModeChange 
}: DataSourceScreenProps) {
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [marketSessions, setMarketSessions] = useState<MarketSession[]>([]);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const { currentTime, isMarketHours } = useISTClock();

  useEffect(() => {
    const updateMarketData = async () => {
      try {
        const status = await getMarketStatus(exchange);
        const sessions = getMarketSessions(exchange);
        setMarketStatus(status);
        setMarketSessions(sessions);
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      }
    };

    updateMarketData();
    
    const marketInterval = setInterval(updateMarketData, 30000); // Update every 30 seconds

    return () => {
      clearInterval(marketInterval);
    };
  }, [exchange]);

  const exchanges = [
    { 
      id: "NSE" as const, 
      name: "National Stock Exchange", 
      shortName: "NSE",
      description: "India's largest stock exchange by market capitalization and trading volume",
      features: ["Equity Derivatives", "Currency Futures", "Commodity Derivatives"]
    },
    { 
      id: "BSE" as const, 
      name: "Bombay Stock Exchange", 
      shortName: "BSE",
      description: "Asia's oldest stock exchange established in 1875, now fully electronic",
      features: ["Equity Markets", "Debt Securities", "Mutual Funds"]
    },
  ];

  const dataModes = [
    {
      id: "live" as const,
      name: "Live Streaming",
      description: "Real-time market data from exchange feed with microsecond precision",
      badge: "Production"
    },
    {
      id: "simulated" as const,
      name: "Simulated Replay",
      description: "Demo mode with realistic market movements for testing and demonstration",
      badge: "Demo"
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Market Data Source Configuration
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Configure your live market data source and streaming parameters
            </p>
          </div>

          {/* Real-time Market Clock */}
          <div className={`p-4 rounded-xl border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`size-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Market Time (IST)
              </span>
            </div>
            <div className={`text-lg font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentTime}
            </div>
            <div className={`text-xs flex items-center gap-1 ${
              isMarketHours 
                ? isDarkMode ? 'text-green-400' : 'text-green-600'
                : isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              <div className={`size-1.5 rounded-full ${
                isMarketHours ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`}></div>
              {isMarketHours ? 'Market Hours' : 'After Hours'}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Live Market Status Overview */}
        {marketStatus && (
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50/50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className={`size-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {marketStatus.exchange} Market Status
                </h2>
              </div>
              
              {/* Real Data Toggle */}
              <div className="flex items-center gap-3">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Demo</span>
                <button
                  onClick={() => {
                    setIsLiveMode(!isLiveMode);
                    onDataModeChange(isLiveMode ? 'simulated' : 'live');
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isLiveMode
                      ? 'bg-green-500'
                      : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    isLiveMode ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Live</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-white/70'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`size-3 rounded-full ${
                    marketStatus.isOpen ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Market Status
                  </span>
                </div>
                <div className={`text-lg font-semibold ${
                  marketStatus.isOpen 
                    ? isDarkMode ? 'text-green-400' : 'text-green-600'
                    : isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {marketStatus.isOpen ? 'Open' : 'Closed'}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-white/70'
              }`}>
                <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Session Type
                </div>
                <div className={`text-lg font-semibold capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {marketStatus.sessionType.replace('-', ' ')}
                </div>
              </div>

              {marketStatus.nextSessionStart && (
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700/50' : 'bg-white/70'
                }`}>
                  <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Next Open
                  </div>
                  <div className={`text-sm font-semibold ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                    {marketStatus.nextSessionStart}
                  </div>
                </div>
              )}

              {marketStatus.nextSessionEnd && (
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700/50' : 'bg-white/70'
                }`}>
                  <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Session Ends
                  </div>
                  <div className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                    {marketStatus.nextSessionEnd}
                  </div>
                </div>
              )}
            </div>

            {/* Market Sessions Timeline */}
            <div className="mb-4">
              <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Trading Sessions Today
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {marketSessions.map((session, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      session.isActive
                        ? isDarkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
                        : isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        session.isActive
                          ? isDarkMode ? 'text-green-400' : 'text-green-700'
                          : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {session.name}
                      </span>
                      {session.isActive && (
                        <div className="size-2 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <div className={`text-xs ${
                      session.isActive
                        ? isDarkMode ? 'text-green-300' : 'text-green-600'
                        : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {session.start} - {session.end}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Exchange Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className={`size-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Select Exchange
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exchanges.map((ex) => (
              <button
                key={ex.id}
                onClick={() => onExchangeChange(ex.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left group hover:shadow-lg ${
                  exchange === ex.id
                    ? isDarkMode
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-blue-500 bg-blue-50'
                    : isDarkMode
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg transition-all ${
                      exchange === ex.id
                        ? isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                        : isDarkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Building2 className={`size-6 ${
                        exchange === ex.id
                          ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {ex.shortName}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {ex.name}
                      </p>
                    </div>
                  </div>
                  {exchange === ex.id && (
                    <CheckCircle2 className={`size-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  )}
                </div>
                <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {ex.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {ex.features.map((feature) => (
                    <span
                      key={feature}
                      className={`text-xs px-2 py-1 rounded-full ${
                        exchange === ex.id
                          ? isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                          : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Data Mode Toggle */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Radio className={`size-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Data Streaming Mode
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onDataModeChange(mode.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left group hover:shadow-lg ${
                  dataMode === mode.id
                    ? isDarkMode
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-purple-500 bg-purple-50'
                    : isDarkMode
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg transition-all ${
                      dataMode === mode.id
                        ? isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                        : isDarkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Radio className={`size-6 ${
                        dataMode === mode.id
                          ? isDarkMode ? 'text-purple-400' : 'text-purple-600'
                          : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {mode.name}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          mode.id === 'live'
                            ? isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                            : isDarkMode ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {mode.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                  {dataMode === mode.id && (
                    <CheckCircle2 className={`size-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  )}
                </div>
                <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {mode.description}
                </p>
                
                {mode.id === 'live' && marketStatus && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    marketStatus.isOpen 
                      ? isDarkMode ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
                      : isDarkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`size-2 rounded-full ${
                        marketStatus.isOpen ? 'bg-green-400' : 'bg-red-400'
                      }`}></div>
                      <span className={`text-xs font-medium ${
                        marketStatus.isOpen 
                          ? isDarkMode ? 'text-green-400' : 'text-green-700'
                          : isDarkMode ? 'text-red-400' : 'text-red-700'
                      }`}>
                        {marketStatus.isOpen ? 'Live data available' : 'Market closed - cached data'}
                      </span>
                    </div>
                  </div>
                )}
                
                {mode.id === 'simulated' && (
                  <div className={`mt-3 p-3 rounded-lg ${
                    isDarkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="size-2 bg-orange-400 rounded-full"></div>
                      <span className={`text-xs font-medium ${
                        isDarkMode ? 'text-orange-400' : 'text-orange-700'
                      }`}>
                        Simulated market movements for demonstration
                      </span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Configuration Summary */}
        <div className={`p-6 rounded-xl border ${
          isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Active Configuration Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-white/70'
            }`}>
              <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Selected Exchange
              </div>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {exchange}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {exchanges.find(ex => ex.id === exchange)?.name}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-white/70'
            }`}>
              <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Data Mode
              </div>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {dataMode === 'live' ? 'Live Streaming' : 'Simulated Replay'}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {dataMode === 'live' ? 'Real-time market data' : 'Demo simulation mode'}
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-white/70'
            }`}>
              <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Market Status Debug
              </div>
              <div className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {marketStatus ? (
                  <>
                    <div>Current Time: {marketStatus.currentTime}</div>
                    <div>Session: {marketStatus.sessionType}</div>
                    <div>Status: {marketStatus.isOpen ? 'Open' : 'Closed'}</div>
                    {marketStatus.debug && (
                      <>
                        <div>Day: {marketStatus.debug.day_of_week}</div>
                        <div>Hour: {marketStatus.debug.current_hour}:{marketStatus.debug.current_minute}</div>
                      </>
                    )}
                  </>
                ) : (
                  <div>Loading market status...</div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Market Status Explanation */}
        <div className={`mt-4 p-4 rounded-lg border ${
          isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
        }`}>
          <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
            📊 Market Status Information
          </h3>
          <div className={`text-xs space-y-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
            <div><strong>NSE/BSE Trading Hours:</strong> 9:15 AM - 3:30 PM IST (Monday-Friday)</div>
            <div><strong>Pre-Market:</strong> 9:00 AM - 9:15 AM IST</div>
            <div><strong>Post-Market:</strong> 3:40 PM - 4:00 PM IST</div>
            <div><strong>Note:</strong> This is a demo system. Market status shown is calculated based on IST time and may not reflect actual market conditions, holidays, or special trading sessions.</div>
          </div>
        </div>      </div>
    </div>
  );
}
