// src/components/NotificationBell.jsx
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiCheck,
  FiX,
  FiCheckCircle,
  FiInfo,
  FiAlertCircle,
  FiTarget,
  FiCalendar,
  FiVolumeX,
  FiVolume2,
  FiClock,
} from "react-icons/fi";
import { useNotifications } from "../../hooks/useNotifications";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    notifications, 
    notificationSettings,
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    clearNotification,
    getUnreadCount,
    muteNotificationSounds,
    unmuteNotificationSounds,
    snoozeNotificationSounds,
    clearNotificationSoundSnooze,
    isSoundSnoozed,
    soundSnoozedUntil,
    stopRingtone,
  } = useNotifications();
  
  // Unread notifications count
  const unreadCount = getUnreadCount();
  const snoozeEndsAt = soundSnoozedUntil ? new Date(soundSnoozedUntil) : null;
  const soundStatusText = !notificationSettings.soundEnabled
    ? "Notification sound is muted."
    : isSoundSnoozed && snoozeEndsAt
    ? `Notification sound snoozed until ${snoozeEndsAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}.`
    : "Notification sound is active.";

  const getFallbackOriginPath = (notification = {}) => {
    const itemType = String(notification.itemType || '').toLowerCase();
    const notificationType = String(notification.notificationType || '').toLowerCase();
    const itemId = notification.itemId === undefined || notification.itemId === null
      ? ''
      : encodeURIComponent(String(notification.itemId));

    if (itemType === 'task' || notificationType.startsWith('task_')) {
      return itemId ? `/tasks#task-${itemId}` : '/tasks';
    }
    if (itemType === 'goal' || notificationType.startsWith('goal_')) {
      return itemId ? `/goals/${itemId}` : '/goals';
    }
    if (itemType === 'reminder' || notificationType.startsWith('reminder_')) {
      return '/reminders';
    }
    if (itemType === 'note' || notificationType.startsWith('note_')) {
      return '/notes';
    }
    if (itemType === 'profile' || notificationType.startsWith('profile_')) {
      return '/account';
    }
    if (itemType === 'account' || notificationType.startsWith('account_') || notificationType === 'user_logged_in') {
      return '/account';
    }

    return '/notifications';
  };

  const navigateToNotificationOrigin = (originPath) => {
    if (!originPath) return;

    const [pathWithSearch, rawHash = ''] = String(originPath).split('#');
    if (!pathWithSearch) return;

    const currentPath = `${location.pathname}${location.search}`;
    if (currentPath !== pathWithSearch) {
      navigate(pathWithSearch);
    }

    if (rawHash) {
      const decodedHash = decodeURIComponent(rawHash);
      window.setTimeout(() => {
        const targetElement = document.getElementById(decodedHash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        window.location.hash = `#${rawHash}`;
      }, 200);
    }
  };
  
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
    if (notificationType?.includes('account') || notificationType === 'user_logged_in') {
      return <FiCheckCircle className="text-emerald-500 text-lg" />;
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
    stopRingtone();
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.onClick) {
      try {
        notification.onClick();
      } catch (error) {
        console.error('Error executing notification click handler:', error);
      }
    }
    navigateToNotificationOrigin(notification.originPath || getFallbackOriginPath(notification));
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
        <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-16 sm:px-4 md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:block md:px-0 md:pt-0">
          {/* Mobile overlay - only visible on mobile */}
          <div 
            className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm md:bg-transparent md:backdrop-blur-0"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown content - centered on mobile, positioned normally on desktop */}
          <div className="relative z-10 flex max-h-[min(85vh,44rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-2xl shadow-slate-900/20 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/90 md:w-[24rem]">
            {/* Header */}
            <div className="border-b border-teal-700/40 bg-[#0c7d7d] px-4 py-4 text-white sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">Notifications</h3>
                  <p className="mt-1 text-xs text-white/75">
                    {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (notificationSettings.soundEnabled) {
                      muteNotificationSounds();
                    } else {
                      unmuteNotificationSounds();
                    }
                  }}
                  className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white/85 transition-colors hover:bg-white/20 hover:text-white"
                >
                  {notificationSettings.soundEnabled ? <FiVolumeX className="text-sm" /> : <FiVolume2 className="text-sm" />}
                  {notificationSettings.soundEnabled ? "Mute" : "Unmute"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSoundSnoozed) {
                      clearNotificationSoundSnooze();
                    } else {
                      snoozeNotificationSounds(30);
                    }
                  }}
                  className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white/85 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <FiClock className="text-sm" />
                  {isSoundSnoozed ? "Resume sound" : "Snooze 30m"}
                </button>
                {unreadCount > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      stopRingtone();
                      markAllAsRead();
                    }}
                    className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white/85 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    <FiCheck className="text-sm" />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      stopRingtone();
                      clearAll();
                    }}
                    className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-white/85 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    <FiX className="text-sm" />
                    Clear all
                  </button>
                )}
              </div>
            </div>
            </div>
            <div className="border-b border-gray-200/80 px-4 py-2 text-xs text-gray-600 backdrop-blur-sm dark:border-gray-700/80 dark:text-gray-300 sm:px-5">
              {soundStatusText}
            </div>

            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`cursor-pointer border-b border-gray-100/90 p-4 transition-colors dark:border-gray-800/90 sm:px-5 ${
                      !notification.read
                        ? 'bg-teal-50/70 hover:bg-teal-50 dark:bg-teal-950/25 dark:hover:bg-teal-950/40'
                        : 'hover:bg-gray-50/90 dark:hover:bg-gray-800/70'
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
                              stopRingtone();
                              clearNotification(notification.id);
                            }}
                            className="text-gray-400 transition-colors hover:text-red-500 md:opacity-0 md:group-hover:opacity-100"
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
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <FiBell className="text-3xl mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">When you have notifications, they'll appear here</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200/80 p-3 backdrop-blur-sm dark:border-gray-700/80 sm:px-5">
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
