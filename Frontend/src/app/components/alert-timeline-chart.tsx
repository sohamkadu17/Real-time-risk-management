// Alert Timeline Chart Component
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AlertTimelineChartProps {
  data: Array<{
    timestamp: string;
    severity: string;
    count: number;
  }>;
  isDarkMode: boolean;
}

const SEVERITY_COLORS = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e"
};

export function AlertTimelineChart({ data, isDarkMode }: AlertTimelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`w-full h-80 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex items-center justify-center`}>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No alert data available</p>
      </div>
    );
  }

  const chartData = data.slice(-24).map((item, idx) => ({
    name: `${idx}h`,
    critical: item.severity === 'critical' ? item.count : 0,
    high: item.severity === 'high' ? item.count : 0,
    medium: item.severity === 'medium' ? item.count : 0,
    low: item.severity === 'low' ? item.count : 0,
  }));

  return (
    <div className={`w-full rounded-lg border chart-container card-hover p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Alert Activity Timeline (Last 24 Hours)
        </h3>
        <div className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
          24h view
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDarkMode ? '#374151' : '#e5e7eb'}
          />
          <XAxis 
            stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
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
            formatter={(value: any) => [`${value} alerts`, ""]}
          />
          <Legend 
            wrapperStyle={{
              color: isDarkMode ? '#d1d5db' : '#374151',
              paddingTop: '20px'
            }}
          />
          <Bar dataKey="critical" stackId="a" fill={SEVERITY_COLORS.critical} />
          <Bar dataKey="high" stackId="a" fill={SEVERITY_COLORS.high} />
          <Bar dataKey="medium" stackId="a" fill={SEVERITY_COLORS.medium} />
          <Bar dataKey="low" stackId="a" fill={SEVERITY_COLORS.low} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
