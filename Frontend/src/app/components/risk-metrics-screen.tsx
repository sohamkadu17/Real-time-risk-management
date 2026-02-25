import { Gauge, TrendingUp, Activity, Pause, Play, Brain, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { RiskScoreTrendChart } from "./risk-score-trend-chart";
import { RiskLevelDistributionChart } from "./risk-distribution-chart";
import { AlertTimelineChart } from "./alert-timeline-chart";
import { CardSkeleton, ChartSkeleton } from "./ui/loading";
import { AnimatedCard, MetricCard } from "./ui/animated-card";
import { useToast } from "./ui/toast";

interface RiskMetricsScreenProps {
  isDarkMode: boolean;
}

interface GreekMetric {
  name: string;
  symbol: string;
  value: number;
  description: string;
  range: string;
}

interface RiskData {
  timestamp: string;
  score: number;
  level: string;
}

interface RiskLevelCount {
  level: string;
  count: number;
}

interface AlertData {
  timestamp: string;
  severity: string;
  count: number;
}

export function RiskMetricsScreen({ isDarkMode }: RiskMetricsScreenProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [greeks, setGreeks] = useState<GreekMetric[]>([
    {
      name: "Delta",
      symbol: "Δ",
      value: 0.6523,
      description: "Rate of change of option price with respect to underlying price",
      range: "0 to 1 (Call), -1 to 0 (Put)"
    },
    {
      name: "Gamma",
      symbol: "Γ",
      value: 0.0234,
      description: "Rate of change of delta with respect to underlying price",
      range: "Always positive"
    },
    {
      name: "Vega",
      symbol: "ν",
      value: 0.1845,
      description: "Sensitivity to volatility changes",
      range: "Always positive"
    },
    {
      name: "Theta",
      symbol: "Θ",
      value: -0.0523,
      description: "Time decay of option value",
      range: "Usually negative"
    },
    {
      name: "Rho",
      symbol: "ρ",
      value: 0.0412,
      description: "Sensitivity to interest rate changes",
      range: "Positive (Call), Negative (Put)"
    },
  ]);

  // Chart data states
  const [riskScoreData, setRiskScoreData] = useState<RiskData[]>([]);
  const [riskLevelCounts, setRiskLevelCounts] = useState<RiskLevelCount[]>([
    { level: "critical", count: 0 },
    { level: "high", count: 0 },
    { level: "medium", count: 0 },
    { level: "low", count: 0 }
  ]);
  const [alertData, setAlertData] = useState<AlertData[]>([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setChartsLoading(false);
      showToast({
        type: 'success',
        title: 'Risk Metrics Loaded',
        message: 'Real-time data streaming active'
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [showToast]);

  // Update Greeks values
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setGreeks(prev => prev.map(greek => ({
        ...greek,
        value: greek.name === "Theta" 
          ? parseFloat((greek.value + (Math.random() - 0.5) * 0.01).toFixed(4))
          : parseFloat((Math.max(0, greek.value + (Math.random() - 0.5) * 0.02)).toFixed(4))
      })));
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Generate risk score trend data (simulated from backend)
  useEffect(() => {
    const interval = setInterval(() => {
      setRiskScoreData(prev => {
        const newScore = Math.random();
        const riskLevel = 
          newScore >= 0.8 ? "critical" :
          newScore >= 0.6 ? "high" :
          newScore >= 0.4 ? "medium" :
          "low";

        const newData = [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          score: newScore,
          level: riskLevel
        }];

        // Keep only last 50 scores
        return newData.slice(-50);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update risk level distribution
  useEffect(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    
    riskScoreData.forEach(data => {
      counts[data.level as keyof typeof counts]++;
    });

    setRiskLevelCounts([
      { level: "critical", count: counts.critical },
      { level: "high", count: counts.high },
      { level: "medium", count: counts.medium },
      { level: "low", count: counts.low }
    ]);
  }, [riskScoreData]);

  // Generate alert timeline data (simulated)
  useEffect(() => {
    const generateAlertData = () => {
      const data: AlertData[] = [];
      for (let i = 0; i < 24; i++) {
        data.push({
          timestamp: `${i}h`,
          severity: ["critical", "high", "medium", "low"][Math.floor(Math.random() * 4)],
          count: Math.floor(Math.random() * 10)
        });
      }
      setAlertData(data);
    };

    generateAlertData();
    const interval = setInterval(generateAlertData, 5000);

    return () => clearInterval(interval);
  }, []);

  // AI Explanation generator
  const generateAIExplanation = () => {
    const currentRisk = riskScoreData[riskScoreData.length - 1];
    const avgDelta = greeks.find(g => g.name === "Delta")?.value || 0;
    const avgGamma = greeks.find(g => g.name === "Gamma")?.value || 0;
    const avgVega = greeks.find(g => g.name === "Vega")?.value || 0;
    
    const explanation = `**Current Market Analysis**

Based on the latest risk assessment${currentRisk ? ` (Risk Score: ${(currentRisk.score * 100).toFixed(1)}%)` : ''}, here's what the data tells us:

🎯 **Options Greeks Analysis:**
• Delta (${avgDelta.toFixed(4)}): ${Math.abs(avgDelta) > 0.5 ? 'High sensitivity to price movements - significant profit/loss potential' : 'Moderate price sensitivity - balanced risk exposure'}
• Gamma (${avgGamma.toFixed(4)}): ${avgGamma > 0.03 ? 'High gamma suggests rapid delta changes near expiration' : 'Stable delta behavior expected'}
• Vega (${avgVega.toFixed(4)}): ${avgVega > 0.15 ? 'High volatility sensitivity - watch for vol crush/expansion' : 'Low vol sensitivity - stable pricing environment'}

📊 **Risk Distribution:**
${riskLevelCounts.map(level => `• ${level.level.charAt(0).toUpperCase() + level.level.slice(1)}: ${level.count} occurrences`).join('\n')}

💡 **AI Recommendation:**
${currentRisk?.level === 'critical' ? '🚨 Consider reducing exposure and implementing hedging strategies.' :
currentRisk?.level === 'high' ? '⚠️ Monitor positions closely and prepare risk mitigation measures.' :
currentRisk?.level === 'medium' ? '✅ Maintain current strategy with regular monitoring.' :
'🟢 Favorable risk environment - consider strategic position increases.'}

🔄 **Market Regime:** Based on Greeks patterns, we're in a ${avgVega > 0.15 ? 'high volatility' : avgGamma > 0.03 ? 'gamma-sensitive' : 'stable'} regime.`;
    
    setAiExplanation(explanation);
    setShowAIExplanation(true);
    
    showToast({
      type: 'info',
      title: 'AI Analysis Complete',
      message: 'Generated intelligent risk insights'
    });
  };

  return (
    <div className="max-w-7xl">
      {/* Header with Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Risk Metrics & Analytics
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Real-time risk assessment with options Greeks and risk distribution analytics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={generateAIExplanation}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isDarkMode
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
            }`}
          >
            <Brain className="size-4" />
            AI Insights
          </button>
          
          <button
            onClick={() => {
              setIsPaused(!isPaused);
              showToast({
                type: 'info',
                title: isPaused ? 'Resumed Updates' : 'Paused Updates',
                message: isPaused ? 'Real-time data streaming resumed' : 'Data updates paused'
              });
            }}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm'
              }
              hover:scale-105 active:scale-95
            `}
          >
            {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className={`size-2 rounded-full animate-pulse ${
              isPaused ? (isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500') : (isDarkMode ? 'bg-green-400' : 'bg-green-500')
            }`} />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {isPaused ? 'Paused' : 'Live'}
            </span>
          </div>
        </div>
      </div>

      {/* Greeks Grid with Loading States */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {isLoading 
          ? Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} isDarkMode={isDarkMode} />
            ))
          : greeks.map((greek, index) => (
              <AnimatedCard
                key={greek.name}
                isDarkMode={isDarkMode}
                className={`p-6 transform transition-all duration-300 ${
                  isLoading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Gauge className={`size-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {greek.name}
                    </h3>
                  </div>
                  <div className={`size-1.5 rounded-full ${
                    isPaused 
                      ? (isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500')
                      : (isDarkMode ? 'bg-green-400 animate-pulse' : 'bg-green-500 animate-pulse')
                  }`} />
                </div>

                <div className={`p-4 rounded-lg mb-4 transition-all duration-300 hover:scale-105 ${
                  isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {greek.symbol} =
                    </span>
                    <span className={`text-3xl font-bold tabular-nums transition-all duration-500 ${
                      greek.value < 0
                        ? 'text-red-500'
                        : isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {greek.value.toFixed(4)}
                    </span>
                  </div>
                </div>

                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {greek.description}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Range: {greek.range}
                </p>
              </AnimatedCard>
            ))
        }
      </div>

      {/* Charts Section with Loading States */}
      <div className="mb-8">
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Risk Analysis & Trends
        </h2>
        
        {/* Risk Score Trend Chart */}
        <div className="mb-6">
          {chartsLoading ? (
            <ChartSkeleton 
              isDarkMode={isDarkMode} 
              title="Risk Score Trend (Last 50)"
            />
          ) : (
            <div className="transform transition-all duration-500 opacity-100">
              <RiskScoreTrendChart data={riskScoreData} isDarkMode={isDarkMode} />
            </div>
          )}
        </div>

        {/* Distribution and Timeline Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            {chartsLoading ? (
              <ChartSkeleton 
                isDarkMode={isDarkMode} 
                title="Risk Level Distribution"
              />
            ) : (
              <div className="transform transition-all duration-500 opacity-100" style={{ transitionDelay: '200ms' }}>
                <RiskLevelDistributionChart data={riskLevelCounts} isDarkMode={isDarkMode} />
              </div>
            )}
          </div>
          <div>
            {chartsLoading ? (
              <ChartSkeleton 
                isDarkMode={isDarkMode} 
                title="Alert Activity Timeline (Last 24 Hours)"
              />
            ) : (
              <div className="transform transition-all duration-500 opacity-100" style={{ transitionDelay: '400ms' }}>
                <AlertTimelineChart data={alertData} isDarkMode={isDarkMode} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Summary Card */}
      <AnimatedCard 
        isDarkMode={isDarkMode}
        className={`p-6 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20' 
            : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
            <Activity className={`size-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              About Risk Analytics
            </h3>
            <p className={`text-sm mb-3 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              This dashboard provides comprehensive risk metrics computed using the Black-76 model. 
              The Greeks show sensitivity to various market factors, while the distribution charts 
              illustrate the spread of risk levels across your portfolio and recent alert activity.
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              All metrics update in real-time as new risk assessments are computed from streaming data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
            }`}>
              {riskScoreData.length} records
            </div>
          </div>
        </div>
      </AnimatedCard>
      
      {/* AI Explanation Modal */}
      {showAIExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`max-w-2xl w-full rounded-xl border shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Brain className="size-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI Risk Analysis
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Intelligent insights powered by risk analytics
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAIExplanation(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                ×
              </button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className={`text-sm whitespace-pre-line leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {aiExplanation || "Generating AI insights..."}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Lightbulb className="size-4" />
                <span>Powered by advanced risk analytics</span>
              </div>
              <button
                onClick={() => setShowAIExplanation(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
