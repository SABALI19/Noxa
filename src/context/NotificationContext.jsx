// src/context/NotificationContext.jsx
import React, { createContext, useState, useCallback } from 'react';

// Create the context
const NotificationContext = createContext(null);

// Provider component
export const NotificationProvider = ({ children }) => {
  // In-app notifications state
  const [notifications, setNotifications] = useState([]);

  // Function to add an in-app notification
  const addNotification = useCallback((type, item, onClick = null) => {
    const notificationTemplates = {
      task_created: {
        title: 'Task Created',
        message: `Created: "${item.title}"`,
        type: 'success'
      },
      task_completed: {
        title: 'Task Completed',
        message: `Completed: "${item.title}"`,
        type: 'success'
      },
      task_in_progress: {
        title: 'Task In Progress',
        message: `Started working on: "${item.title}"`,
        type: 'info'
      },
      task_updated: {
        title: 'Task Updated',
        message: `Updated: "${item.title}"`,
        type: 'info'
      },
      task_deleted: {
        title: 'Task Deleted',
        message: `Deleted: "${item.title}"`,
        type: 'warning'
      },
      goal_created: {
        title: 'Goal Created',
        message: `Created: "${item.title}"`,
        type: 'success'
      },
      goal_completed: {
        title: 'Goal Completed',
        message: `Completed: "${item.title}"`,
        type: 'success'
      },
      goal_updated: {
        title: 'Goal Updated',
        message: `Updated: "${item.title}"`,
        type: 'info'
      },
      goal_progress: {
        title: 'Goal Progress',
        message: `Progress updated: "${item.title}"`,
        type: 'info'
      }
    };

    const template = notificationTemplates[type] || {
      title: 'Notification',
      message: 'Activity update',
      type: 'info'
    };

    const newNotification = {
      id: Date.now(),
      title: template.title,
      message: template.message,
      type: template.type,
      itemId: item.id,
      itemTitle: item.title,
      read: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      onClick: onClick || null,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => {
      const next = [newNotification, ...prev].slice(0, 50); // Keep only latest 50
      return next;
    });
  }, []);

  // Alias for backward compatibility
  const addTaskNotification = addNotification;

  // Mark a single notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Clear a specific notification
  const clearNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Context value
  const contextValue = {
    notifications,
    addNotification,
    addTaskNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;