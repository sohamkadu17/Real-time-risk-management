import { useEffect, useCallback, useState } from 'react';
import { Keyboard, Command, ArrowRight } from 'lucide-react';

// Shortcut type definitions
type ShortcutAction = 
  | { action: 'navigateTo'; target: string; description: string; }
  | { action: 'refresh' | 'export' | 'toggleDarkMode' | 'toggleNotifications' | 'closeModal' | 'showShortcuts' | 'showHelp' | 'search' | 'connectWebSocket'; description: string; };

// Keyboard shortcut definitions
export const KEYBOARD_SHORTCUTS: Record<string, ShortcutAction> = {
  // Navigation shortcuts
  'ctrl+1': { action: 'navigateTo', target: 'landing', description: 'Go to Landing Page' },
  'ctrl+2': { action: 'navigateTo', target: 'dashboard', description: 'Go to Dashboard' },
  'ctrl+3': { action: 'navigateTo', target: 'market-feed', description: 'Go to Market Feed' },
  'ctrl+4': { action: 'navigateTo', target: 'data-source', description: 'Go to Data Sources' },
  'ctrl+5': { action: 'navigateTo', target: 'about', description: 'Go to About' },
  'ctrl+comma': { action: 'navigateTo', target: 'settings', description: 'Open Settings' },
  
  // Application shortcuts
  'ctrl+r': { action: 'refresh', description: 'Refresh Data' },
  'ctrl+e': { action: 'export', description: 'Export CSV Data' },
  'ctrl+shift+d': { action: 'toggleDarkMode', description: 'Toggle Dark Mode' },
  'ctrl+shift+n': { action: 'toggleNotifications', description: 'Toggle Notifications' },
  
  // UI shortcuts
  'esc': { action: 'closeModal', description: 'Close Modal/Dialog' },
  'ctrl+shift+k': { action: 'showShortcuts', description: 'Show Keyboard Shortcuts' },
  '?': { action: 'showHelp', description: 'Show Help' },
  
  // Quick actions
  'ctrl+f': { action: 'search', description: 'Search' },
  'alt+t': { action: 'connectWebSocket', description: 'Toggle WebSocket Connection' }
};

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(
  onRefresh?: () => void,
  onExport?: () => void,
  onToggleDarkMode?: () => void,
  onToggleNotifications?: () => void,
  onSearch?: () => void,
  onConnectWebSocket?: () => void,
  onNavigate?: (view: string) => void,
  disabled: boolean = false
) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return;
    
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape key even in input fields
      if (event.key === 'Escape') {
        target.blur();
      }
      return;
    }

    // Build shortcut key combination
    const parts = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    parts.push(event.key.toLowerCase());
    const shortcut = parts.join('+');

    const shortcutConfig = KEYBOARD_SHORTCUTS[shortcut];
    if (!shortcutConfig) return;

    // Prevent default browser behavior
    event.preventDefault();

    // Execute shortcut action
    switch (shortcutConfig.action) {
      case 'navigateTo':
        if (onNavigate) {
          onNavigate(shortcutConfig.target);
        }
        break;
      case 'refresh':
        onRefresh?.();
        break;
      case 'export':
        onExport?.();
        break;
      case 'toggleDarkMode':
        onToggleDarkMode?.();
        break;
      case 'toggleNotifications':
        onToggleNotifications?.();
        break;
      case 'closeModal':
        // Try to close any open modals/dialogs
        const modals = document.querySelectorAll('[role="dialog"], .modal');
        modals.forEach(modal => {
          const closeButton = modal.querySelector('[data-close], [aria-label*="close" i]');
          if (closeButton) {
            (closeButton as HTMLElement).click();
          }
        });
        break;
      case 'showShortcuts':
        setShowShortcuts(true);
        break;
      case 'showHelp':
        // Can be extended to show help modal
        console.log('Help shortcut triggered');
        break;
      case 'search':
        onSearch?.();
        break;
      case 'connectWebSocket':
        onConnectWebSocket?.();
        break;
    }
  }, [onRefresh, onExport, onToggleDarkMode, onToggleNotifications, onSearch, onConnectWebSocket, onNavigate, disabled]);

  useEffect(() => {
    if (!disabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, disabled]);

  return {
    showShortcuts,
    setShowShortcuts
  };
}

// Shortcuts help modal component
interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export function ShortcutsModal({ isOpen, onClose, isDarkMode }: ShortcutsModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatShortcut = (shortcut: string) => {
    return shortcut
      .split('+')
      .map(key => key.charAt(0).toUpperCase() + key.slice(1))
      .join(' + ');
  };

  const shortcutCategories = {
    Navigation: Object.entries(KEYBOARD_SHORTCUTS).filter(([, config]) => 
      config.action === 'navigateTo'
    ),
    'Quick Actions': Object.entries(KEYBOARD_SHORTCUTS).filter(([, config]) => 
      ['refresh', 'export', 'search', 'connectWebSocket'].includes(config.action)
    ),
    'UI Controls': Object.entries(KEYBOARD_SHORTCUTS).filter(([, config]) => 
      ['toggleDarkMode', 'toggleNotifications', 'closeModal', 'showShortcuts', 'showHelp'].includes(config.action)
    )
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border shadow-2xl ${
          isDarkMode 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`sticky top-0 px-6 py-4 border-b ${
          isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Keyboard className={`size-6 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Keyboard Shortcuts
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {Object.entries(shortcutCategories).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className={`text-lg font-semibold mb-3 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {category}
              </h3>
              <div className="grid gap-2">
                {shortcuts.map(([shortcut, config]) => (
                  <div 
                    key={shortcut}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {config.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {formatShortcut(shortcut).split(' + ').map((key, index, array) => (
                        <span key={index}>
                          <kbd className={`px-2 py-1 text-xs font-mono rounded border ${
                            isDarkMode
                              ? 'bg-gray-700 text-gray-300 border-gray-600'
                              : 'bg-gray-200 text-gray-800 border-gray-300'
                          }`}>
                            {key}
                          </kbd>
                          {index < array.length - 1 && (
                            <span className={`mx-1 text-xs ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              +
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Footer note */}
          <div className={`text-xs text-center pt-4 border-t ${
            isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
          }`}>
            <p>Press <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl + Shift + K</kbd> to toggle this dialog</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shortcut indicator component for showing available shortcuts
interface ShortcutIndicatorProps {
  shortcut: string;
  isDarkMode: boolean;
  className?: string;
}

export function ShortcutIndicator({ shortcut, isDarkMode, className = '' }: ShortcutIndicatorProps) {
  const formatShortcut = (shortcut: string) => {
    return shortcut
      .split('+')
      .map(key => key.charAt(0).toUpperCase() + key.slice(1))
      .join(' + ');
  };

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${
      isDarkMode ? 'text-gray-400' : 'text-gray-500'  
    } ${className}`}>
      <Command className="size-3" />
      {formatShortcut(shortcut).split(' + ').map((key, index, array) => (
        <span key={index} className="flex items-center gap-1">
          <kbd className={`px-1 py-0.5 text-xs rounded border ${
            isDarkMode
              ? 'bg-gray-700 text-gray-300 border-gray-600'
              : 'bg-gray-100 text-gray-700 border-gray-300'
          }`}>
            {key}
          </kbd>
          {index < array.length - 1 && (
            <span className="text-xs">+</span>
          )}
        </span>
      ))}
    </span>
  );
}