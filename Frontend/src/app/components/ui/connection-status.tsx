import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';

interface ConnectionStatusProps {
  isDarkMode: boolean;
}

export function ConnectionStatus({ isDarkMode }: ConnectionStatusProps) {
  const [status, setStatus] = useState<string>('disconnected');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Listen to connection status changes
    const handleStatusChange = (newStatus: string) => {
      setStatus(newStatus);
      setIsRetrying(newStatus === 'reconnecting');
    };

    const handleReconnecting = ({ attempt }: { attempt: number }) => {
      setReconnectAttempt(attempt);
      setIsRetrying(true);
    };

    const handleConnected = () => {
      setIsRetrying(false);
      setReconnectAttempt(0);
    };

    api.on('connection-status', handleStatusChange);
    api.on('reconnecting', handleReconnecting);
    api.on('connected', handleConnected);

    // Set initial status
    setStatus(api.getConnectionStatus());

    return () => {
      api.off('connection-status', handleStatusChange);
      api.off('reconnecting', handleReconnecting);
      api.off('connected', handleConnected);
    };
  }, []);

  const handleForceReconnect = () => {
    api.forceReconnect();
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          text: 'Connected',
          description: 'Real-time data active'
        };
      case 'connecting':
        return {
          icon: RotateCcw,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10', 
          borderColor: 'border-blue-500/20',
          text: 'Connecting...',
          description: 'Establishing connection'
        };
      case 'reconnecting':
        return {
          icon: RotateCcw,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20', 
          text: `Reconnecting (${reconnectAttempt})`,
          description: 'Attempting to restore connection'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          text: 'Connection Error',
          description: 'Unable to connect to server'
        };
      case 'failed':
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          text: 'Connection Failed',
          description: 'Max retry attempts reached'
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
          text: 'Disconnected',
          description: 'No real-time data'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const Icon = statusConfig.icon;

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
      isDarkMode 
        ? `${statusConfig.bgColor} ${statusConfig.borderColor}` 
        : `${statusConfig.bgColor} ${statusConfig.borderColor}`
    }`}>
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${statusConfig.color} ${
          isRetrying ? 'animate-spin' : ''
        }`} />
        <div className="flex flex-col">
          <span className={`text-xs font-medium ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {statusConfig.text}
          </span>
          <span className={`text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {statusConfig.description}
          </span>
        </div>
      </div>

      {/* Manual reconnect button for failed connections */}
      {(status === 'failed' || status === 'error') && (
        <button
          onClick={handleForceReconnect}
          className={`p-1 rounded hover:bg-opacity-20 transition-colors ${
            isDarkMode ? 'hover:bg-white' : 'hover:bg-gray-900'
          }`}
          title="Retry connection"
        >
          <RotateCcw className="size-3" />
        </button>
      )}
    </div>
  );
}