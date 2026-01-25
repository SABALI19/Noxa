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
        notificationHistory: [],
        notificationTypes: {},
        itemType,
        itemId
      };
      
      return {
        ...prev,
        [key]: {
          ...current,
          lastViewed: new Date().toISOString(),
          viewCount: (current.viewCount || 0) + 1
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
        notificationHistory: [],
        notificationTypes: {},
        itemType,
        itemId
      };
      
      return {
        ...prev,
        [key]: {
          ...current,
          completions: current.completions + 1,
          lastCompletion: new Date().toISOString(),
          completedAt: new Date().toISOString()
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
        notificationHistory: [],
        notificationTypes: {},
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
          progressUpdates: [...current.progressUpdates, progressUpdate].slice(-50) // Keep last 50 updates
        }
      };
    });
  }, []);

  // Track notification interactions
  const trackNotification = useCallback((itemId, itemType = 'goal', action = 'viewed', notificationType = null) => {
    setTrackingData(prev => {
      const key = `${itemType}_${itemId}`;
      const current = prev[key] || {
        totalNotifications: 0,
        snoozedCount: 0,
        lastViewed: null,
        progressUpdates: [],
        completions: 0,
        notificationHistory: [],
        notificationTypes: {},
        itemType,
        itemId
      };
      
      const notificationTypes = { ...current.notificationTypes };
      if (notificationType && action === 'sent') {
        notificationTypes[notificationType] = (notificationTypes[notificationType] || 0) + 1;
      }
      
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action,
        notificationType,
        metadata: {}
      };
      
      const updates = {
        totalNotifications: current.totalNotifications + (action === 'sent' ? 1 : 0),
        snoozedCount: current.snoozedCount + (action === 'snoozed' ? 1 : 0),
        lastNotification: action === 'sent' ? new Date().toISOString() : current.lastNotification,
        lastNotificationAction: action,
        lastNotificationType: notificationType || current.lastNotificationType,
        notificationTypes,
        notificationHistory: [...current.notificationHistory, historyEntry].slice(-100) // Keep last 100 history items
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
      notificationHistory: [],
      notificationTypes: {},
      itemType,
      itemId,
      viewCount: 0
    };
  }, [trackingData]);

  // Get all tracking data
  const getAllTrackingData = useCallback(() => {
    return trackingData;
  }, [trackingData]);

  // Get tracking data by type
  const getTrackingByType = useCallback((itemType) => {
    return Object.entries(trackingData)
      .filter(([key]) => key.startsWith(`${itemType}_`))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
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

  // Get summary statistics
  const getSummaryStats = useCallback(() => {
    const allData = Object.values(trackingData);
    
    return {
      totalItems: allData.length,
      totalNotifications: allData.reduce((sum, item) => sum + (item.totalNotifications || 0), 0),
      totalSnoozes: allData.reduce((sum, item) => sum + (item.snoozedCount || 0), 0),
      totalCompletions: allData.reduce((sum, item) => sum + (item.completions || 0), 0),
      totalProgressUpdates: allData.reduce((sum, item) => sum + (item.progressUpdates?.length || 0), 0),
      totalViews: allData.reduce((sum, item) => sum + (item.viewCount || 0), 0)
    };
  }, [trackingData]);

  // Context value
  const contextValue = {
    trackingData,
    trackView,
    trackCompletion,
    trackProgressUpdate,
    trackNotification,
    getNotificationStats,
    getAllTrackingData,
    getTrackingByType,
    clearTrackingForItem,
    clearAllTrackingData,
    getSummaryStats
  };

  return (
    <NotificationTrackingContext.Provider value={contextValue}>
      {children}
    </NotificationTrackingContext.Provider>
  );
};

export default NotificationTrackingContext;