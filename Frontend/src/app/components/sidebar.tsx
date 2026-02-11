import { LayoutDashboard, Radio, Gauge, Database, Info, ChevronLeft, ChevronRight, Home, Settings } from "lucide-react";

interface SidebarProps {
  isDarkMode: boolean;
  isCollapsed: boolean;
  activeView: string;
  onToggleCollapse: () => void;
  onNavigate: (view: string) => void;
}

const menuItems = [
  { id: "landing", label: "Home", icon: Home },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "market-feed", label: "Market Feed", icon: Radio },
  { id: "risk-metrics", label: "Risk Metrics", icon: Gauge },
  { id: "data-source", label: "Data Source", icon: Database },
  { id: "about", label: "About", icon: Info },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ isDarkMode, isCollapsed, activeView, onToggleCollapse, onNavigate }: SidebarProps) {
  return (
    <div className={`h-screen border-r flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      {/* Logo/Header */}
      <div className={`p-4 border-b flex items-center ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      } ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <LayoutDashboard className={`size-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Risk Dashboard
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg transition-colors ${
            isDarkMode 
              ? 'hover:bg-gray-800 text-gray-400 hover:text-white' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
          } ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? isDarkMode 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                    : isDarkMode
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="size-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <p className="font-medium mb-1">Hackathon 2026</p>
            <p>Real-Time Risk Analytics</p>
          </div>
        </div>
      )}
    </div>
  );
}
