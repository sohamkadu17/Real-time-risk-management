import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Settings interface
export interface UserSettings {
  // Theme & Appearance
  theme: 'light' | 'dark' | 'auto';
  accentColor: 'teal' | 'blue' | 'purple' | 'green' | 'orange';
  
  // Dashboard Layout
  sidebarCollapsed: boolean;
  defaultView: 'dashboard' | 'market-feed' | 'risk-metrics' | 'data-source';
  dashboardLayout: 'compact' | 'comfortable' | 'spacious';
  
  // Data & Performance  
  refreshInterval: 1000 | 5000 | 10000 | 30000; // milliseconds
  maxDataPoints: 50 | 100 | 200 | 500;
  autoRefresh: boolean;
  
  // Alerts & Notifications
  enableAlerts: boolean;
  riskThreshold: 'low' | 'medium' | 'high' | 'critical';
  alertTypes: {
    riskUpdates: boolean;
    connectionStatus: boolean;
    marketEvents: boolean;
    systemAlerts: boolean;
  };
  
  // Market Data
  preferredExchange: 'NSE' | 'BSE';
  dataMode: 'live' | 'simulated';
  showAdvancedMetrics: boolean;
}

// Default settings
const defaultSettings: UserSettings = {
  theme: 'dark',
  accentColor: 'teal',
  sidebarCollapsed: false,
  defaultView: 'dashboard',
  dashboardLayout: 'comfortable',
  refreshInterval: 5000,
  maxDataPoints: 100,
  autoRefresh: true,
  enableAlerts: true,
  riskThreshold: 'medium',
  alertTypes: {
    riskUpdates: true,
    connectionStatus: true,
    marketEvents: false,
    systemAlerts: true,
  },
  preferredExchange: 'NSE',
  dataMode: 'simulated',
  showAdvancedMetrics: false,
};

// Settings context
interface SettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  updateNestedSetting: (path: string, value: any) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Settings provider component
interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettingsFromStorage();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveSettingsToStorage();
  }, [settings]);

  const loadSettingsFromStorage = () => {
    try {
      const savedSettings = localStorage.getItem('riskguard-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge with defaults to ensure all properties exist
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  };

  const saveSettingsToStorage = () => {
    try {
      localStorage.setItem('riskguard-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('riskguard-settings');
  };

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (settingsJson: string): boolean => {
    try {
      const parsed = JSON.parse(settingsJson);
      setSettings({ ...defaultSettings, ...parsed });
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  };

  const value: SettingsContextType = {
    settings,
    updateSetting,
    updateNestedSetting,
    resetSettings,
    exportSettings,
    importSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use settings
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Utility hook for theme detection
export function useTheme() {
  const { settings } = useSettings();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDark(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setIsDark(settings.theme === 'dark');
    }
  }, [settings.theme]);

  return { isDark, theme: settings.theme };
}