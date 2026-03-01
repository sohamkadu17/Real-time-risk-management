import { Gauge, Zap, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { InfoTooltip } from "./info-tooltip";
import api, { RiskData } from "../../services/api";

interface RiskMetricCardProps {
  isDarkMode: boolean;
  onDeltaChange: (delta: number) => void;
  riskData?: RiskData | null;
}

export function RiskMetricCard({ isDarkMode, onDeltaChange, riskData }: RiskMetricCardProps) {
  const [delta, setDelta] = useState(0.6523);
  const [riskScore, setRiskScore] = useState(0.562);
  const [riskLevel, setRiskLevel] = useState("medium");

  // Update with real risk data when available
  useEffect(() => {
    if (riskData) {
      setRiskScore(riskData.risk_score);
      setRiskLevel(riskData.risk_level);
      // Use real Black-76 delta from features if present; fall back to risk_score
      const realDelta = riskData.features?.delta as number | undefined;
      const deltaVal = realDelta !== undefined ? realDelta : riskData.risk_score;
      setDelta(deltaVal);
      onDeltaChange(deltaVal);
    }
  }, [riskData, onDeltaChange]);

  // Simulate delta updates when no real data
  useEffect(() => {
    if (riskData) return; // Skip simulation if we have real data
    
    const interval = setInterval(() => {
      setDelta(prev => {
        const change = (Math.random() - 0.5) * 0.05;
        const newValue = prev + change;
        const newDelta = parseFloat(Math.max(0, Math.min(1, newValue)).toFixed(4));
        onDeltaChange(newDelta);
        return newDelta;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [onDeltaChange, riskData]);

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      case 'high':
        return isDarkMode ? 'text-orange-400' : 'text-orange-600';
      case 'medium':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      case 'low':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical':
        return isDarkMode ? 'from-red-500/10 to-red-500/5' : 'from-red-50 to-red-50/50';
      case 'high':
        return isDarkMode ? 'from-orange-500/10 to-orange-500/5' : 'from-orange-50 to-orange-50/50';
      case 'medium':
        return isDarkMode ? 'from-yellow-500/10 to-yellow-500/5' : 'from-yellow-50 to-yellow-50/50';
      case 'low':
        return isDarkMode ? 'from-green-500/10 to-green-500/5' : 'from-green-50 to-green-50/50';
      default:
        return isDarkMode ? 'from-gray-500/10 to-gray-500/5' : 'from-gray-50 to-gray-50/50';
    }
  };

  return (
    <div className={`rounded-xl p-6 shadow-lg ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      {/* Card Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className={`size-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h2 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Risk Assessment
          </h2>
          <InfoTooltip 
            content="Real-time risk score based on market conditions and entity features"
            isDarkMode={isDarkMode}
          />
        </div>
        <div className="flex items-center gap-1">
          <Zap className={`size-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
          <span className={`text-xs font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            Live
          </span>
        </div>
      </div>

      {/* Risk Score */}
      <div className="flex items-center gap-2 mb-4">
        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Current Risk Score
        </p>
        <div className={`size-1.5 rounded-full animate-pulse ${
          isDarkMode ? 'bg-purple-400' : 'bg-purple-500'
        }`}></div>
      </div>

      {/* Risk Score Value - Main Highlight */}
      <div className={`p-8 rounded-lg mb-6 text-center bg-gradient-to-br ${getRiskBgColor(riskLevel)} border ${
        isDarkMode ? 'border-gray-700/50' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Score:
          </span>
          <span className={`text-5xl font-bold tabular-nums ${getRiskColor(riskLevel)}`}>
            {riskScore.toFixed(3)}
          </span>
        </div>
        <div className={`mt-3 text-sm font-semibold ${getRiskColor(riskLevel)}`}>
          Level: <span className="uppercase">{riskLevel}</span>
        </div>
      </div>

      {/* Supporting Information */}
      <div className={`p-4 rounded-lg ${
        isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'
      }`}>
        <div className="flex items-start gap-2">
          <div className={`flex items-center gap-2 px-2 py-1 rounded-full glass ${riskData 
            ? (isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200') 
            : (isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200')
          } border`}>
            <div className={`size-1.5 rounded-full ${riskData ? 'bg-green-500' : 'bg-blue-500'}`}></div>
            <span className={`text-xs font-medium ${riskData ? (isDarkMode ? 'text-green-400' : 'text-green-700') : (isDarkMode ? 'text-blue-400' : 'text-blue-700')}`}>
              {riskData ? 'Live Data' : 'Demo'}
            </span>
          </div>
        </div>
        {riskData && (
          <div className="mt-2">
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Entity: {riskData.entity_type}:{riskData.entity_id}
            </p>
          </div>
        )}
      </div>

      {/* Additional Context */}
      <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          Delta measures the rate of change of option price with respect to the underlying asset price
        </p>
      </div>
    </div>
  );
}