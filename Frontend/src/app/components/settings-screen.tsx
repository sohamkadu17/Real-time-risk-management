import { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Layout, 
  Bell, 
  Database, 
  Monitor,
  Download,
  Upload,
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import { useSettings } from '../contexts/settings-context';
import { toast } from './ui/toast-notifications';

interface SettingsScreenProps {
  isDarkMode: boolean;
}

export function SettingsScreen({ isDarkMode }: SettingsScreenProps) {
  const { settings, updateSetting, updateNestedSetting, resetSettings, exportSettings, importSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('appearance');
  const [importText, setImportText] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'performance', label: 'Performance', icon: Monitor },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'data', label: 'Data Sources', icon: Database },
  ];

  const handleExport = () => {
    const settingsJson = exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'riskguard-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported successfully', 'Settings have been downloaded as JSON file');
  };

  const handleImport = () => {
    if (importSettings(importText)) {
      setShowImportDialog(false);
      setImportText('');
      toast.success('Settings imported successfully', 'Your preferences have been restored');
    } else {
      toast.error('Import failed', 'Invalid settings format or corrupted data');
    }
  };

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Theme
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'auto'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => {
                updateSetting('theme', theme);
                toast.info('Theme updated', `Switched to ${theme} mode`);
              }}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                settings.theme === theme
                  ? isDarkMode 
                    ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                    : 'border-teal-500 bg-teal-50 text-teal-700'
                  : isDarkMode
                    ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Accent Color
        </label>
        <div className="grid grid-cols-5 gap-3">
          {(['teal', 'blue', 'purple', 'green', 'orange'] as const).map((color) => (
            <button
              key={color}
              onClick={() => {
                updateSetting('accentColor', color);
                toast.success('Accent color changed', `Now using ${color} theme`);
              }}
              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                settings.accentColor === color
                  ? 'border-gray-900 dark:border-white scale-110'
                  : 'border-transparent hover:scale-105'
              } ${
                color === 'teal' ? 'bg-teal-500' :
                color === 'blue' ? 'bg-blue-500' :
                color === 'purple' ? 'bg-purple-500' :
                color === 'green' ? 'bg-green-500' :
                'bg-orange-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderLayoutTab = () => (
    <div className="space-y-6">
      <div>
        <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Default View
        </label>
        <select
          value={settings.defaultView}
          onChange={(e) => updateSetting('defaultView', e.target.value as any)}
          className={`w-full p-3 rounded-lg border ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="dashboard">Dashboard</option>
          <option value="market-feed">Market Feed</option>
          <option value="risk-metrics">Risk Metrics</option>
          <option value="data-source">Data Sources</option>
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Dashboard Layout
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['compact', 'comfortable', 'spacious'] as const).map((layout) => (
            <button
              key={layout}
              onClick={() => updateSetting('dashboardLayout', layout)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                settings.dashboardLayout === layout
                  ? isDarkMode 
                    ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                    : 'border-teal-500 bg-teal-50 text-teal-700'
                  : isDarkMode
                    ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {layout.charAt(0).toUpperCase() + layout.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Collapse Sidebar by Default
          </label>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Start with sidebar collapsed
          </p>
        </div>
        <button
          onClick={() => updateSetting('sidebarCollapsed', !settings.sidebarCollapsed)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.sidebarCollapsed ? 'bg-teal-500' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.sidebarCollapsed ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <div>
        <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Refresh Interval
        </label>
        <select
          value={settings.refreshInterval}
          onChange={(e) => updateSetting('refreshInterval', Number(e.target.value) as any)}
          className={`w-full p-3 rounded-lg border ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value={1000}>Every 1 second (Real-time)</option>
          <option value={5000}>Every 5 seconds (Recommended)</option>
          <option value={10000}>Every 10 seconds (Balanced)</option>
          <option value={30000}>Every 30 seconds (Conservative)</option>
        </select>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Maximum Data Points
        </label>
        <select
          value={settings.maxDataPoints}
          onChange={(e) => updateSetting('maxDataPoints', Number(e.target.value) as any)}
          className={`w-full p-3 rounded-lg border ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value={50}>50 points (Fast)</option>
          <option value={100}>100 points (Recommended)</option>
          <option value={200}>200 points (Detailed)</option>
          <option value={500}>500 points (Comprehensive)</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Auto-refresh Data
          </label>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Automatically update data based on refresh interval
          </p>
        </div>
        <button
          onClick={() => updateSetting('autoRefresh', !settings.autoRefresh)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.autoRefresh ? 'bg-teal-500' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.autoRefresh ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Enable Alerts
          </label>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Show notifications for system events
          </p>
        </div>
        <button
          onClick={() => updateSetting('enableAlerts', !settings.enableAlerts)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.enableAlerts ? 'bg-teal-500' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.enableAlerts ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {settings.enableAlerts && (
        <>
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Risk Threshold
            </label>
            <select
              value={settings.riskThreshold}
              onChange={(e) => updateSetting('riskThreshold', e.target.value as any)}
              className={`w-full p-3 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="low">Low Risk (Alert more often)</option>
              <option value="medium">Medium Risk (Recommended)</option>
              <option value="high">High Risk (Important only)</option>
              <option value="critical">Critical Risk (Emergencies only)</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Alert Types
            </label>
            <div className="space-y-3">
              {Object.entries(settings.alertTypes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <button
                    onClick={() => updateNestedSetting(`alertTypes.${key}`, !value)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      value ? 'bg-teal-500' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <div>
        <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Preferred Exchange
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['NSE', 'BSE'] as const).map((exchange) => (
            <button
              key={exchange}
              onClick={() => updateSetting('preferredExchange', exchange)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                settings.preferredExchange === exchange
                  ? isDarkMode 
                    ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                    : 'border-teal-500 bg-teal-50 text-teal-700'
                  : isDarkMode
                    ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {exchange}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Data Mode
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['live', 'simulated'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSetting('dataMode', mode)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                settings.dataMode === mode
                  ? isDarkMode 
                    ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                    : 'border-teal-500 bg-teal-50 text-teal-700'
                  : isDarkMode
                    ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Show Advanced Metrics
          </label>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Display technical indicators and advanced statistics
          </p>
        </div>
        <button
          onClick={() => updateSetting('showAdvancedMetrics', !settings.showAdvancedMetrics)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.showAdvancedMetrics ? 'bg-teal-500' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.showAdvancedMetrics ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Settings & Preferences
        </h1>
        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Customize your RiskGuard experience and manage your preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                    activeTab === tab.id
                      ? isDarkMode
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                        : 'bg-teal-50 text-teal-700 border border-teal-200'
                      : isDarkMode
                        ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="size-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Settings Actions */}
          <div className={`mt-6 p-4 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Settings Management
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleExport}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
              >
                <Download className="size-4" />
                Export Settings
              </button>
              <button
                onClick={() => setShowImportDialog(true)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
              >
                <Upload className="size-4" />
                Import Settings
              </button>
              <button
                onClick={resetSettings}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                  isDarkMode
                    ? 'text-red-400 hover:bg-red-900/20'
                    : 'text-red-600 hover:bg-red-50'
                }`}
              >
                <RotateCcw className="size-4" />
                Reset to Default
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className={`p-6 rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {activeTab === 'appearance' && renderAppearanceTab()}
            {activeTab === 'layout' && renderLayoutTab()}
            {activeTab === 'performance' && renderPerformanceTab()}
            {activeTab === 'alerts' && renderAlertsTab()}
            {activeTab === 'data' && renderDataTab()}
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Import Settings
            </h3>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your settings JSON here..."
              className={`w-full h-32 p-3 rounded border text-sm ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleImport}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
              >
                <Check className="size-4" />
                Import
              </button>
              <button
                onClick={() => setShowImportDialog(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <X className="size-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}