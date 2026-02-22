import { useState, useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastNotificationProps {
  toast: Toast;
  onClose: (id: string) => void;
  isDarkMode: boolean;
}

function ToastNotification({ toast, onClose, isDarkMode }: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="size-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="size-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="size-5 text-yellow-500" />;
      case 'info':
        return <Info className="size-5 text-blue-500" />;
      default:
        return <Info className="size-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-500/20';
      case 'error':
        return 'border-red-500/20';
      case 'warning':
        return 'border-yellow-500/20';
      case 'info':
        return 'border-blue-500/20';
      default:
        return 'border-gray-500/20';
    }
  };

  return (
    <div className={`flex items-start gap-4 p-6 rounded-xl border-2 animate-slide-in-right backdrop-blur-sm ${
      isDarkMode 
        ? `bg-gray-900 border-gray-600 text-white shadow-2xl shadow-black/50` 
        : `bg-white border-gray-300 text-gray-900 shadow-2xl shadow-black/25`
    }`} style={{ zIndex: 9999 }}>
      {getIcon()}
      <div className="flex-1 min-w-0">
        <p className="font-black text-xl tracking-wide">{toast.title}</p>
        {toast.message && (
          <p className={`text-base font-bold mt-1 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className={`p-2 rounded-lg hover:bg-opacity-20 transition-colors ${
          isDarkMode ? 'hover:bg-white text-gray-300 hover:text-gray-900' : 'hover:bg-gray-900 text-gray-600 hover:text-white'
        }`}
      >
        <X className="size-5 font-bold" />
      </button>
    </div>
  );
}

// Toast Manager Component
interface ToastManagerProps {
  isDarkMode: boolean;
}

let toastId = 0;
const toasts: Toast[] = [];
let updateToasts: ((toasts: Toast[]) => void) | null = null;

export function ToastManager({ isDarkMode }: ToastManagerProps) {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    updateToasts = setCurrentToasts;
    setCurrentToasts([...toasts]);
    
    return () => {
      updateToasts = null;
    };
  }, []);

  const removeToast = (id: string) => {
    const index = toasts.findIndex(toast => toast.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
      updateToasts?.([...toasts]);
    }
  };

  return (
    <div className="fixed top-6 right-6 space-y-4 max-w-md w-full" style={{ zIndex: 99999 }}>
      {currentToasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onClose={removeToast}
          isDarkMode={isDarkMode}
        />
      ))}
    </div>
  );
}

// Toast utility functions
export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    const newToast: Toast = {
      id: String(++toastId),
      type: 'success',
      title,
      message,
      duration,
    };
    toasts.push(newToast);
    updateToasts?.([...toasts]);
  },

  error: (title: string, message?: string, duration?: number) => {
    const newToast: Toast = {
      id: String(++toastId),
      type: 'error',
      title,
      message,
      duration,
    };
    toasts.push(newToast);
    updateToasts?.([...toasts]);
  },

  warning: (title: string, message?: string, duration?: number) => {
    const newToast: Toast = {
      id: String(++toastId),
      type: 'warning',
      title,
      message,
      duration,
    };
    toasts.push(newToast);
    updateToasts?.([...toasts]);
  },

  info: (title: string, message?: string, duration?: number) => {
    const newToast: Toast = {
      id: String(++toastId),
      type: 'info',
      title,
      message,
      duration,
    };
    toasts.push(newToast);
    updateToasts?.([...toasts]);
  },
};