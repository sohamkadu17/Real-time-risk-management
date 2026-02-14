import { useState, useEffect } from "react";
import { Sidebar } from "./components/sidebar";
import { DashboardScreen } from "./components/dashboard-screen";
import { MarketFeedScreen } from "./components/market-feed-screen";
import { RiskMetricsScreen } from "./components/risk-metrics-screen";
import { DataSourceScreen } from "./components/data-source-screen";
import { AboutScreen } from "./components/about-screen";
import { SettingsScreen } from "./components/settings-screen";
import { LandingPage } from "./components/landing-page";
import { ToastProvider } from "./components/ui/toast";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { ConnectionStatus } from "./components/ui/connection-status";
import { ToastManager } from "./components/ui/toast-notifications";
import { SettingsProvider, useSettings, useTheme } from "./contexts/settings-context";
import { useKeyboardShortcuts, ShortcutsModal } from "./components/ui/keyboard-shortcuts";
import { HelpModal } from "./components/ui/help-system";
import { DataExporter } from "./components/ui/data-export";
import api, { RiskData } from "../services/api";

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

function AppContent() {
  const { settings } = useSettings();
  const { isDark } = useTheme();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(settings.sidebarCollapsed);
  const [activeView, setActiveView] = useState(settings.defaultView);
  const [exchange, setExchange] = useState<"NSE" | "BSE">(settings.preferredExchange);
  const [dataMode, setDataMode] = useState<"live" | "simulated">(settings.dataMode);
  const [currentPrice, setCurrentPrice] = useState(21453.75);
  const [currentDelta, setCurrentDelta] = useState(0.6523);
  const [riskData, setRiskData] = useState<RiskData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [latestRisk, setLatestRisk] = useState<RiskData | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpSection, setHelpSection] = useState<string>();
  
  // Update local state when settings change
  useEffect(() => {
    setIsSidebarCollapsed(settings.sidebarCollapsed);
    setExchange(settings.preferredExchange);
    setDataMode(settings.dataMode);
  }, [settings]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize WebSocket connection and fetch initial data
  useEffect(() => {
    // Only initialize connection if not on landing page
    if (showLanding) return;
    
    const initializeConnection = async () => {
      try {
        setConnectionError(null);
        
        // Connect WebSocket with enhanced error handling
        api.on("connected", () => {
          setIsConnected(true);
          setConnectionError(null);
        });
        
        api.on("disconnected", () => {
          setIsConnected(false);
        });
        
        api.on("error", (error: any) => {
          setIsConnected(false);
          setConnectionError(error?.message || "Connection error");
        });
        
        api.on("risk-update", (data: RiskData) => {
          setLatestRisk(data);
          setRiskData((prev) => [data, ...prev].slice(0, 50)); // Keep last 50 risks
        });

        await api.connectWebSocket();
        
        // Fetch initial risk data with retry
        const initialRisks = await api.getLiveRisks(10);
        setRiskData(initialRisks);
      } catch (error) {
        console.error("Failed to initialize connection:", error);
        setConnectionError(error instanceof Error ? error.message : "Failed to connect");
      }
    };

    initializeConnection();

    // Cleanup on unmount
    return () => {
      api.disconnectWebSocket();
    };
  }, [showLanding]);

  const handleThemeToggle = () => {
    // Theme is now managed by settings context
    console.log('Theme toggle - use Settings screen instead');
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNavigate = (view: string) => {
    if (view === "landing") {
      setShowLanding(true);
    } else {
      setActiveView(view);
    }
  };

  const handlePriceChange = (price: number) => {
    setCurrentPrice(price);
  };

  const handleDeltaChange = (delta: number) => {
    setCurrentDelta(delta);
  };

  const handleExchangeChange = (newExchange: "NSE" | "BSE") => {
    setExchange(newExchange);
  };

  const handleDataModeChange = (mode: "live" | "simulated") => {
    setDataMode(mode);
  };

  const handleGetStarted = () => {
    setShowLanding(false);
    setActiveView("dashboard");
  };

  // Keyboard shortcuts setup
  const { showShortcuts: showShortcutsModal, setShowShortcuts: setShowShortcutsModal } = useKeyboardShortcuts(
    // onRefresh
    () => {
      if (!showLanding) {
        // Refresh current data
        switch (activeView) {
          case 'dashboard':
          case 'market-feed':
            api.getLiveRisks(10).then(setRiskData).catch(console.error);
            break;
        }
      }
    },
    // onExport 
    () => {
      if (!showLanding && riskData.length > 0) {
        DataExporter.exportRiskData(riskData);
      }
    },
    // onToggleDarkMode - handled by settings context
    undefined,
    // onToggleNotifications - handled by settings context  
    undefined,
    // onSearch
    () => {
      // Could implement search functionality
      console.log('Search triggered');
    },
    // onConnectWebSocket
    () => {
      if (!showLanding) {
        if (isConnected) {
          api.disconnectWebSocket();
        } else {
          api.connectWebSocket();
        }
      }
    },
    // onNavigate
    (view: string) => {
      if (view === 'landing') {
        setShowLanding(true);
      } else {
        setShowLanding(false);
        setActiveView(view);
      }
    },
    showLanding // disable shortcuts on landing page
  );

  // Show help modal
  const handleShowHelp = (section?: string) => {
    setHelpSection(section);
    setShowHelp(true);
  };

  // Show landing page
  if (showLanding) {
    return (
      <ErrorBoundary>
        <ToastProvider>
          <div className={`${isDark ? 'dark' : ''} transition-all duration-300`}>
            <LandingPage isDarkMode={isDark} onGetStarted={handleGetStarted} />
          </div>
        </ToastProvider>
      </ErrorBoundary>
    );
  }

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <DashboardScreen
            isDarkMode={isDark}
            exchange={exchange}
            dataMode={dataMode}
            currentPrice={currentPrice}
            currentDelta={currentDelta}
            onThemeToggle={handleThemeToggle}
            onPriceChange={handlePriceChange}
            onDeltaChange={handleDeltaChange}
            riskData={latestRisk}
            isConnected={isConnected}
            allRiskData={riskData}
            onShowHelp={handleShowHelp}
          />
        );
      case "market-feed":
        return <MarketFeedScreen isDarkMode={isDark} exchange={exchange} />;
      case "risk-metrics":
        return <RiskMetricsScreen isDarkMode={isDark} />;
      case "data-source":
        return (
          <DataSourceScreen
            isDarkMode={isDark}
            exchange={exchange}
            dataMode={dataMode}
            onExchangeChange={handleExchangeChange}
            onDataModeChange={handleDataModeChange}
          />
        );
      case "about":
        return <AboutScreen isDarkMode={isDark} />;
      case "settings":
        return <SettingsScreen isDarkMode={isDark} />;
      default:
        return (
          <DashboardScreen
            isDarkMode={isDark}
            exchange={exchange}
            dataMode={dataMode}
            currentPrice={currentPrice}
            currentDelta={currentDelta}
            onThemeToggle={handleThemeToggle}
            onPriceChange={handlePriceChange}
            onDeltaChange={handleDeltaChange}
            riskData={latestRisk}
            isConnected={isConnected}
            allRiskData={riskData}
            onShowHelp={handleShowHelp}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className={`${isDark ? 'dark' : ''} transition-all duration-300`}>
          <div className={`flex h-screen overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-br from-slate-900 to-slate-800' 
              : 'bg-gradient-to-br from-purple-50 to-blue-50'
          }`}>
            {/* Enhanced Sidebar */}
            <div className={`transition-all duration-300 glass ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
              <Sidebar
                isDarkMode={isDark}
                isCollapsed={isSidebarCollapsed}
                activeView={activeView}
                onToggleCollapse={handleSidebarToggle}
                onNavigate={handleNavigate}
              />
            </div>

            {/* Main Content with Animation */}
            <main className="flex-1 overflow-y-auto">
              {/* Top bar with connection status */}
              <div className={`h-16 border-b flex items-center justify-between px-6 backdrop-blur-lg ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-gray-200'
              }`}>
                <h1 className={`text-xl font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {activeView === 'dashboard' && 'Risk Dashboard'}
                  {activeView === 'market-feed' && 'Live Market Feed'}
                  {activeView === 'risk-metrics' && 'Risk Analytics'}
                  {activeView === 'data-source' && 'Data Configuration'}
                  {activeView === 'about' && 'About RiskGuard'}
                  {activeView === 'settings' && 'Settings & Preferences'}
                </h1>
                
                <ConnectionStatus isDarkMode={isDark} />
              </div>
              
              <div className="p-8 animate-fade-in enhanced-card">
                <ErrorBoundary fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <p className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Component failed to load
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Please refresh the page or try again
                      </p>
                    </div>
                  </div>
                }>
                  {renderContent()}
                </ErrorBoundary>
              </div>
            </main>
          </div>
          
          {/* Toast Notifications */}
          <ToastManager isDarkMode={isDark} />
          
          {/* Keyboard Shortcuts Modal */}
          <ShortcutsModal
            isOpen={showShortcutsModal}
            onClose={() => setShowShortcutsModal(false)}
            isDarkMode={isDark}
          />
          
          {/* Help System Modal */}
          <HelpModal
            isOpen={showHelp}
            onClose={() => setShowHelp(false)}
            section={helpSection as any}
            isDarkMode={isDark}
          />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}
