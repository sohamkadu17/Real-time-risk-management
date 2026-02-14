// Loading skeleton components for various UI elements
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
      style={{
        animation: 'shimmer 2s ease-in-out infinite'
      }}
    />
  );
}

// Card skeleton for loading states
export function CardSkeleton({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className={`rounded-xl p-6 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className={`h-6 w-24 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <Skeleton className={`h-2 w-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </div>
      <Skeleton className={`h-20 w-full mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <Skeleton className={`h-4 w-full mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <Skeleton className={`h-3 w-3/4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
  );
}

// Chart skeleton for loading states
export function ChartSkeleton({ isDarkMode, title }: { isDarkMode: boolean; title: string }) {
  return (
    <div className={`w-full rounded-lg border p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        <Skeleton className={`h-4 w-16 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      </div>
      <div className="relative">
        <Skeleton className={`h-80 w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className="absolute inset-4 flex items-center justify-center">
          <div className="flex space-x-2">
            <div className={`h-3 w-3 rounded-full animate-pulse ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} />
            <div className={`h-3 w-3 rounded-full animate-pulse ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ animationDelay: '0.2s' }} />
            <div className={`h-3 w-3 rounded-full animate-pulse ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Add shimmer animation CSS
export const shimmerStyles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;