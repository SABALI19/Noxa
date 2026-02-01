// src/context/NotificationContext.jsx
import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';

// Create the context
const NotificationContext = createContext(null);

// Provider component
export const NotificationProvider = ({ children }) => {
  // In-app notifications state
  const [notifications, setNotifications] = useState([]);
  
  // Notification sound settings
  const [notificationSettings, setNotificationSettings] = useState({
    enableNotifications: true,
    pushNotifications: false,
    emailNotifications: false,
    customRingtones: false,
    defaultSound: 'Default',
    soundEnabled: true,
  });
  
  // Audio ref for playing notification sounds
  const audioRef = useRef(null);
  
  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = 0.5; // Set volume to 50%
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Sound library mapping - Using data URLs for built-in beep sound
  const soundLibrary = {
    'Default': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    'Chime': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    'Bell': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    'Ding': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    'Alert': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    'Notification': 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
  };
  
  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!notificationSettings.enableNotifications || !notificationSettings.soundEnabled) {
      console.log('Notification sound disabled');
      return;
    }
    
    try {
      if (!audioRef.current) {
        console.error('Audio element not initialized');
        return;
      }
      
      // Set the sound source
      const soundPath = soundLibrary[notificationSettings.defaultSound] || soundLibrary['Default'];
      
      // Reset and play
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = soundPath;
      
      // Play with promise handling
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Notification sound played successfully');
          })
          .catch(error => {
            console.warn('Failed to play notification sound:', error);
          });
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [notificationSettings.enableNotifications, notificationSettings.soundEnabled, notificationSettings.defaultSound]);
  
  // Update notification settings
  const updateNotificationSettings = useCallback((newSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // Function to add an in-app notification
  const addNotification = useCallback((type, item, onClick = null, playSound = true) => {
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
      },
      
      // Profile notifications
      profile_updated: {
        title: 'Profile Updated',
        message: `${item.title}`,
        type: 'success'
      },
      profile_image_uploaded: {
        title: 'Image Uploaded',
        message: `${item.title}`,
        type: 'success'
      }
    };

    const template = notificationTemplates[type] || {
      title: 'Notification',
      message: item.title || 'Activity update',
      type: 'info'
    };

    const newNotification = {
      id: Date.now() + Math.random(), // Unique ID with timestamp and random
      title: template.title,
      message: template.message,
      type: template.type,
      itemId: item.id || Date.now(),
      itemTitle: item.title || '',
      itemType: type.split('_')[0], // Extract 'goal', 'task', 'reminder', or 'profile'
      notificationType: type,
      read: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      onClick: onClick || null,
      timestamp: new Date().toISOString()
    };

    console.log('Adding notification:', newNotification);

    setNotifications(prev => {
      const next = [newNotification, ...prev].slice(0, 100); // Keep only latest 100
      return next;
    });
    
    // Play notification sound if enabled
    if (playSound) {
      console.log('Playing notification sound...');
      playNotificationSound();
    }

    return newNotification;
  }, [playNotificationSound]);

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
  
  // Test notification sound
  const testNotificationSound = useCallback(() => {
    console.log('Testing notification sound...');
    playNotificationSound();
  }, [playNotificationSound]);

  // Context value
  const contextValue = {
    notifications,
    notificationSettings,
    addNotification,
    addTaskNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearNotification,
    getNotificationsByType,
    getNotificationsByItem,
    getUnreadCount,
    updateNotificationSettings,
    playNotificationSound,
    testNotificationSound
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;