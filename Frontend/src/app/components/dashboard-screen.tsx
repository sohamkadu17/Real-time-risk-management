import { Activity, Moon, Sun } from "lucide-react";
import { MarketStatusBar } from "./market-status-bar";
import { MarketDataCard } from "./market-data-card";
import { RiskMetricCard } from "./risk-metric-card";
import { RiskInsightCard } from "./risk-insight-card";
import { RecentUpdatesCard } from "./recent-updates-card";
import { LiveStreamEvents } from "./live-stream-events";
import { ExportButton } from "./ui/data-export";
import { HelpButton } from "./ui/help-system";
import { RiskData } from "../../services/api";

interface DashboardScreenProps {
  isDarkMode: boolean;
  exchange: "NSE" | "BSE";
  dataMode: "live" | "simulated";
  currentPrice: number;
  currentDelta: number;
  onThemeToggle: () => void;
  onPriceChange: (price: number) => void;
  onDeltaChange: (delta: number) => void;
  riskData?: RiskData | null;
  isConnected?: boolean;
  allRiskData?: RiskData[];
  onShowHelp?: (section?: string) => void;
}

export function DashboardScreen({
  isDarkMode,
  exchange,
  dataMode,
  currentPrice,
  currentDelta,
  onThemeToggle,
  onPriceChange,
  onDeltaChange,
  riskData,
  isConnected = false,
  allRiskData = [],
  onShowHelp,
}: DashboardScreenProps) {
  const isMarketOpen = true; // Simplified for demo
  const dataLatency = Math.floor(Math.random() * 50) + 10; // Simulated latency
  
  // Use real risk data if available
  const riskScore = riskData?.risk_score ?? 0.562;
  const riskLevel = riskData?.risk_level ?? "medium";
  const riskFactors = riskData?.risk_factors ?? ["High transaction velocity", "Statistical anomaly"];
  const riskConfidence = riskData?.confidence ?? 0.95;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Enhanced Styling */}
      <div className="flex items-center justify-between mb-6 animate-slide-in-up">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl glass animate-pulse-glow ${
            isDarkMode ? 'bg-blue-500/20 border-blue-500/30' : 'bg-gradient-to-r from-purple-100 to-blue-100 border-purple-200'
          }`}>
            <Activity className={`size-6 ${
              isDarkMode ? 'text-blue-400' : 'text-purple-600'
            }`} />
          </div>
          <div className="animate-slide-in-left animation-delay-200">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Risk<span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">Guard</span> Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-1">
              {/* System Status Badge */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full glass ${isConnected 
                ? (isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200') 
                : (isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200')
              } border`}>
                <div className="relative">
                  <div className={`size-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className={`absolute inset-0 size-2 rounded-full ${isConnected ? 'animate-ping bg-green-500' : ''} opacity-75`}></div>
                </div>
                <span className={`text-xs font-medium ${isConnected ? (isDarkMode ? 'text-green-400' : 'text-green-700') : (isDarkMode ? 'text-red-400' : 'text-red-700')}`}>
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              
              {/* Data Mode Badge */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full glass ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border`}>
                <div className={`size-2 rounded-full ${dataMode === 'live' ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  {dataMode === 'live' ? 'Live Stream' : 'Demo Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Export Button */}
          {allRiskData.length > 0 && (
            <ExportButton
              data={allRiskData}
              exportType="risk"
              isDarkMode={isDarkMode}
              className="px-3 py-2"
            />
          )}
          
          {/* Help Button */}
          {onShowHelp && (
            <HelpButton
              section="dashboard"
              isDarkMode={isDarkMode}
              onShowHelp={onShowHelp}
            />
          )}

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </div>
      </div>

      {/* Market Status Bar */}
      <div className="mb-6">
        <MarketStatusBar
          isDarkMode={isDarkMode}
          exchange={exchange}
          isMarketOpen={isMarketOpen}
          dataLatency={dataLatency}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Main Cards */}
        <div className="xl:col-span-2 space-y-6">
          {/* Live Market Data */}
          <MarketDataCard 
            isDarkMode={isDarkMode} 
            onPriceChange={onPriceChange}
            exchange={exchange}
          />

          {/* Real-Time Risk Metric */}
          <RiskMetricCard 
            isDarkMode={isDarkMode}
            onDeltaChange={onDeltaChange}
          />
        </div>

        {/* Right Column - Supporting Panels */}
        <div className="space-y-6">
          {/* Risk Insight */}
          <RiskInsightCard 
            isDarkMode={isDarkMode}
            delta={currentDelta}
          />

          {/* Recent Updates */}
          <RecentUpdatesCard 
            isDarkMode={isDarkMode}
            currentPrice={currentPrice}
          />

          {/* Live Stream Events */}
          <LiveStreamEvents isDarkMode={isDarkMode} />
        </div>
      </div>
    </div>
  );
}
