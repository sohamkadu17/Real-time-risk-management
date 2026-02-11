import { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, BookOpen, ExternalLink, ChevronRight, X } from 'lucide-react';

// Help content data structure
export const HELP_CONTENT = {
  dashboard: {
    title: 'Dashboard Overview',
    description: 'Monitor real-time risk metrics and system health',
    sections: [
      {
        title: 'Risk Metrics',
        content: 'View current risk scores, confidence levels, and trend analysis. Higher scores indicate increased risk exposure.',
        tips: ['Red indicators show critical risks requiring immediate attention', 'Green indicates normal risk levels']
      },
      {
        title: 'Market Data',
        content: 'Real-time market information including price changes, volume, and volatility indicators.',
        tips: ['Data updates every few seconds via WebSocket connection', 'Historical charts show 24-hour trends']
      },
      {
        title: 'Alert Timeline',
        content: 'Chronological view of risk alerts and system notifications.',
        tips: ['Click alerts for detailed information', 'Use filters to focus on specific risk types']
      }
    ]
  },
  market: {
    title: 'Market Feed',
    description: 'Live market data and trading information',
    sections: [
      {
        title: 'Live Data Stream',
        content: 'Real-time market prices, volumes, and changes streamed directly from market sources.',
        tips: ['Green/red colors indicate positive/negative price movements', 'Volume bars show trading activity levels']
      },
      {
        title: 'Market Snapshot',
        content: 'Key market indicators and summary statistics for quick market assessment.',
        tips: ['Refresh manually or enable auto-refresh', 'Export data for external analysis']
      }
    ]
  },
  settings: {
    title: 'Settings & Preferences',
    description: 'Customize your experience and configure system behavior',
    sections: [
      {
        title: 'Appearance',
        content: 'Control the visual theme, layout preferences, and UI customization options.',
        tips: ['Dark mode reduces eye strain in low-light conditions', 'High contrast mode improves accessibility']
      },
      {
        title: 'Notifications',
        content: 'Configure alert preferences, sound settings, and notification delivery methods.',
        tips: ['Enable desktop notifications for critical alerts', 'Customize sound alerts for different risk levels']
      },
      {
        title: 'Data & Privacy',
        content: 'Manage data retention, privacy settings, and export preferences.',
        tips: ['Export settings to backup your configuration', 'Clear data to reset to defaults']
      }
    ]
  },
  websocket: {
    title: 'Connection Status',
    description: 'WebSocket connection health and troubleshooting',
    sections: [
      {
        title: 'Connection Indicators',
        content: 'Green dot indicates active connection. Yellow shows reconnecting. Red indicates disconnected.',
        tips: ['Auto-reconnection attempts every 5 seconds when disconnected', 'Manual refresh can help resolve connection issues']
      }
    ]
  }
};

// Tooltip component for contextual help
interface HelpTooltipProps {
  content: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  isDarkMode: boolean;
  children: React.ReactNode;
  className?: string;
}

export function HelpTooltip({ 
  content, 
  title, 
  position = 'top', 
  isDarkMode, 
  children, 
  className = '' 
}: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };

    let x = 0, y = 0;

    switch (position) {
      case 'top':
        x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        x = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
        y = triggerRect.bottom + 8;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
        break;
    }

    // Keep tooltip within viewport
    x = Math.max(8, Math.min(x, viewport.width - tooltipRect.width - 8));
    y = Math.max(8, Math.min(y, viewport.height - tooltipRect.height - 8));

    setCoords({ x, y });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible, position]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className={`inline-block ${className}`}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-3 py-2 text-sm rounded-lg shadow-lg border max-w-xs ${
            isDarkMode
              ? 'bg-gray-800 text-white border-gray-600'
              : 'bg-white text-gray-900 border-gray-200'
          }`}
          style={{ left: coords.x, top: coords.y }}
        >
          {title && (
            <div className={`font-semibold mb-1 ${isDarkMode ? 'text-teal-300' : 'text-teal-600'}`}>
              {title}
            </div>
          )}
          <div>{content}</div>
        </div>
      )}
    </>
  );
}

// Help button component
interface HelpButtonProps {
  section?: keyof typeof HELP_CONTENT;
  isDarkMode: boolean;
  onShowHelp: (section?: keyof typeof HELP_CONTENT) => void;
  className?: string;
}

export function HelpButton({ section, isDarkMode, onShowHelp, className = '' }: HelpButtonProps) {
  return (
    <button
      onClick={() => onShowHelp(section)}
      className={`p-2 rounded-lg transition-colors ${
        isDarkMode
          ? 'text-gray-400 hover:text-teal-400 hover:bg-gray-800'
          : 'text-gray-500 hover:text-teal-600 hover:bg-gray-100'
      } ${className}`}
      title="Get help"
    >
      <HelpCircle className="size-4" />
    </button>
  );
}

// Main help modal component
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  section?: keyof typeof HELP_CONTENT;
  isDarkMode: boolean;
}

export function HelpModal({ isOpen, onClose, section, isDarkMode }: HelpModalProps) {
  const [activeSection, setActiveSection] = useState<keyof typeof HELP_CONTENT | 'overview'>(
    section || 'overview'
  );

  useEffect(() => {
    if (section) {
      setActiveSection(section);
    }
  }, [section]);

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

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Getting Started
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
          Welcome to the Real-time Risk Management System. This tool provides comprehensive risk monitoring, 
          market data analysis, and alert management capabilities.
        </p>
        
        <div className="grid gap-4">
          {Object.entries(HELP_CONTENT).map(([key, content]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as keyof typeof HELP_CONTENT)}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="text-left">
                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {content.title}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {content.description}
                </div>
              </div>
              <ChevronRight className={`size-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          ))}
        </div>
      </div>

      <div className={`p-4 rounded-lg border ${
        isDarkMode ? 'border-teal-700 bg-teal-900/20' : 'border-teal-200 bg-teal-50'
      }`}>
        <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-teal-300' : 'text-teal-800'}`}>
          <Info className="inline size-4 mr-2" />
          Quick Tips
        </h4>
        <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-teal-200' : 'text-teal-700'}`}>
          <li>• Press <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl + Shift + K</kbd> for keyboard shortcuts</li>
          <li>• Use <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">Ctrl + R</kbd> to refresh data</li>
          <li>• Press <kbd className="px-1 bg-gray-200 dark:bg-gray-700 rounded">?</kbd> anywhere for contextual help</li>
        </ul>
      </div>
    </div>
  );

  const renderSectionContent = (sectionKey: keyof typeof HELP_CONTENT) => {
    const content = HELP_CONTENT[sectionKey];
    
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setActiveSection('overview')}
            className={`text-sm mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-500'
            }`}
          >
            ← Back to Overview
          </button>
          
          <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {content.title}
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-6`}>
            {content.description}
          </p>
        </div>

        <div className="space-y-6">
          {content.sections.map((section, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
            }`}>
              <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {section.title}
              </h4>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {section.content}
              </p>
              
              {section.tips && section.tips.length > 0 && (
                <div>
                  <h5 className={`text-xs font-medium mb-2 ${
                    isDarkMode ? 'text-teal-400' : 'text-teal-600'
                  }`}>
                    Tips:
                  </h5>
                  <ul className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {section.tips.map((tip, tipIndex) => (
                      <li key={tipIndex}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl border shadow-2xl ${
          isDarkMode 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${
          isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className={`size-6 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Help & Documentation
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
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {activeSection === 'overview' 
            ? renderOverview() 
            : renderSectionContent(activeSection as keyof typeof HELP_CONTENT)
          }
        </div>
      </div>
    </div>
  );
}