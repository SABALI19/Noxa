// src/context/NotificationTrackingContext.jsx
import React, { createContext, useState, useCallback, useEffect } from 'react';

// Create the context
const NotificationTrackingContext = createContext(null);

// Provider component
export const NotificationTrackingProvider = ({ children }) => {
  const [trackingData, setTrackingData] = useState({});

  // Load tracking data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem('notificationTrackingData');
    if (savedData) {
      try {
        setTimeout(() => {
          setTrackingData(JSON.parse(savedData));
        }, 0);
      } catch (error) {
        console.error('Failed to parse saved tracking data:', error);
      }
    }
  }, []);

  // Save tracking data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('notificationTrackingData', JSON.stringify(trackingData));
  }, [trackingData]);

  // Track when an item is viewed
  const trackView = useCallback((itemId, itemType = 'goal') => {
    setTrackingData(prev => {
      const key = `${itemType}_${itemId}`;
      const current = prev[key] || {
        totalNotifications: 0,
        snoozedCount: 0,
        lastViewed: null,
        progressUpdates: [],
        completions: 0,
        itemType,
        itemId
      };
      
      return {
        ...prev,
        [key]: {
          ...current,
          lastViewed: new Date().toISOString()
        }
      };
    });
  }, []);

  // Track when an item is completed
  const trackCompletion = useCallback((itemId, itemType = 'goal') => {
    setTrackingData(prev => {
      const key = `${itemType}_${itemId}`;
      const current = prev[key] || {
        totalNotifications: 0,
        snoozedCount: 0,
        lastViewed: null,
        progressUpdates: [],
        completions: 0,
        itemType,
        itemId
      };
      
      return {
        ...prev,
        [key]: {
          ...current,
          completions: current.completions + 1,
          lastCompletion: new Date().toISOString()
        }
      };
    });
  }, []);

  // Track progress updates
  const trackProgressUpdate = useCallback((itemId, oldProgress, newProgress, itemType = 'goal') => {
    setTrackingData(prev => {
      const key = `${itemType}_${itemId}`;
      const current = prev[key] || {
        totalNotifications: 0,
        snoozedCount: 0,
        lastViewed: null,
        progressUpdates: [],
        completions: 0,
        itemType,
        itemId
      };
      
      const progressUpdate = {
        timestamp: new Date().toISOString(),
        oldProgress,
        newProgress,
        change: newProgress - oldProgress
      };
      
      return {
        ...prev,
        [key]: {
          ...current,
          progressUpdates: [...current.progressUpdates, progressUpdate].slice(-10) // Keep last 10 updates
        }
      };
    });
  }, []);

  // Track notification interactions
  const trackNotification = useCallback((itemId, itemType = 'goal', action = 'viewed', notificationType) => {
    setTrackingData(prev => {
      const key = `${itemType}_${itemId}`;
      const current = prev[key] || {
        totalNotifications: 0,
        snoozedCount: 0,
        lastViewed: null,
        progressUpdates: [],
        completions: 0,
        itemType,
        itemId
      };
      
      const updates = {
        totalNotifications: current.totalNotifications + (action === 'sent' ? 1 : 0),
        snoozedCount: current.snoozedCount + (action === 'snoozed' ? 1 : 0),
        lastNotification: action === 'sent' ? new Date().toISOString() : current.lastNotification,
        lastNotificationAction: action,
        lastNotificationType: notificationType
      };
      
      return {
        ...prev,
        [key]: {
          ...current,
          ...updates
        }
      };
    });
  }, []);

  // Get notification stats for a specific item
  const getNotificationStats = useCallback((itemId, itemType = 'goal') => {
    const key = `${itemType}_${itemId}`;
    return trackingData[key] || {
      totalNotifications: 0,
      snoozedCount: 0,
      lastViewed: null,
      progressUpdates: [],
      completions: 0,
      itemType,
      itemId
    };
  }, [trackingData]);

  // Get all tracking data
  const getAllTrackingData = useCallback(() => {
    return trackingData;
  }, [trackingData]);

  // Clear tracking data for a specific item
  const clearTrackingForItem = useCallback((itemId, itemType = 'goal') => {
    setTrackingData(prev => {
      const key = `${itemType}_${itemId}`;
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
  }, []);

  // Clear all tracking data
  const clearAllTrackingData = useCallback(() => {
    setTrackingData({});
  }, []);

  // Context value
  const contextValue = {
    trackingData,
    trackView,
    trackCompletion,
    trackProgressUpdate,
    trackNotification,
    getNotificationStats,
    getAllTrackingData,
    clearTrackingForItem,
    clearAllTrackingData
  };

  return (
    <NotificationTrackingContext.Provider value={contextValue}>
      {children}
    </NotificationTrackingContext.Provider>
  );
};

// Only export the provider component
export default NotificationTrackingContext;