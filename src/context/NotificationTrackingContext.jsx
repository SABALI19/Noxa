// src/context/NotificationTrackingContext.jsx
import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';

const NotificationTrackingContext = createContext(null);

const TRACKING_DEDUPE_MS = 1500;
const TRACKING_CACHE_TTL_MS = 60000;

const createBaseTrackingRecord = (itemId, itemType) => ({
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
});

export const NotificationTrackingProvider = ({ children }) => {
  const [trackingData, setTrackingData] = useState(() => {
    const savedData = localStorage.getItem('notificationTrackingData');
    if (!savedData) return {};
    try {
      const parsedData = JSON.parse(savedData);
      return parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData) ? parsedData : {};
    } catch (error) {
      console.error('Failed to parse saved tracking data:', error);
      localStorage.removeItem('notificationTrackingData');
      return {};
    }
  });

  const recentTrackingRef = useRef(new Map());

  useEffect(() => {
    localStorage.setItem('notificationTrackingData', JSON.stringify(trackingData));
  }, [trackingData]);

  const shouldSkipTracking = useCallback((key, dedupeMs = TRACKING_DEDUPE_MS) => {
    const now = Date.now();
    const cache = recentTrackingRef.current;
    for (const [existingKey, ts] of cache.entries()) {
      if (now - ts > TRACKING_CACHE_TTL_MS) {
        cache.delete(existingKey);
      }
    }

    const previous = cache.get(key);
    if (previous && now - previous < dedupeMs) {
      return true;
    }

    cache.set(key, now);
    return false;
  }, []);

  const trackView = useCallback((itemId, itemType = 'goal') => {
    setTrackingData((prev) => {
      const key = `${itemType}_${itemId}`;
      const current = prev[key] || createBaseTrackingRecord(itemId, itemType);
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

  const trackCompletion = useCallback((itemId, itemType = 'goal') => {
    setTrackingData((prev) => {
      const key = `${itemType}_${itemId}`;
      const current = prev[key] || createBaseTrackingRecord(itemId, itemType);
      const now = new Date().toISOString();
      return {
        ...prev,
        [key]: {
          ...current,
          completions: (current.completions || 0) + 1,
          lastCompletion: now,
          completedAt: now
        }
      };
    });
  }, []);

  const trackProgressUpdate = useCallback((itemId, oldProgress, newProgress, itemType = 'goal') => {
    setTrackingData((prev) => {
      const key = `${itemType}_${itemId}`;
      const current = prev[key] || createBaseTrackingRecord(itemId, itemType);
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
          progressUpdates: [...current.progressUpdates, progressUpdate].slice(-50)
        }
      };
    });
  }, []);

  const trackNotification = useCallback((
    itemId,
    itemType = 'goal',
    action = 'viewed',
    notificationType = null,
    metadata = {},
    options = {}
  ) => {
    const trackingKey = options.eventId
      ? `event:${options.eventId}`
      : `${itemType}:${itemId}:${action}:${notificationType || ''}`;
    if (shouldSkipTracking(trackingKey, options.dedupeMs ?? TRACKING_DEDUPE_MS)) {
      return;
    }

    setTrackingData((prev) => {
      const key = `${itemType}_${itemId}`;
      const current = prev[key] || createBaseTrackingRecord(itemId, itemType);
      const now = new Date().toISOString();
      const notificationTypes = { ...current.notificationTypes };
      if (notificationType && action === 'sent') {
        notificationTypes[notificationType] = (notificationTypes[notificationType] || 0) + 1;
      }

      const historyEntry = {
        timestamp: now,
        action,
        notificationType,
        metadata: metadata || {}
      };

      return {
        ...prev,
        [key]: {
          ...current,
          totalNotifications: (current.totalNotifications || 0) + (action === 'sent' ? 1 : 0),
          snoozedCount: (current.snoozedCount || 0) + (action === 'snoozed' ? 1 : 0),
          lastNotification: action === 'sent' ? now : current.lastNotification,
          lastNotificationAction: action,
          lastNotificationType: notificationType || current.lastNotificationType,
          notificationTypes,
          notificationHistory: [...current.notificationHistory, historyEntry].slice(-100)
        }
      };
    });
  }, [shouldSkipTracking]);

  const trackSnooze = useCallback((itemId, itemType = 'goal', snoozeMinutes = 30) => {
    trackNotification(
      itemId,
      itemType,
      'snoozed',
      'reminder_snoozed',
      { snoozeMinutes }
    );
  }, [trackNotification]);

  const getNotificationStats = useCallback((itemId, itemType = 'goal') => {
    const key = `${itemType}_${itemId}`;
    return trackingData[key] || createBaseTrackingRecord(itemId, itemType);
  }, [trackingData]);

  const getAllTrackingData = useCallback(() => trackingData, [trackingData]);

  const getTrackingByType = useCallback((itemType) => {
    return Object.entries(trackingData)
      .filter(([key]) => key.startsWith(`${itemType}_`))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  }, [trackingData]);

  const clearTrackingForItem = useCallback((itemId, itemType = 'goal') => {
    setTrackingData((prev) => {
      const key = `${itemType}_${itemId}`;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAllTrackingData = useCallback(() => {
    setTrackingData({});
  }, []);

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

  const contextValue = {
    trackingData,
    trackView,
    trackCompletion,
    trackProgressUpdate,
    trackNotification,
    trackSnooze,
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
