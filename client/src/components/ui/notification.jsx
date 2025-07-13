import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Notification component for real-time updates
export const Notification = ({ 
  id,
  type = 'info', 
  title, 
  message, 
  duration = 5000,
  onClose,
  persistent = false 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, persistent]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 300);
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-notification-success',
          borderColor: 'border-notification-success',
          textColor: 'text-white',
          iconColor: 'text-white'
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-notification-error',
          borderColor: 'border-notification-error',
          textColor: 'text-white',
          iconColor: 'text-white'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-notification-warning',
          borderColor: 'border-notification-warning',
          textColor: 'text-white',
          iconColor: 'text-white'
        };
      default:
        return {
          icon: Info,
          bgColor: 'bg-notification-info',
          borderColor: 'border-notification-info',
          textColor: 'text-white',
          iconColor: 'text-white'
        };
    }
  };

  if (!isVisible) return null;

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border-l-4 rounded-lg shadow-lg p-4
        flex items-start space-x-3
      `}>
        <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
          )}
          <p className="text-sm opacity-90">{message}</p>
        </div>
        
        <button
          onClick={handleClose}
          className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Notification Container
export const NotificationContainer = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll
  };
};

// Helper function to show different types of notifications
export const showNotification = {
  success: (title, message, options = {}) => {
    toast({
      title,
      description: message,
      ...options
    });
  },
  
  error: (title, message, options = {}) => {
    toast({
      title,
      description: message,
      variant: "destructive",
      ...options
    });
  },
  
  info: (title, message, options = {}) => {
    toast({
      title,
      description: message,
      ...options
    });
  },
  
  warning: (title, message, options = {}) => {
    toast({
      title,
      description: message,
      variant: "destructive",
      ...options
    });
  }
};