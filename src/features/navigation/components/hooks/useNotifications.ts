import { useState, useEffect } from 'react';
import { mockNotifications } from '../../../../data/notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  
  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, unread: false }))
    );
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    );
  };

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
  };
}