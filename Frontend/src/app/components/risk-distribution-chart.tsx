// Risk Level Distribution Chart Component
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface RiskLevelDistributionChartProps {
  data: Array<{
    level: string;
    count: number;
  }>;
  isDarkMode: boolean;
}

const COLORS = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e"
};

export function RiskLevelDistributionChart({ data, isDarkMode }: RiskLevelDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`w-full h-80 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex items-center justify-center`}>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No data available</p>
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.level.charAt(0).toUpperCase() + item.level.slice(1),
    value: item.count,
    color: COLORS[item.level.toLowerCase() as keyof typeof COLORS] || '#64748b'
  }));

  return (
    <div className={`w-full rounded-lg border chart-container card-hover p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Risk Level Distribution
        </h3>
        <div className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
          {data.reduce((sum, item) => sum + item.count, 0)} total
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: isDarkMode ? '#ffffff' : '#000000'
            }}
            formatter={(value: any) => [`${value} risks`, "Count"]}
          />
          <Legend 
            wrapperStyle={{
              color: isDarkMode ? '#d1d5db' : '#374151',
              paddingTop: '20px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
