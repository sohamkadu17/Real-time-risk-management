import { Activity, Moon, Sun } from "lucide-react";

interface TopNavProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export function TopNav({ isDarkMode, onThemeToggle }: TopNavProps) {
  return (
    <nav className={`border-b ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Project Title */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <Activity className={`size-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h1 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Real-Time Market Risk Dashboard
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Hackathon Project 2026
              </p>
            </div>
          </div>

          {/* Right: Live Streaming Badge and Theme Toggle */}
          <div className="flex items-center gap-4">
            {/* Live Stream Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full glass ${isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'} border`}>
              <div className="relative">
                <div className="size-2 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 size-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className={`font-medium text-xs ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                Live Stream
              </span>
            </div>
            
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
      </div>
    </nav>
  );
}
