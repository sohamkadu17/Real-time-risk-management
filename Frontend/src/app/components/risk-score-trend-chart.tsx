// Risk Score Trend Chart Component
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface RiskScoreTrendChartProps {
  data: Array<{
    timestamp: string;
    score: number;
    level: string;
  }>;
  isDarkMode: boolean;
}

export function RiskScoreTrendChart({ data, isDarkMode }: RiskScoreTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`w-full h-80 rounded-lg border chart-container ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="loading-dots flex space-x-1 justify-center mb-2">
            <span className={`h-2 w-2 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} />
            <span className={`h-2 w-2 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} />
            <span className={`h-2 w-2 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} />
          </div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading risk data...</p>
        </div>
      </div>
    );
  }

  const chartData = data.slice(-50).map((item, idx) => ({
    name: `${idx}`,
    score: Math.round(item.score * 100) / 100,
    timestamp: item.timestamp
  }));

  return (
    <div className={`w-full rounded-lg border chart-container card-hover p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Risk Score Trend (Last 50)
        </h3>
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
          <div className="size-1.5 rounded-full bg-current animate-pulse" />
          Live
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDarkMode ? '#374151' : '#e5e7eb'}
          />
          <XAxis 
            stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 1]} 
            stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: isDarkMode ? '#ffffff' : '#000000'
            }}
            formatter={(value: any) => [value.toFixed(3), "Risk Score"]}
          />
          <Legend 
            wrapperStyle={{
              color: isDarkMode ? '#d1d5db' : '#374151'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#3b82f6" 
            dot={false}
            isAnimationActive={true}
            animationDuration={300}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
