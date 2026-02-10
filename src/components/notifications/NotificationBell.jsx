// src/components/NotificationBell.jsx
import React, { useState, useRef, useEffect } from "react";
import { FiBell, FiCheck, FiX, FiCheckCircle, FiInfo, FiAlertCircle, FiTarget, FiCalendar } from "react-icons/fi";
import { useNotifications } from "../../hooks/useNotifications";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    clearNotification,
    getUnreadCount 
  } = useNotifications();
  
  // Unread notifications count
  const unreadCount = getUnreadCount();
  
  const getNotificationIcon = (type, notificationType) => {
    // Check notification type first for more specific icons
    if (notificationType?.includes('goal')) {
      return <FiTarget className="text-purple-500 text-lg" />;
    }
    if (notificationType?.includes('reminder')) {
      return <FiBell className="text-yellow-500 text-lg" />;
    }
    if (notificationType?.includes('deadline')) {
      return <FiCalendar className="text-red-500 text-lg" />;
    }
    
    // Fall back to general type
    switch (type) {
      case 'success':
        return <FiCheckCircle className="text-green-500 text-lg" />;
      case 'warning':
        return <FiAlertCircle className="text-yellow-500 text-lg" />;
      case 'info':
      default:
        return <FiInfo className="text-blue-500 text-lg" />;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.onClick) {
      notification.onClick();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell icon */}
      <div 
        className="cursor-pointer relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiBell className="text-xl text-gray-700 dark:text-gray-300 hover:text-[#3D9B9B]" />
        
        {/* Notification badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {/* Dropdown - Centered version */}
      {isOpen && (
        <div className="fixed md:absolute inset-0 md:inset-auto md:right-0 md:top-full md:mt-2 md:w-80 bg-transparent md:bg-white md:dark:bg-gray-800 md:rounded-lg md:shadow-xl md:border md:border-gray-200 md:dark:border-gray-700 z-50 flex items-center justify-center md:block">
          {/* Mobile overlay - only visible on mobile */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown content - centered on mobile, positioned normally on desktop */}
          <div className="absolute md:relative md:transform-none transform -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 top-1/2 left-1/2 md:top-auto md:left-auto w-[95vw] max-w-sm md:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-300">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <FiCheck className="text-sm" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAll();
                    }}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <FiX className="text-sm" />
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group ${
                      !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type, notification.notificationType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-gray-800 dark:text-gray-300 truncate">{notification.title}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity"
                          >
                            <FiX className="text-sm" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400 dark:text-gray-500">{notification.time}</p>
                          {!notification.read && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        {/* Show item type badge */}
                        {notification.itemType && (
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              notification.itemType === 'goal' ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                              notification.itemType === 'task' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                              notification.itemType === 'reminder' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.itemType.charAt(0).toUpperCase() + notification.itemType.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FiBell className="text-3xl mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">When you have notifications, they'll appear here</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </span>
                <button 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;