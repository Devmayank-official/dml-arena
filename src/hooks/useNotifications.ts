import { useState, useCallback, useEffect } from 'react';

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

const STORAGE_KEY = 'app_notifications';
const MAX_NOTIFICATIONS = 50;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Notification[];
        // Convert timestamps back to Date objects
        const restored = parsed.map((n) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(restored);
        setUnreadCount(restored.filter((n) => !n.read).length);
      }
    } catch {
      // Notification load error - silent
    }
  }, []);

  // Save to localStorage when notifications change
  const saveNotifications = useCallback((items: Notification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
        saveNotifications(updated);
        return updated;
      });

      setUnreadCount((prev) => prev + 1);

      // Request browser notification permission if not granted
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.description,
          icon: '/icons/icon-192x192.png',
        });
      }

      return newNotification.id;
    },
    [saveNotifications]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        saveNotifications(updated);
        return updated;
      });

      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [saveNotifications]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });

    setUnreadCount(0);
  }, [saveNotifications]);

  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === id);
        const updated = prev.filter((n) => n.id !== id);
        saveNotifications(updated);

        if (notification && !notification.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }

        return updated;
      });
    },
    [saveNotifications]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Helper to add common notification types
  const notifyComparisonComplete = useCallback(
    (modelCount: number, query: string) => {
      addNotification({
        title: 'Comparison Complete',
        description: `Got ${modelCount} responses for "${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"`,
        type: 'success',
        actionUrl: '/chat',
      });
    },
    [addNotification]
  );

  const notifyDebateComplete = useCallback(
    (rounds: number) => {
      addNotification({
        title: 'Debate Complete',
        description: `Deep debate finished with ${rounds} rounds. Final answer ready!`,
        type: 'success',
        actionUrl: '/chat',
      });
    },
    [addNotification]
  );

  const notifyError = useCallback(
    (message: string) => {
      addNotification({
        title: 'Error',
        description: message,
        type: 'error',
      });
    },
    [addNotification]
  );

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    notifyComparisonComplete,
    notifyDebateComplete,
    notifyError,
  };
}
