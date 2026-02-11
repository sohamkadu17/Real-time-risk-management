import { useSettings } from '../contexts/settings-context';
import { toast } from '../components/ui/toast-notifications';

/**
 * Quick preferences hook for common settings operations
 * Provides simplified access to frequently used settings with built-in notifications
 */
export function usePreferences() {
  const { settings, updateSetting, updateNestedSetting } = useSettings();

  // Quick theme switcher
  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSetting('theme', newTheme);
    toast.info('Theme switched', `Now using ${newTheme} mode`);
  };

  // Quick sidebar toggle
  const toggleSidebar = () => {
    updateSetting('sidebarCollapsed', !settings.sidebarCollapsed);
  };

  // Quick refresh interval updater
  const setRefreshInterval = (interval: 1000 | 5000 | 10000 | 30000) => {
    updateSetting('refreshInterval', interval);
    toast.success('Refresh rate updated', `Data will update every ${interval/1000} seconds`);
  };

  // Quick alert toggle
  const toggleAlerts = () => {
    updateSetting('enableAlerts', !settings.enableAlerts);
    toast.info(
      settings.enableAlerts ? 'Alerts disabled' : 'Alerts enabled',
      settings.enableAlerts ? 'You won\'t receive notifications' : 'You\'ll now receive notifications'
    );
  };

  // Exchange switcher
  const switchExchange = (exchange: 'NSE' | 'BSE') => {
    updateSetting('preferredExchange', exchange);
    toast.info('Exchange updated', `Now using ${exchange} as default`);
  };

  // Data mode switcher
  const switchDataMode = (mode: 'live' | 'simulated') => {
    updateSetting('dataMode', mode);
    toast.info('Data mode updated', `Now using ${mode} data`);
  };

  return {
    // Settings
    settings,
    
    // Quick actions
    toggleTheme,
    toggleSidebar,
    toggleAlerts,
    setRefreshInterval,
    switchExchange,
    switchDataMode,
    
    // Advanced
    updateSetting,
    updateNestedSetting,
  };
}