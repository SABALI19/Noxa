// src/components/NotificationBell.jsx
import React, { useState, useRef, useEffect } from "react";
import { FiBell, FiCheck, FiX, FiCheckCircle, FiInfo, FiAlertCircle } from "react-icons/fi";
import { useTasks } from "../../context/TaskContext";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  
  const { 
    getTodayReminders,
    getOverdueTasks,
    getTaskStats
  } = useTasks();
  
  // Initialize notifications when component mounts
  useEffect(() => {
    updateNotifications();
  }, []);

  // Update notifications when task data changes
  const updateNotifications = () => {
    const todayReminders = getTodayReminders();
    const overdueTasks = getOverdueTasks();
    const stats = getTaskStats();
    
    // Create notifications based on task context data
    const newNotifications = [
      // Overdue tasks notifications
      ...overdueTasks.map(task => ({
        id: `overdue-${task.id}`,
        title: 'Task Overdue',
        message: `"${task.title}" is overdue`,
        time: 'Now',
        type: 'warning',
        read: false,
        onClick: () => {
          // Navigate to tasks page and highlight the task
          window.location.href = `/tasks#task-${task.id}`;
        }
      })),
      
      // Today's reminders notifications
      ...todayReminders.map(reminder => ({
        id: `reminder-${reminder.id}`,
        title: 'Reminder',
        message: `"${reminder.title}" is due soon`,
        time: 'Today',
        type: reminder.priority === 'high' ? 'warning' : 'info',
        read: false,
        onClick: () => {
          // Navigate to reminders page
          window.location.href = `/reminders`;
        }
      })),
      
      // Stats-based notifications
      ...(stats.overdue > 0 ? [{
        id: 'overdue-stats',
        title: 'Overdue Tasks Alert',
        message: `You have ${stats.overdue} overdue task${stats.overdue > 1 ? 's' : ''}`,
        time: 'Today',
        type: 'warning',
        read: false,
        onClick: () => {
          window.location.href = `/tasks?view=overdue`;
        }
      }] : []),
      
      ...(todayReminders.length > 0 ? [{
        id: 'today-reminders-stats',
        title: 'Daily Reminders',
        message: `You have ${todayReminders.length} reminder${todayReminders.length > 1 ? 's' : ''} for today`,
        time: 'Today',
        type: 'info',
        read: false,
        onClick: () => {
          window.location.href = `/reminders?filter=today`;
        }
      }] : [])
    ];
    
    setNotifications(newNotifications);
  };

  // Unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const getNotificationIcon = (type) => {
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

  // Fully functional notification actions
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
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

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      updateNotifications();
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell icon */}
      <div 
        className="cursor-pointer relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiBell className="text-xl text-gray-700 hover:text-[#3D9B9B]" />
        
        {/* Notification badge - shows coordinated alerts count */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {/* Dropdown - Centered version */}
      {isOpen && (
        <div className="fixed md:absolute inset-0 md:inset-auto md:right-0 md:top-full md:mt-2 md:w-80 bg-transparent md:bg-white md:rounded-lg md:shadow-xl md:border md:border-gray-200 z-50 flex items-center justify-center md:block">
          {/* Mobile overlay - only visible on mobile */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown content - centered on mobile, positioned normally on desktop */}
          <div className="absolute md:relative md:transform-none transform -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 top-1/2 left-1/2 md:top-auto md:left-auto w-[95vw] max-w-sm md:w-80 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
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
                    className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
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
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.onClick) {
                        notification.onClick();
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-gray-800 truncate">{notification.title}</p>
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
                        <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">{notification.time}</p>
                          {!notification.read && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FiBell className="text-3xl mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-600 font-medium mb-1">No notifications</p>
                  <p className="text-sm text-gray-500">When you have notifications, they'll appear here</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </span>
                <button 
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
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