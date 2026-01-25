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
      // Task notifications
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
      
      // Goal notifications
      goal_created: {
        title: 'Goal Created',
        message: `New goal: "${item.title}"`,
        type: 'success'
      },
      goal_completed: {
        title: 'Goal Completed',
        message: `Congratulations! Completed: "${item.title}"`,
        type: 'success'
      },
      goal_updated: {
        title: 'Goal Updated',
        message: `Updated: "${item.title}"`,
        type: 'info'
      },
      goal_progress: {
        title: 'Progress Updated',
        message: `"${item.title}" is now at ${item.progress}%`,
        type: 'info'
      },
      goal_deleted: {
        title: 'Goal Deleted',
        message: `Removed: "${item.title}"`,
        type: 'warning'
      },
      goal_milestone: {
        title: 'Milestone Reached',
        message: `Milestone achieved for "${item.title}"`,
        type: 'success'
      },
      goal_reminder: {
        title: 'Goal Reminder',
        message: `Don't forget about: "${item.title}"`,
        type: 'info'
      },
      goal_deadline_approaching: {
        title: 'Deadline Approaching',
        message: `"${item.title}" is due soon`,
        type: 'warning'
      },
      
      // Reminder notifications
      reminder_created: {
        title: 'Reminder Set',
        message: `Reminder created: "${item.title}"`,
        type: 'success'
      },
      reminder_triggered: {
        title: 'Reminder',
        message: `${item.title}`,
        type: 'info'
      },
      reminder_snoozed: {
        title: 'Reminder Snoozed',
        message: `"${item.title}" snoozed`,
        type: 'info'
      },
      reminder_completed: {
        title: 'Reminder Completed',
        message: `Completed: "${item.title}"`,
        type: 'success'
      }
    };

    const template = notificationTemplates[type] || {
      title: 'Notification',
      message: 'Activity update',
      type: 'info'
    };

    const newNotification = {
      id: Date.now() + Math.random(), // More unique ID
      title: template.title,
      message: template.message,
      type: template.type,
      itemId: item.id,
      itemTitle: item.title,
      itemType: type.split('_')[0], // Extract 'goal', 'task', or 'reminder'
      notificationType: type,
      read: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      onClick: onClick || null,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => {
      const next = [newNotification, ...prev].slice(0, 100); // Keep only latest 100
      return next;
    });

    return newNotification;
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

  // Get notifications by type
  const getNotificationsByType = useCallback((itemType) => {
    return notifications.filter(n => n.itemType === itemType);
  }, [notifications]);

  // Get notifications by item ID
  const getNotificationsByItem = useCallback((itemId, itemType) => {
    return notifications.filter(n => n.itemId === itemId && n.itemType === itemType);
  }, [notifications]);

  // Get unread count
  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Context value
  const contextValue = {
    notifications,
    addNotification,
    addTaskNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearNotification,
    getNotificationsByType,
    getNotificationsByItem,
    getUnreadCount
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;