// Animated card wrapper with hover effects and loading states
import React, { ReactNode, useState } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  isDarkMode?: boolean;
  hoverEffect?: boolean;
  loading?: boolean;
}

export function AnimatedCard({ 
  children, 
  className = '', 
  isDarkMode = false,
  hoverEffect = true,
  loading = false
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyles = `
    rounded-xl border transition-all duration-300 ease-in-out glass
    ${isDarkMode 
      ? 'bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-purple-500/20' 
      : 'bg-gradient-to-br from-white/80 to-purple-50/40 border-purple-200/30'
    }
    ${hoverEffect ? 'hover-lift hover-glow cursor-pointer' : ''}
    ${loading ? 'animate-pulse' : 'animate-fade-in-scale'}
  `;

  const shadowStyles = hoverEffect && isHovered
    ? 'shadow-2xl shadow-purple-500/20'
    : isDarkMode
      ? 'shadow-lg shadow-purple-900/10'
      : 'shadow-lg shadow-purple-900/5';

  return (
    <div
      className={`${baseStyles} ${shadowStyles} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
}

// Enhanced metric card with animations
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  isDarkMode?: boolean;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  isDarkMode = false,
  loading = false
}: MetricCardProps) {
  if (loading) {
    return (
      <AnimatedCard isDarkMode={isDarkMode} loading>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`h-4 w-20 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <div className={`h-6 w-6 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          </div>
          <div className={`h-8 w-24 rounded mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-3 w-16 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>
      </AnimatedCard>
    );
  }

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: isDarkMode ? 'text-gray-400' : 'text-gray-500'
  };

  return (
    <AnimatedCard isDarkMode={isDarkMode} className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {title}
        </h3>
        {icon && (
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <p className={`text-2xl font-bold tabular-nums ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </p>
        
        <div className="flex items-center gap-2">
          {subtitle && (
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {subtitle}
            </span>
          )}
          {trend && trendValue && (
            <span className={`text-xs font-medium ${trendColors[trend]}`}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
            </span>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
}