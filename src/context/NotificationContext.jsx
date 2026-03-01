// src/context/NotificationContext.jsx
import React, { createContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { getAuthTokens } from '../services/authService';
import { useAuth } from '../hooks/UseAuth';
import backendService from '../services/backendService';

const NotificationContext = createContext(null);

const MAX_NOTIFICATIONS = 100;
const DEFAULT_DEDUPE_MS = 1500;
const SOCKET_DEDUPE_MS = 5000;
const RECENT_CACHE_TTL_MS = 60000;
const NOTIFICATION_SETTINGS_STORAGE_KEY = 'noxa_notification_settings';
const DEFAULT_NOTIFICATION_SETTINGS = {
  enableNotifications: true,
  pushNotifications: false,
  emailNotifications: false,
  customRingtones: false,
  defaultSound: 'Default',
  soundEnabled: true
};

const urlBase64ToUint8Array = (base64String = '') => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

const getInitialNotificationSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SETTINGS;

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_NOTIFICATION_SETTINGS;
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...parsed
    };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

const normalizeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
};

const getNotificationTemplate = (type, item, templateOverride = null) => {
  const title = normalizeText(item?.title, 'Untitled');
  const progress = Number.isFinite(Number(item?.progress)) ? Number(item.progress) : null;
  const count = Number.isFinite(Number(item?.count)) ? Number(item.count) : null;
  const normalizedCategory = normalizeText(item?.category, 'general').toLowerCase();
  const noteCategoryLabel =
    normalizedCategory === 'work'
      ? 'Work'
      : normalizedCategory === 'personal'
      ? 'Personal'
      : normalizedCategory === 'ideas'
      ? 'Ideas'
      : 'General';

  if (templateOverride) {
    return {
      title: normalizeText(templateOverride.title, 'Notification'),
      message: normalizeText(templateOverride.message, title || 'Activity update'),
      type: normalizeText(templateOverride.type, 'info')
    };
  }

  const templates = {
    task_created: { title: 'Task Created', message: `Created: "${title}"`, type: 'success' },
    task_completed: { title: 'Task Completed', message: `Completed: "${title}"`, type: 'success' },
    task_in_progress: { title: 'Task In Progress', message: `Started working on: "${title}"`, type: 'info' },
    task_updated: { title: 'Task Updated', message: `Updated: "${title}"`, type: 'info' },
    task_deleted: { title: 'Task Deleted', message: `Deleted: "${title}"`, type: 'warning' },
    goal_created: { title: 'Goal Created', message: `New goal: "${title}"`, type: 'success' },
    goal_completed: { title: 'Goal Completed', message: `Completed: "${title}"`, type: 'success' },
    goal_updated: { title: 'Goal Updated', message: `Updated: "${title}"`, type: 'info' },
    goal_progress: { title: 'Progress Updated', message: `"${title}" is now at ${progress ?? 0}%`, type: 'info' },
    goal_deleted: { title: 'Goal Deleted', message: `Removed: "${title}"`, type: 'warning' },
    goal_milestone: { title: 'Milestone Reached', message: `Milestone achieved for "${title}"`, type: 'success' },
    goal_reminder: { title: 'Goal Reminder', message: `Do not forget: "${title}"`, type: 'info' },
    goal_deadline_approaching: { title: 'Deadline Approaching', message: `"${title}" is due soon`, type: 'warning' },
    automation_enabled: { title: 'Automation Enabled', message: `"${title}" now has automation enabled`, type: 'success' },
    reminder_created: { title: 'Reminder Set', message: `Reminder created: "${title}"`, type: 'success' },
    reminder_triggered: { title: 'Reminder', message: title, type: 'info' },
    reminder_snoozed: { title: 'Reminder Snoozed', message: `"${title}" snoozed`, type: 'info' },
    reminder_completed: { title: 'Reminder Completed', message: `Completed: "${title}"`, type: 'success' },
    reminder_updated: { title: 'Reminder Updated', message: `Updated: "${title}"`, type: 'info' },
    reminder_deleted: { title: 'Reminder Deleted', message: `Deleted: "${title}"`, type: 'warning' },
    reminder_reopened: { title: 'Reminder Reopened', message: `Marked pending: "${title}"`, type: 'info' },
    reminders_cleared: { title: 'Reminders Cleared', message: `Cleared ${count ?? 0} completed reminders`, type: 'info' },
    profile_updated: { title: 'Profile Updated', message: title, type: 'success' },
    profile_image_uploaded: { title: 'Image Uploaded', message: title, type: 'success' },
    note_created: {
      title: `${noteCategoryLabel} Note Created`,
      message: `Created "${title}" in ${noteCategoryLabel}`,
      type: 'success'
    },
    note_updated: {
      title: `${noteCategoryLabel} Note Updated`,
      message: `Updated "${title}" in ${noteCategoryLabel}`,
      type: 'info'
    },
    note_deleted: { title: 'Note Deleted', message: `Deleted: "${title}"`, type: 'warning' },
    socket_message: { title: 'Notification', message: title || 'Realtime update', type: 'info' }
  };

  return templates[type] || {
    title: 'Notification',
    message: title || 'Activity update',
    type: 'info'
  };
};

const buildDedupeKey = ({ type, item, eventId, dedupeKey }) => {
  if (dedupeKey) return `custom:${dedupeKey}`;
  if (eventId !== undefined && eventId !== null) return `event:${String(eventId)}`;

  const idPart = normalizeText(item?.id, 'none');
  const titlePart = normalizeText(item?.title, '');
  const statusPart = normalizeText(item?.status, '');
  const progressPart = normalizeText(item?.progress, '');
  const itemTypePart = normalizeText(item?.itemType, '');
  return `${type}:${idPart}:${titlePart}:${statusPart}:${progressPart}:${itemTypePart}`;
};

const loadSocketScript = (scriptUrl) => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if (typeof window.io === 'function') return Promise.resolve(window.io);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-socket-io="true"][src="${scriptUrl}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.io));
      existing.addEventListener('error', () => reject(new Error('Failed to load socket.io script')));
      return;
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.dataset.socketIo = 'true';
    script.onload = () => resolve(window.io);
    script.onerror = () => reject(new Error('Failed to load socket.io script'));
    document.head.appendChild(script);
  });
};

export const NotificationProvider = ({ children }) => {
  const { token: authTokenFromContext, isAuthenticated, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(getInitialNotificationSettings);
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window === 'undefined') return 'unsupported';
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  const audioRef = useRef(null);
  const recentDispatchRef = useRef(new Map());
  const swRegistrationRef = useRef(null);
  const pushEndpointRef = useRef('');
  const vapidPublicKeyRef = useRef('');
  const pushSupported = notificationPermission !== 'unsupported';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      NOTIFICATION_SETTINGS_STORAGE_KEY,
      JSON.stringify(notificationSettings)
    );
  }, [notificationSettings]);

  useEffect(() => {
    if (!pushSupported) return undefined;

    const syncPermission = () => setNotificationPermission(Notification.permission);
    syncPermission();

    window.addEventListener('focus', syncPermission);
    document.addEventListener('visibilitychange', syncPermission);
    return () => {
      window.removeEventListener('focus', syncPermission);
      document.removeEventListener('visibilitychange', syncPermission);
    };
  }, [pushSupported]);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = 0.5;
    return () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current = null;
    };
  }, []);

  const soundLibrary = useMemo(() => ({
    Default: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    Chime: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    Bell: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    Ding: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    Alert: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    Notification: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty'
  }), []);

  const shouldSuppressDuplicate = useCallback((key, dedupeMs = DEFAULT_DEDUPE_MS) => {
    const now = Date.now();
    const cache = recentDispatchRef.current;
    for (const [existingKey, ts] of cache.entries()) {
      if (now - ts > RECENT_CACHE_TTL_MS) {
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

  const playNotificationSound = useCallback(() => {
    if (!notificationSettings.enableNotifications || !notificationSettings.soundEnabled) {
      return;
    }

    try {
      if (!audioRef.current) return;
      const soundPath = soundLibrary[notificationSettings.defaultSound] || soundLibrary.Default;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = soundPath;
      const playPromise = audioRef.current.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [
    notificationSettings.enableNotifications,
    notificationSettings.soundEnabled,
    notificationSettings.defaultSound,
    soundLibrary
  ]);

  const updateNotificationSettings = useCallback((newSettings) => {
    setNotificationSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const requestPushPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      return 'granted';
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  const resolveVapidPublicKey = useCallback(async () => {
    if (vapidPublicKeyRef.current) {
      return vapidPublicKeyRef.current;
    }

    const fromEnv = normalizeText(import.meta.env.VITE_VAPID_PUBLIC_KEY, '');
    if (fromEnv) {
      vapidPublicKeyRef.current = fromEnv;
      return fromEnv;
    }

    try {
      const fromApi = await backendService.getPushPublicKey();
      if (fromApi) {
        vapidPublicKeyRef.current = fromApi;
        return fromApi;
      }
    } catch (error) {
      console.warn('Unable to fetch VAPID public key:', error);
    }

    return '';
  }, []);

  const ensureServiceWorkerRegistration = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    if (swRegistrationRef.current) {
      return swRegistrationRef.current;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    swRegistrationRef.current = registration;
    return registration;
  }, []);

  const syncPushSubscription = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!pushSupported) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const registration = await ensureServiceWorkerRegistration();
    if (!registration) return;

    const shouldBeSubscribed =
      isAuthenticated &&
      !authLoading &&
      notificationSettings.enableNotifications &&
      notificationSettings.pushNotifications &&
      notificationPermission === 'granted';

    const existingSubscription = await registration.pushManager.getSubscription();

    if (!shouldBeSubscribed) {
      if (existingSubscription) {
        const endpoint = existingSubscription.endpoint || pushEndpointRef.current;
        if (endpoint && isAuthenticated) {
          try {
            await backendService.unsubscribePushNotifications(endpoint);
          } catch (error) {
            console.warn('Failed to unregister push subscription on backend:', error);
          }
        }

        await existingSubscription.unsubscribe();
      } else if (pushEndpointRef.current && isAuthenticated) {
        try {
          await backendService.unsubscribePushNotifications(pushEndpointRef.current);
        } catch (error) {
          console.warn('Failed to unregister stale push endpoint:', error);
        }
      }

      pushEndpointRef.current = '';
      return;
    }

    const vapidPublicKey = await resolveVapidPublicKey();
    if (!vapidPublicKey) {
      console.warn('Missing VAPID public key. Push subscription is not configured.');
      return;
    }

    let subscription = existingSubscription;
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const serialized = subscription.toJSON ? subscription.toJSON() : subscription;
    await backendService.subscribePushNotifications(serialized);
    pushEndpointRef.current = subscription.endpoint || '';
  }, [
    authLoading,
    ensureServiceWorkerRegistration,
    isAuthenticated,
    notificationPermission,
    notificationSettings.enableNotifications,
    notificationSettings.pushNotifications,
    pushSupported,
    resolveVapidPublicKey
  ]);

  const showBrowserNotification = useCallback((notification) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (!notificationSettings.enableNotifications || !notificationSettings.pushNotifications) return;
    if (notificationPermission !== 'granted') return;

    const instance = new Notification(notification.title, {
      body: notification.message,
      tag: String(notification.id),
      renotify: false
    });

    instance.onclick = () => {
      window.focus();
      instance.close();
    };

    window.setTimeout(() => instance.close(), 10000);
  }, [
    notificationSettings.enableNotifications,
    notificationSettings.pushNotifications,
    notificationPermission
  ]);

  useEffect(() => {
    if (authLoading) return;

    syncPushSubscription().catch((error) => {
      console.warn('Push subscription sync failed:', error);
    });
  }, [authLoading, syncPushSubscription]);

  const addNotification = useCallback((type, item = {}, onClick = null, playSound = true, options = {}) => {
    const source = normalizeText(options.source, 'local');
    const itemPayload = item || {};
    const normalizedType = normalizeText(type, 'socket_message');
    const dedupeKey = buildDedupeKey({
      type: normalizedType,
      item: itemPayload,
      eventId: options.eventId,
      dedupeKey: options.dedupeKey
    });

    if (shouldSuppressDuplicate(dedupeKey, options.dedupeMs ?? DEFAULT_DEDUPE_MS)) {
      return null;
    }

    const template = getNotificationTemplate(normalizedType, itemPayload, options.templateOverride || null);
    const now = new Date();
    const itemTypeFromType = normalizedType.includes('_') ? normalizedType.split('_')[0] : null;
    const itemType = normalizeText(options.itemType, itemTypeFromType || normalizeText(itemPayload.itemType, 'system'));
    const itemId = itemPayload.id ?? options.eventId ?? Date.now();

    const newNotification = {
      id: options.eventId ?? `${Date.now()}-${Math.random()}`,
      title: template.title,
      message: template.message,
      type: template.type,
      itemId,
      itemTitle: normalizeText(itemPayload.title, ''),
      itemType,
      notificationType: normalizedType,
      read: false,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString(),
      onClick: onClick || null,
      timestamp: options.timestamp || now.toISOString(),
      source
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
    if (playSound) playNotificationSound();
    if (source === 'socket') showBrowserNotification(newNotification);
    return newNotification;
  }, [playNotificationSound, shouldSuppressDuplicate, showBrowserNotification]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const enableFlag = import.meta.env.VITE_ENABLE_SOCKET_NOTIFICATIONS;
    const socketUrl = normalizeText(import.meta.env.VITE_SOCKET_IO_URL, '');
    const apiBaseUrl = normalizeText(import.meta.env.VITE_API_BASE_URL, '');
    const scriptUrlFromEnv = normalizeText(import.meta.env.VITE_SOCKET_IO_SCRIPT_URL, '');
    const authToken = getAuthTokens()?.accessToken || authTokenFromContext || null;
    const shouldAttemptConnection = Boolean(
      authToken &&
        (enableFlag === 'true' || socketUrl || apiBaseUrl || scriptUrlFromEnv || window.io)
    );

    if (!shouldAttemptConnection) return undefined;

    let isDisposed = false;
    let socketInstance = null;
    let cleanupNotification = null;
    let cleanupNotifications = null;

    const initializeSocket = async () => {
      const baseUrl = socketUrl || apiBaseUrl || window.location.origin;
      const scriptUrl = scriptUrlFromEnv || `${baseUrl.replace(/\/$/, '')}/socket.io/socket.io.js`;

      try {
        let ioFactory = window.io;
        if (typeof ioFactory !== 'function') {
          ioFactory = await loadSocketScript(scriptUrl);
        }
        if (typeof ioFactory !== 'function' || isDisposed) return;

        socketInstance = ioFactory(baseUrl, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
          auth: (callback) => {
            callback({
              token: getAuthTokens()?.accessToken || authTokenFromContext || null
            });
          }
        });

        socketInstance.on('connect', () => {
          if (!isDisposed) setSocketConnected(true);
        });
        socketInstance.on('disconnect', () => {
          if (!isDisposed) setSocketConnected(false);
        });
        socketInstance.on('connect_error', () => {
          if (!isDisposed) setSocketConnected(false);
        });

        const handleSocketPayload = (payload) => {
          const data = payload || {};
          const rawType = normalizeText(data.notificationType, '') ||
            normalizeText(data.eventType, '') ||
            normalizeText(data.action, '') ||
            normalizeText(data.type, '');

          const knownType = rawType.includes('_') ? rawType : 'socket_message';
          const severity = ['success', 'info', 'warning', 'error'].includes(rawType) ? rawType : 'info';
          const hasCustomTitleOrMessage = Boolean(data.title || data.message);

          const item = data.item || {
            id: data.itemId ?? data.id,
            title: data.itemTitle || data.title || data.message || 'Realtime update',
            progress: data.progress,
            status: data.status
          };

          const templateOverride = hasCustomTitleOrMessage
            ? {
                title: normalizeText(data.title, 'Notification'),
                message: normalizeText(data.message, normalizeText(item?.title, 'Realtime update')),
                type: severity
              }
            : null;

          addNotification(knownType, item, null, data.playSound !== false, {
            source: 'socket',
            eventId: data.eventId ?? data.notificationId ?? data.id,
            dedupeMs: SOCKET_DEDUPE_MS,
            itemType: data.itemType,
            templateOverride
          });
        };

        socketInstance.on('notification', handleSocketPayload);
        socketInstance.on('notifications', (list) => {
          if (!Array.isArray(list)) return;
          list.forEach((entry) => handleSocketPayload(entry));
        });

        cleanupNotification = () => socketInstance?.off('notification', handleSocketPayload);
        cleanupNotifications = () => socketInstance?.off('notifications');
      } catch (error) {
        setSocketConnected(false);
        console.warn('Socket notifications unavailable:', error);
      }
    };

    initializeSocket();

    return () => {
      isDisposed = true;
      setSocketConnected(false);
      cleanupNotification?.();
      cleanupNotifications?.();
      if (!socketInstance) return;
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('connect_error');
      socketInstance.disconnect();
      socketInstance = null;
    };
  }, [addNotification, authTokenFromContext]);

  const addTaskNotification = addNotification;

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((notification) => (
      notification.id === id ? { ...notification, read: true } : notification
    )));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const getNotificationsByType = useCallback((itemType) => {
    return notifications.filter((notification) => notification.itemType === itemType);
  }, [notifications]);

  const getNotificationsByItem = useCallback((itemId, itemType) => {
    return notifications.filter((notification) => (
      notification.itemId === itemId && notification.itemType === itemType
    ));
  }, [notifications]);

  const getUnreadCount = useCallback(() => {
    return notifications.filter((notification) => !notification.read).length;
  }, [notifications]);

  const testNotificationSound = useCallback(() => {
    playNotificationSound();
  }, [playNotificationSound]);

  const contextValue = {
    notifications,
    notificationSettings,
    socketConnected,
    pushSupported,
    notificationPermission,
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
    requestPushPermission,
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
