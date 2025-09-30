import React from 'react';
import { BRAND_COLORS } from '../../../styles/theme';

interface Notification {
  id: string;
  title: string;
  description?: string;
  timeAgo: string;
  type: 'assignment' | 'visit' | 'system';
  unread: boolean;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  notifications: Notification[];
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  notifications,
  onClose,
  menuRef,
}) => {
  if (!isOpen) return null;

  const markAllAsRead = () => {
    // TODO: Implement mark all as read
    console.log('Mark all notifications as read');
  };

  return (
    <div
      ref={menuRef}
      className="fixed right-3 top-20 z-[9999] w-[320px] max-w-[90vw] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg animate-fade-in-down"
    >
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="font-semibold text-gray-900 dark:text-gray-100">Bildirimler</div>
        <button
          onClick={markAllAsRead}
          className="text-xs hover:underline"
          style={{ color: BRAND_COLORS.navy }}
        >
          Tümünü okundu işaretle
        </button>
      </div>
      
      <div className="max-h-[300px] overflow-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500 text-center">
            Bildirim yok
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-3 border-b last:border-b-0 ${
                notification.unread ? 'bg-[#002D72]/5 dark:bg-[#F9C800]/10' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 inline-block w-2 h-2 rounded-full ${
                    notification.type === 'assignment' ? 'bg-amber-500' :
                    notification.type === 'visit' ? 'bg-green-500' :
                    'bg-gray-400'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {notification.title}
                  </div>
                  {notification.description && (
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                      {notification.description}
                    </div>
                  )}
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {notification.timeAgo}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;