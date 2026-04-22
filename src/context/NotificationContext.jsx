// src/context/NotificationContext.jsx
// ─── CHANGES ──────────────────────────────────────────────────────────────────
// 1. Replaced the base64 soundLibrary + HTMLAudio approach with ringtoneManager
//    (Web Audio API) for all in-app notification sounds.
// 2. Added `customRingtones` setting support — when enabled, ringtoneManager.ring()
//    is used; when disabled, falls back to the original Audio() beep behaviour.
// 3. Added `ringtoneVolume` to notificationSettings (0.0–1.0, default 0.8).
// 4. Exposed `ringtoneManager` and `previewRingtone` on context value so settings
//    UI can drive the ringtone picker without importing the singleton directly.
// 5. One-time init of ringtoneManager on first user interaction.
// 6. Service worker BroadcastChannel listener — push notifications that arrive
//    while the tab is open will also trigger the ringtone.
// 7. [FIX] BroadcastChannel listener now correctly wired to playNotificationSoundRef
//    so push-triggered sounds actually fire.
// 8. [FIX] ringtoneManager.preloadEssential / preloadAll now only run after
//    AudioContext is confirmed running (avoids silent failures on suspended ctx).
// 9. [FIX] ensureReady in RingtonePlayer returns a boolean; play() guards on it
//    so a suspended context never silently swallows playback.
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { getAuthTokens } from '../services/authService';
import { useAuth } from '../hooks/UseAuth';
import backendService from '../services/backendService';
import { ringtoneManager, RINGTONE_CATALOGUE } from '../services/ringtones/RingtoneManager';
import { useTasks } from './TaskContext';
import {
  getQuietHoursStatus,
  isQuietHoursActive,
  normalizeDefaultSnoozeMinutes,
} from '../utils/notificationPreferences';

const NotificationContext = createContext(null);

const MAX_NOTIFICATIONS = 100;
const DEFAULT_DEDUPE_MS = 1500;
const SOCKET_DEDUPE_MS = 5000;
const RECENT_CACHE_TTL_MS = 60000;
const NOTIFICATION_SETTINGS_STORAGE_KEY = 'noxa_notification_settings';
const NOTIFICATIONS_STORAGE_KEY = 'noxa_notifications';
const LEGACY_NOTIFICATIONS_MIGRATION_KEY = 'noxa_notifications_migrated_v2';
const NOTIFICATION_RETENTION_MS = 1000 * 60 * 60 * 24 * 30;
const SCHEDULED_TRIGGER_CACHE_STORAGE_KEY = 'noxa_scheduled_trigger_cache';
const SCHEDULED_TRIGGER_RETENTION_MS = 1000 * 60 * 60 * 24 * 90;
const REMINDER_SCHEDULER_INTERVAL_MS = 30000;
const QUIET_MODE_CACHE_NAME = 'noxa-notification-state';
const QUIET_MODE_CACHE_KEY = '/__noxa_notification_quiet_mode__';
const TASK_REMINDER_OFFSET_MS = {
  '1_hour_before': 60 * 60 * 1000,
  '2_hours_before': 2 * 60 * 60 * 1000,
  '1_day_before': 24 * 60 * 60 * 1000,
  '2_days_before': 2 * 24 * 60 * 60 * 1000,
  '1_week_before': 7 * 24 * 60 * 60 * 1000,
  on_due_date: 0,
};

const DEFAULT_NOTIFICATION_SETTINGS = {
  enableNotifications: true,
  pushNotifications: false,
  emailNotifications: false,
  // ── Ringtone settings ──────────────────────────────────────────────────────
  customRingtones: false,       // false = old beep, true = Web Audio ringtone
  defaultSound: 'Default',     // key in RINGTONE_CATALOGUE
  soundEnabled: true,
  ringtoneVolume: 0.8,         // 0.0 – 1.0
  soundSnoozedUntil: null,
  defaultReminderTime: '15 minutes before',
  taskNotificationMethod: 'app',
  quietHoursStart: '10:00 PM',
  quietHoursEnd: '7:00 AM',
  quietHoursDisabledUntil: null,
  checkInFrequency: 'Weekly',
  goalNotificationMethod: 'app',
  defaultAdvanceNotice: '30 minutes before',
  multipleReminders: false,
  eventNotificationMethod: 'app',
  defaultSnoozeMinutes: 30,
};

const buildNotificationsStorageKey = (userId = '') => {
  const normalizedUserId = normalizeText(userId, '');
  return normalizedUserId
    ? `${NOTIFICATIONS_STORAGE_KEY}:${normalizedUserId}`
    : NOTIFICATIONS_STORAGE_KEY;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
      ...parsed,
      defaultSnoozeMinutes: normalizeDefaultSnoozeMinutes(
        parsed.defaultSnoozeMinutes,
        DEFAULT_NOTIFICATION_SETTINGS.defaultSnoozeMinutes
      ),
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

const readTimestamp = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const normalizeReminderMethod = (method, fallback = 'app') => {
  const value = String(method || '').toLowerCase();
  if (value === 'email') return 'email';
  if (value === 'both') return 'both';
  if (value === 'app' || value === 'in_app') return 'app';
  return fallback;
};

const shouldPlayReminderSound = (method) => normalizeReminderMethod(method) !== 'email';

const getInitialScheduledTriggerCache = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SCHEDULED_TRIGGER_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const persistScheduledTriggerCache = (cache) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SCHEDULED_TRIGGER_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {}
};

const readServiceWorkerQuietMode = async () => {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    const cache = await window.caches.open(QUIET_MODE_CACHE_NAME);
    const response = await cache.match(QUIET_MODE_CACHE_KEY);
    if (!response) return null;
    const payload = await response.json();
    if (!payload || typeof payload !== 'object') return null;
    return normalizeText(payload.quietUntil, '');
  } catch {
    return null;
  }
};

const pruneScheduledTriggerCache = (cache, now = Date.now()) => {
  const next = {};
  Object.entries(cache || {}).forEach(([key, value]) => {
    if (!Number.isFinite(Number(value))) return;
    if (now - Number(value) > SCHEDULED_TRIGGER_RETENTION_MS) return;
    next[key] = Number(value);
  });
  return next;
};

const addMonths = (timestamp, months) => {
  const next = new Date(timestamp);
  next.setMonth(next.getMonth() + months);
  return next.getTime();
};

const advanceReminderTime = (timestamp, frequency) => {
  switch (String(frequency || '').toLowerCase()) {
    case 'daily':
      return timestamp + 24 * 60 * 60 * 1000;
    case 'weekly':
      return timestamp + 7 * 24 * 60 * 60 * 1000;
    case 'monthly':
      return addMonths(timestamp, 1);
    default:
      return null;
  }
};

const getNextReminderTimestamp = (timestamp, frequency, now = Date.now()) => {
  let next = advanceReminderTime(timestamp, frequency);
  while (next && next <= now) {
    next = advanceReminderTime(next, frequency);
  }
  return next;
};

const resolveScheduledReminderType = (reminder) => {
  if (reminder?.linkedGoalId) return 'goal_reminder';
  if (reminder?.taskId || reminder?.linkedTaskId) return 'task_reminder';
  return 'reminder_triggered';
};

const getReminderOriginPath = (reminder) => {
  if (reminder?.linkedGoalId) {
    return `/goals/${encodeURIComponent(String(reminder.linkedGoalId))}`;
  }
  if (reminder?.taskId || reminder?.linkedTaskId) {
    const taskId = reminder.taskId || reminder.linkedTaskId;
    return `/tasks#task-${encodeURIComponent(String(taskId))}`;
  }
  return '/reminders';
};

const buildReminderScheduleKey = (reminder) =>
  `reminder:${String(reminder?.id || 'unknown')}:${normalizeText(reminder?.reminderTime, 'none')}`;

const buildTaskReminderScheduleKey = (taskId, scheduleTime, timing, frequency) =>
  `task:${String(taskId)}:${String(scheduleTime)}:${normalizeText(timing, 'none')}:${normalizeText(frequency, 'once')}`;

const getTaskReminderBaseTime = (task) => {
  const dueTimestamp = readTimestamp(task?.dueDate);
  if (dueTimestamp === null) return null;

  const settings = task?.reminderSettings || {};
  if (settings.timing === 'custom') {
    return readTimestamp(settings.customTime);
  }

  const offset = TASK_REMINDER_OFFSET_MS[settings.timing] ?? TASK_REMINDER_OFFSET_MS['1_day_before'];
  return dueTimestamp - offset;
};

const getTaskReminderScheduleTimes = (task) => {
  const dueTimestamp = readTimestamp(task?.dueDate);
  const baseTimestamp = getTaskReminderBaseTime(task);
  const settings = task?.reminderSettings || {};
  const frequency = String(settings.frequency || 'once').toLowerCase();

  if (dueTimestamp === null || baseTimestamp === null) return [];

  if (frequency === 'multiple') {
    return [
      dueTimestamp - TASK_REMINDER_OFFSET_MS['1_week_before'],
      dueTimestamp - TASK_REMINDER_OFFSET_MS['2_days_before'],
      dueTimestamp - TASK_REMINDER_OFFSET_MS['1_day_before'],
      dueTimestamp - TASK_REMINDER_OFFSET_MS['2_hours_before'],
      dueTimestamp - TASK_REMINDER_OFFSET_MS['1_hour_before'],
      dueTimestamp,
    ]
      .filter((value) => Number.isFinite(value))
      .filter((value, index, list) => list.indexOf(value) === index)
      .sort((left, right) => left - right);
  }

  if (frequency === 'daily') {
    const times = [];
    let cursor = baseTimestamp;
    const ceiling = Math.max(dueTimestamp, baseTimestamp);
    while (cursor <= ceiling) {
      times.push(cursor);
      cursor += 24 * 60 * 60 * 1000;
    }
    return times;
  }

  return [baseTimestamp];
};

const readStoredNotifications = (storageKey = NOTIFICATIONS_STORAGE_KEY) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const normalized = parsed
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry, index) => {
        const rawTimestamp = normalizeText(entry.timestamp, '');
        const parsedTimestamp = rawTimestamp ? new Date(rawTimestamp) : new Date();
        const safeTimestamp = Number.isNaN(parsedTimestamp.getTime())
          ? new Date()
          : parsedTimestamp;
        if (now - safeTimestamp.getTime() > NOTIFICATION_RETENTION_MS) return null;
        return {
          id: entry.id ?? `${safeTimestamp.getTime()}-${index}`,
          title: normalizeText(entry.title, 'Notification'),
          message: normalizeText(entry.message, 'Activity update'),
          type: normalizeText(entry.type, 'info'),
          itemId: entry.itemId ?? null,
          itemTitle: normalizeText(entry.itemTitle, ''),
          itemType: normalizeText(entry.itemType, 'system'),
          notificationType: normalizeText(entry.notificationType, 'socket_message'),
          originPath: normalizeText(entry.originPath, '/notifications'),
          read: Boolean(entry.read),
          time: normalizeText(
            entry.time,
            safeTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          ),
          date: normalizeText(entry.date, safeTimestamp.toLocaleDateString()),
          onClick: null,
          timestamp: safeTimestamp.toISOString(),
          source: normalizeText(entry.source, 'local'),
        };
      })
      .filter(Boolean);
    return normalized.slice(0, MAX_NOTIFICATIONS);
  } catch {
    return [];
  }
};

const resolveNotificationOriginPath = ({ itemType = '', itemId = null, notificationType = '', item = {} }) => {
  const t = normalizeText(itemType, '').toLowerCase();
  const nt = normalizeText(notificationType, '').toLowerCase();
  const encoded = itemId ? encodeURIComponent(String(itemId)) : '';
  const taskAnchor = encoded ? `#task-${encoded}` : '';
  if (t === 'task') return `/tasks${taskAnchor}`;
  if (t === 'goal') return encoded ? `/goals/${encoded}` : '/goals';
  if (t === 'reminder') return '/reminders';
  if (t === 'note') return '/notes';
  if (t === 'profile' || t === 'account') return '/account';
  if (nt.startsWith('task_')) return `/tasks${taskAnchor}`;
  if (nt.startsWith('goal_')) return encoded ? `/goals/${encoded}` : '/goals';
  if (nt.startsWith('reminder_')) return '/reminders';
  if (nt.startsWith('note_')) return '/notes';
  if (nt.startsWith('profile_') || nt.startsWith('account_') || nt === 'user_logged_in') return '/account';
  if (nt.startsWith('automation_')) return '/goals';
  if (item?.goalId) return `/goals/${encodeURIComponent(String(item.goalId))}`;
  if (item?.taskId) return `/tasks#task-${encodeURIComponent(String(item.taskId))}`;
  return '/notifications';
};

const getNotificationTemplate = (type, item, templateOverride = null) => {
  const title = normalizeText(item?.title, 'Untitled');
  const progress = Number.isFinite(Number(item?.progress)) ? Number(item.progress) : null;
  const count = Number.isFinite(Number(item?.count)) ? Number(item.count) : null;
  const cat = normalizeText(item?.category, 'general').toLowerCase();
  const catLabel = { work: 'Work', personal: 'Personal', ideas: 'Ideas' }[cat] || 'General';

  if (templateOverride) {
    return {
      title: normalizeText(templateOverride.title, 'Notification'),
      message: normalizeText(templateOverride.message, title || 'Activity update'),
      type: normalizeText(templateOverride.type, 'info'),
    };
  }

  const templates = {
    task_created:              { title: 'Task Created',         message: `Created: "${title}"`,                              type: 'success' },
    task_completed:            { title: 'Task Completed',       message: `Completed: "${title}"`,                           type: 'success' },
    task_in_progress:          { title: 'Task In Progress',     message: `Started working on: "${title}"`,                  type: 'info'    },
    task_updated:              { title: 'Task Updated',         message: `Updated: "${title}"`,                             type: 'info'    },
    task_deleted:              { title: 'Task Deleted',         message: `Deleted: "${title}"`,                             type: 'warning' },
    goal_created:              { title: 'Goal Created',         message: `New goal: "${title}"`,                            type: 'success' },
    goal_completed:            { title: 'Goal Completed',       message: `Completed: "${title}"`,                           type: 'success' },
    goal_updated:              { title: 'Goal Updated',         message: `Updated: "${title}"`,                             type: 'info'    },
    goal_progress:             { title: 'Progress Updated',     message: `"${title}" is now at ${progress ?? 0}%`,          type: 'info'    },
    goal_deleted:              { title: 'Goal Deleted',         message: `Removed: "${title}"`,                             type: 'warning' },
    goal_milestone:            { title: 'Milestone Reached',    message: `Milestone achieved for "${title}"`,               type: 'success' },
    goal_reminder:             { title: 'Goal Reminder',        message: `Do not forget: "${title}"`,                       type: 'info'    },
    goal_deadline_approaching: { title: 'Deadline Approaching', message: `"${title}" is due soon`,                          type: 'warning' },
    automation_enabled:        { title: 'Automation Enabled',   message: `"${title}" now has automation enabled`,           type: 'success' },
    task_reminder:             { title: 'Task Reminder',        message: `Time to work on "${title}"`,                     type: 'info'    },
    reminder_created:          { title: 'Reminder Set',         message: `Reminder created: "${title}"`,                   type: 'success' },
    reminder_triggered:        { title: 'Reminder',             message: title,                                             type: 'info'    },
    reminder_snoozed:          { title: 'Reminder Snoozed',     message: `"${title}" snoozed`,                              type: 'info'    },
    reminder_completed:        { title: 'Reminder Completed',   message: `Completed: "${title}"`,                          type: 'success' },
    reminder_updated:          { title: 'Reminder Updated',     message: `Updated: "${title}"`,                             type: 'info'    },
    reminder_deleted:          { title: 'Reminder Deleted',     message: `Deleted: "${title}"`,                             type: 'warning' },
    reminder_reopened:         { title: 'Reminder Reopened',    message: `Marked pending: "${title}"`,                     type: 'info'    },
    reminders_cleared:         { title: 'Reminders Cleared',    message: `Cleared ${count ?? 0} completed reminders`,      type: 'info'    },
    account_created:           { title: 'Account Created',      message: 'Welcome to Noxa. Your account is ready.',        type: 'success' },
    user_logged_in:            { title: 'Login Successful',     message: 'You signed in successfully.',                     type: 'success' },
    profile_updated:           { title: 'Profile Updated',      message: title,                                             type: 'success' },
    profile_image_uploaded:    { title: 'Image Uploaded',       message: title,                                             type: 'success' },
    note_created:              { title: `${catLabel} Note Created`, message: `Created "${title}" in ${catLabel}`,          type: 'success' },
    note_updated:              { title: `${catLabel} Note Updated`, message: `Updated "${title}" in ${catLabel}`,          type: 'info'    },
    note_deleted:              { title: 'Note Deleted',         message: `Deleted: "${title}"`,                             type: 'warning' },
    socket_message:            { title: 'Notification',         message: title || 'Realtime update',                       type: 'info'    },
  };

  return templates[type] || { title: 'Notification', message: title || 'Activity update', type: 'info' };
};

const buildDedupeKey = ({ type, item, eventId, dedupeKey }) => {
  if (dedupeKey) return `custom:${dedupeKey}`;
  if (eventId !== undefined && eventId !== null) return `event:${String(eventId)}`;
  return `${type}:${normalizeText(item?.id, 'none')}:${normalizeText(item?.title, '')}:${normalizeText(item?.status, '')}:${normalizeText(item?.progress, '')}:${normalizeText(item?.itemType, '')}`;
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

// ─── Provider ─────────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children }) => {
  const {
    token: authTokenFromContext,
    isAuthenticated,
    loading: authLoading,
    user,
    updateProfile,
  } = useAuth();
  const { tasks, reminders, updateReminder } = useTasks();

  const [notifications, setNotifications] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(getInitialNotificationSettings);
  const [quietModeHydrated, setQuietModeHydrated] = useState(() => typeof window === 'undefined');
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window === 'undefined') return 'unsupported';
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  // Legacy HTMLAudio ref — used as fallback when customRingtones is OFF
  const audioRef = useRef(null);
  const recentDispatchRef = useRef(new Map());
  const swRegistrationRef = useRef(null);
  const pushEndpointRef = useRef('');
  const vapidPublicKeyRef = useRef('');
  const ringtoneInitialisedRef = useRef(false);
  const syncedRingtoneRef = useRef('');
  const scheduledTriggerCacheRef = useRef(
    pruneScheduledTriggerCache(getInitialScheduledTriggerCache())
  );

  // Stable ref always pointing to the latest playNotificationSound closure.
  // The BroadcastChannel listener captures this ref once on mount, but always
  // calls the up-to-date function — so settings changes are reflected instantly.
  const playNotificationSoundRef = useRef(null);

  const pushSupported =
    notificationPermission !== 'unsupported' &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;
  const notificationStorageKey = isAuthenticated
    ? buildNotificationsStorageKey(user?.id || user?._id)
    : null;
  const isSoundSnoozed = useCallback(() => {
    const snoozedUntil = readTimestamp(notificationSettings.soundSnoozedUntil);
    return snoozedUntil !== null && snoozedUntil > Date.now();
  }, [notificationSettings.soundSnoozedUntil]);
  const quietHoursStatus = useMemo(
    () =>
      getQuietHoursStatus(
        notificationSettings.quietHoursStart,
        notificationSettings.quietHoursEnd,
        new Date(),
        notificationSettings.quietHoursDisabledUntil
      ),
    [
      notificationSettings.quietHoursDisabledUntil,
      notificationSettings.quietHoursEnd,
      notificationSettings.quietHoursStart,
    ]
  );
  const isInQuietHours = useCallback(
    () =>
      isQuietHoursActive(
        notificationSettings.quietHoursStart,
        notificationSettings.quietHoursEnd,
        new Date(),
        notificationSettings.quietHoursDisabledUntil
      ),
    [
      notificationSettings.quietHoursDisabledUntil,
      notificationSettings.quietHoursEnd,
      notificationSettings.quietHoursStart,
    ]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const hasMigrated = window.localStorage.getItem(LEGACY_NOTIFICATIONS_MIGRATION_KEY);
      if (hasMigrated) return;

      // Remove the old shared notification bucket so one user's feed cannot bleed into another's.
      window.localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      window.localStorage.setItem(LEGACY_NOTIFICATIONS_MIGRATION_KEY, 'true');
    } catch (error) {
      console.warn('Failed to migrate legacy notifications:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || authLoading) return;

    recentDispatchRef.current.clear();

    if (!isAuthenticated || !notificationStorageKey) {
      setNotifications([]);
      return;
    }

    setNotifications(readStoredNotifications(notificationStorageKey));
  }, [authLoading, isAuthenticated, notificationStorageKey]);

  useEffect(() => {
    let isCancelled = false;

    readServiceWorkerQuietMode().then((quietUntil) => {
      if (isCancelled) return;

      const quietUntilTs = readTimestamp(quietUntil);
      if (quietUntilTs !== null && quietUntilTs > Date.now()) {
        setNotificationSettings((prev) => {
          const localQuietUntilTs = readTimestamp(prev.soundSnoozedUntil);
          if (localQuietUntilTs !== null && localQuietUntilTs >= quietUntilTs) {
            return prev;
          }
          return {
            ...prev,
            soundSnoozedUntil: new Date(quietUntilTs).toISOString(),
          };
        });
      }

      setQuietModeHydrated(true);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  // ─── Init ringtoneManager on first user interaction ────────────────────────
  // AudioContext requires a user gesture before it can run. We wait for the
  // first click/keydown/touch, then init + preload. This also resumes any
  // suspended context that the browser may have paused before user interaction.
  useEffect(() => {
    const initOnGesture = async () => {
      if (ringtoneInitialisedRef.current) return;
      ringtoneInitialisedRef.current = true;

      // Sync selected ringtone + volume from persisted settings
      const savedRingtone = notificationSettings.defaultSound;
      if (RINGTONE_CATALOGUE[savedRingtone]) {
        ringtoneManager.select(savedRingtone);
      }
      ringtoneManager.setVolume(notificationSettings.ringtoneVolume ?? 0.8);

      // init() creates the AudioContext; ensureReady() resumes it if suspended
      ringtoneManager.init();
      try {
        await ringtoneManager.player.ensureReady();
      } catch {
        // Browser blocked resume — sounds will attempt to play on next gesture
      }

      // Preload the selected ringtone + category sounds first, rest lazily
      ringtoneManager.preloadEssential().then(() => {
        ringtoneManager.preloadAll();
      });
    };

    window.addEventListener('click',      initOnGesture, { once: true });
    window.addEventListener('keydown',    initOnGesture, { once: true });
    window.addEventListener('touchstart', initOnGesture, { once: true, passive: true });

    return () => {
      window.removeEventListener('click',      initOnGesture);
      window.removeEventListener('keydown',    initOnGesture);
      window.removeEventListener('touchstart', initOnGesture);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Keep ringtoneManager in sync when settings change ────────────────────
  useEffect(() => {
    if (RINGTONE_CATALOGUE[notificationSettings.defaultSound]) {
      ringtoneManager.select(notificationSettings.defaultSound);
    }
    ringtoneManager.setVolume(notificationSettings.ringtoneVolume ?? 0.8);
  }, [notificationSettings.defaultSound, notificationSettings.ringtoneVolume]);

  useEffect(() => {
    const serverSelectedRingtone = normalizeText(user?.selectedRingtone, '');
    if (!serverSelectedRingtone || !RINGTONE_CATALOGUE[serverSelectedRingtone]) return;

    syncedRingtoneRef.current = serverSelectedRingtone;
    setNotificationSettings((prev) => {
      if (prev.defaultSound === serverSelectedRingtone) {
        return prev;
      }
      return { ...prev, defaultSound: serverSelectedRingtone };
    });
    ringtoneManager.select(serverSelectedRingtone);
  }, [user?.selectedRingtone]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    if (!RINGTONE_CATALOGUE[notificationSettings.defaultSound]) return;
    if (user?.selectedRingtone === notificationSettings.defaultSound) {
      syncedRingtoneRef.current = notificationSettings.defaultSound;
      return;
    }
    if (syncedRingtoneRef.current === notificationSettings.defaultSound) return;

    syncedRingtoneRef.current = notificationSettings.defaultSound;
    updateProfile({ selectedRingtone: notificationSettings.defaultSound }).catch(() => {
      syncedRingtoneRef.current = normalizeText(user?.selectedRingtone, '');
    });
  }, [
    authLoading,
    isAuthenticated,
    notificationSettings.defaultSound,
    updateProfile,
    user?.selectedRingtone,
  ]);

  // ─── Persist settings ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      NOTIFICATION_SETTINGS_STORAGE_KEY,
      JSON.stringify(notificationSettings)
    );
  }, [notificationSettings]);

  // ─── Persist notifications ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || authLoading) return;
    try {
      if (!isAuthenticated || !notificationStorageKey) {
        window.localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
        return;
      }

      const serializable = notifications
        .slice(0, MAX_NOTIFICATIONS)
        .map((notification) => {
          const s = { ...notification };
          delete s.onClick;
          return s;
        });
      window.localStorage.setItem(notificationStorageKey, JSON.stringify(serializable));
      window.localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to persist notifications:', error);
    }
  }, [authLoading, isAuthenticated, notificationStorageKey, notifications]);

  // ─── Sync permission state ─────────────────────────────────────────────────
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

  // ─── Legacy Audio element (fallback for when customRingtones is OFF) ────────
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = 0.5;
    return () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current = null;
    };
  }, []);

  // ─── Sound library (legacy beep fallback) ─────────────────────────────────
  const soundLibrary = useMemo(() => ({
    Default:      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    Chime:        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    Bell:         'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    Ding:         'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    Alert:        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
    Notification: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSeHzfPTgjMGHm7A7+OZSR4NVqzn77BiFQo+ltfyxnElBSl+y/PZiToIGGS45ueVTQ0MUqXi8LJnHwU2jtPyvm4gBSV7yfLaizsIG2ex6+aQSgoNT6Li8bVrIwU0itDwwXMkBihzxe/glEILFFqv5vCsWRkLRpjb8sFuIgUneMfw2Ik5CBt2w+/mnlEQDk+j4/G2aR4GMIzO8cR3KwUrfcXv3I9ACxVesOPwqFgYCkOb3PK+cCIGJ3PG8N2ORw0TTKHh8LZsIQYugMvx0H8yBxty',
  }), []);

  const shouldSuppressDuplicate = useCallback((key, dedupeMs = DEFAULT_DEDUPE_MS) => {
    const now = Date.now();
    const cache = recentDispatchRef.current;
    for (const [existingKey, ts] of cache.entries()) {
      if (now - ts > RECENT_CACHE_TTL_MS) cache.delete(existingKey);
    }
    const previous = cache.get(key);
    if (previous && now - previous < dedupeMs) return true;
    cache.set(key, now);
    return false;
  }, []);

  // ─── Core sound playback ───────────────────────────────────────────────────
  // notificationType routes to the correct category sound:
  //   task_*      → TaskSound MP3
  //   goal_*      → GoalSound MP3
  //   reminder_*  → ReminderSound MP3 (loops)
  //   system/*    → SystemSound MP3
  //   everything else → user's selected ringtone from the picker
  const playNotificationSound = useCallback((notificationType = 'socket_message') => {
    if (
      !notificationSettings.enableNotifications ||
      !notificationSettings.soundEnabled ||
      isSoundSnoozed() ||
      isInQuietHours()
    ) {
      return;
    }

    const volume = notificationSettings.ringtoneVolume ?? 0.8;

    if (notificationSettings.customRingtones) {
      // ── Web Audio API path ─────────────────────────────────────────────────
      ringtoneManager
        .playForType(notificationType, volume)
        .catch(() => {});
    } else {
      // ── Legacy HTMLAudio fallback ──────────────────────────────────────────
      try {
        if (!audioRef.current) return;
        const soundPath =
          soundLibrary[notificationSettings.defaultSound] || soundLibrary.Default;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = soundPath;
        const p = audioRef.current.play();
        if (p?.catch) p.catch(() => {});
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    }
  }, [
    notificationSettings.enableNotifications,
    notificationSettings.soundEnabled,
    isSoundSnoozed,
    isInQuietHours,
    notificationSettings.customRingtones,
    notificationSettings.defaultSound,
    notificationSettings.ringtoneVolume,
    soundLibrary,
  ]);

  // Keep the ref up-to-date so the BroadcastChannel listener (registered once
  // on mount) always invokes the current closure with latest settings.
  useEffect(() => {
    playNotificationSoundRef.current = playNotificationSound;
  }, [playNotificationSound]);

  // ─── BroadcastChannel: receive ring trigger from service worker ────────────
  // sw.js posts { type: 'PLAY_RINGTONE', payload } when a push arrives while
  // the tab is open. We extract notificationType so the correct category sound
  // plays (reminder vs task vs goal etc.).
  //
  // KEY FIX: this effect runs once on mount and captures playNotificationSoundRef
  // (a stable ref). It does NOT depend on playNotificationSound directly —
  // that would re-register the channel on every settings change and cause
  // missed messages during the brief teardown/re-attach window.
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    const channel = new BroadcastChannel('noxa-notification-channel');

    channel.addEventListener('message', (event) => {
      const { type, payload } = event.data || {};

      if (type === 'PLAY_RINGTONE') {
        const notifType =
          payload?.data?.notificationType ||
          payload?.data?.type           ||
          payload?.notificationType     ||
          'socket_message';
        // Call via ref so we always use the latest closure (no stale settings)
        playNotificationSoundRef.current?.(notifType);
      }

      // User dismissed or actioned the OS notification — stop looping sounds
      if (type === 'NOTIFICATION_ACTION') {
        if (payload?.action === 'snooze') {
          const quietUntil = readTimestamp(payload?.quietUntil);
          if (quietUntil !== null && quietUntil > Date.now()) {
            setNotificationSettings((prev) => ({
              ...prev,
              soundSnoozedUntil: new Date(quietUntil).toISOString(),
            }));
          }
        }
        ringtoneManager.stop();
      }
    });

    return () => channel.close();
  }, []); // intentionally empty — stable via ref

  // ─── Preview a ringtone from settings UI ──────────────────────────────────
  const previewRingtone = useCallback((name, volume) => {
    const resolvedVolume =
      Number.isFinite(Number(volume)) ? Number(volume) : (notificationSettings.ringtoneVolume ?? 0.8);
    ringtoneManager.preview(name, resolvedVolume);
  }, [notificationSettings.ringtoneVolume]);

  // ─── Stop ringtone (e.g. when user dismisses an alert) ────────────────────
  const stopRingtone = useCallback(() => {
    ringtoneManager.stop();
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
    }
  }, []);

  const muteNotificationSounds = useCallback(() => {
    stopRingtone();
    setNotificationSettings((prev) => ({
      ...prev,
      soundEnabled: false,
      soundSnoozedUntil: null,
    }));
  }, [stopRingtone]);

  const unmuteNotificationSounds = useCallback(() => {
    setNotificationSettings((prev) => ({
      ...prev,
      soundEnabled: true,
      soundSnoozedUntil: null,
    }));
  }, []);

  const snoozeNotificationSounds = useCallback((minutes = 30) => {
    const safeMinutes =
      Number.isFinite(Number(minutes)) && Number(minutes) > 0 ? Number(minutes) : 30;
    stopRingtone();
    setNotificationSettings((prev) => ({
      ...prev,
      soundSnoozedUntil: new Date(Date.now() + safeMinutes * 60 * 1000).toISOString(),
    }));
  }, [stopRingtone]);

  const clearNotificationSoundSnooze = useCallback(() => {
    setNotificationSettings((prev) => ({
      ...prev,
      soundSnoozedUntil: null,
    }));
  }, []);

  const updateNotificationSettings = useCallback((newSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      ...newSettings,
      defaultSnoozeMinutes: normalizeDefaultSnoozeMinutes(
        newSettings?.defaultSnoozeMinutes,
        prev.defaultSnoozeMinutes ?? DEFAULT_NOTIFICATION_SETTINGS.defaultSnoozeMinutes
      ),
    }));
  }, []);

  const disableQuietHoursForCurrentWindow = useCallback(() => {
    const status = getQuietHoursStatus(
      notificationSettings.quietHoursStart,
      notificationSettings.quietHoursEnd,
      new Date(),
      null
    );
    if (!status.scheduledActive || !status.windowEnd) return null;

    const disabledUntil = status.windowEnd.toISOString();
    setNotificationSettings((prev) => ({
      ...prev,
      quietHoursDisabledUntil: disabledUntil,
    }));
    return disabledUntil;
  }, [notificationSettings.quietHoursEnd, notificationSettings.quietHoursStart]);

  const clearQuietHoursOverride = useCallback(() => {
    setNotificationSettings((prev) => ({
      ...prev,
      quietHoursDisabledUntil: null,
    }));
  }, []);

  useEffect(() => {
    if (notificationSettings.enableNotifications && notificationSettings.soundEnabled) return;
    stopRingtone();
  }, [notificationSettings.enableNotifications, notificationSettings.soundEnabled, stopRingtone]);

  useEffect(() => {
    if (!isSoundSnoozed()) return;
    stopRingtone();
  }, [isSoundSnoozed, notificationSettings.soundSnoozedUntil, stopRingtone]);

  useEffect(() => {
    const snoozedUntil = readTimestamp(notificationSettings.soundSnoozedUntil);
    if (snoozedUntil === null) return undefined;

    if (snoozedUntil <= Date.now()) {
      setNotificationSettings((prev) =>
        prev.soundSnoozedUntil ? { ...prev, soundSnoozedUntil: null } : prev
      );
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotificationSettings((prev) =>
        prev.soundSnoozedUntil ? { ...prev, soundSnoozedUntil: null } : prev
      );
    }, snoozedUntil - Date.now());

    return () => window.clearTimeout(timeoutId);
  }, [notificationSettings.soundSnoozedUntil]);

  useEffect(() => {
    const disabledUntil = readTimestamp(notificationSettings.quietHoursDisabledUntil);
    if (disabledUntil === null) return undefined;

    if (disabledUntil <= Date.now()) {
      setNotificationSettings((prev) =>
        prev.quietHoursDisabledUntil ? { ...prev, quietHoursDisabledUntil: null } : prev
      );
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotificationSettings((prev) =>
        prev.quietHoursDisabledUntil ? { ...prev, quietHoursDisabledUntil: null } : prev
      );
    }, disabledUntil - Date.now());

    return () => window.clearTimeout(timeoutId);
  }, [notificationSettings.quietHoursDisabledUntil]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRingtone();
      }
    };

    const handleWindowBlur = () => stopRingtone();
    const handlePageHide = () => stopRingtone();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [stopRingtone]);

  const navigateToNotificationOrigin = useCallback((originPath) => {
    if (typeof window === 'undefined' || !originPath) return;
    try {
      const [pathWithSearch, rawHash = ''] = String(originPath).split('#');
      if (!pathWithSearch) return;
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (currentPath !== pathWithSearch) {
        window.history.pushState({}, '', pathWithSearch);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      if (rawHash) {
        const decodedHash = decodeURIComponent(rawHash);
        window.setTimeout(() => {
          const targetElement = document.getElementById(decodedHash);
          if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          window.location.hash = `#${rawHash}`;
        }, 200);
      }
    } catch {
      window.location.assign(originPath);
    }
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

  const syncServiceWorkerPreferences = useCallback(async (message) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      const target =
        registration.active || navigator.serviceWorker.controller || registration.waiting || registration.installing;
      target?.postMessage(message);
    } catch (error) {
      console.warn('Failed to sync notification preferences to service worker:', error);
    }
  }, []);

  const syncQuietModeToServiceWorker = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const quietUntil = readTimestamp(notificationSettings.soundSnoozedUntil);
    const payload = {
      quietUntil: quietUntil !== null && quietUntil > Date.now() ? new Date(quietUntil).toISOString() : null,
    };

    await syncServiceWorkerPreferences({
      type: 'SET_NOTIFICATION_QUIET_MODE',
      payload,
    });
  }, [notificationSettings.soundSnoozedUntil, syncServiceWorkerPreferences]);

  useEffect(() => {
    if (!quietModeHydrated) return;
    syncQuietModeToServiceWorker();
  }, [quietModeHydrated, syncQuietModeToServiceWorker]);

  useEffect(() => {
    syncServiceWorkerPreferences({
      type: 'SET_DEFAULT_SNOOZE_MINUTES',
      payload: {
        defaultSnoozeMinutes: normalizeDefaultSnoozeMinutes(
          notificationSettings.defaultSnoozeMinutes,
          DEFAULT_NOTIFICATION_SETTINGS.defaultSnoozeMinutes
        ),
      },
    });
  }, [notificationSettings.defaultSnoozeMinutes, syncServiceWorkerPreferences]);

  useEffect(() => {
    syncServiceWorkerPreferences({
      type: 'SET_NOTIFICATION_QUIET_HOURS',
      payload: {
        quietHoursStart: notificationSettings.quietHoursStart,
        quietHoursEnd: notificationSettings.quietHoursEnd,
        quietHoursDisabledUntil: notificationSettings.quietHoursDisabledUntil,
      },
    });
  }, [
    notificationSettings.quietHoursDisabledUntil,
    notificationSettings.quietHoursEnd,
    notificationSettings.quietHoursStart,
    syncServiceWorkerPreferences,
  ]);

  const resolveVapidPublicKey = useCallback(async () => {
    if (vapidPublicKeyRef.current) return vapidPublicKeyRef.current;
    const fromEnv = normalizeText(import.meta.env.VITE_VAPID_PUBLIC_KEY, '');
    if (fromEnv) { vapidPublicKeyRef.current = fromEnv; return fromEnv; }
    try {
      const fromApi = await backendService.getPushPublicKey();
      if (fromApi) { vapidPublicKeyRef.current = fromApi; return fromApi; }
    } catch (error) {
      console.warn('Unable to fetch VAPID public key:', error);
    }
    return '';
  }, []);

  const ensureServiceWorkerRegistration = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
    if (swRegistrationRef.current) return swRegistrationRef.current;
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
          try { await backendService.unsubscribePushNotifications(endpoint); } catch {}
        }
        await existingSubscription.unsubscribe();
      } else if (pushEndpointRef.current && isAuthenticated) {
        try { await backendService.unsubscribePushNotifications(pushEndpointRef.current); } catch {}
      }
      pushEndpointRef.current = '';
      return;
    }

    const vapidPublicKey = await resolveVapidPublicKey();
    if (!vapidPublicKey) { console.warn('Missing VAPID public key.'); return; }

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
    resolveVapidPublicKey,
  ]);

  useEffect(() => {
    if (authLoading) return;
    syncPushSubscription().catch((error) => {
      console.warn('Push subscription sync failed:', error);
    });
  }, [authLoading, syncPushSubscription]);

  const showBrowserNotification = useCallback((notification) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (!notificationSettings.enableNotifications || !notificationSettings.pushNotifications) return;
    if (isSoundSnoozed()) return;
    if (isInQuietHours()) return;
    if (notificationPermission !== 'granted') return;

    const instance = new Notification(notification.title, {
      body: notification.message,
      tag: String(notification.id),
      renotify: false,
    });

    instance.onclick = () => {
      window.focus();
      if (typeof notification.onClick === 'function') {
        try { notification.onClick(); } catch {}
      }
      navigateToNotificationOrigin(notification.originPath);
      instance.close();
    };

    window.setTimeout(() => instance.close(), 10000);
  }, [
    isSoundSnoozed,
    isInQuietHours,
    navigateToNotificationOrigin,
    notificationSettings.enableNotifications,
    notificationSettings.pushNotifications,
    notificationPermission,
  ]);

  const addNotification = useCallback((type, item = {}, onClick = null, playSound = true, options = {}) => {
    const source = normalizeText(options.source, 'local');
    const itemPayload = item || {};
    const normalizedType = normalizeText(type, 'socket_message');
    const dedupeKey = buildDedupeKey({
      type: normalizedType,
      item: itemPayload,
      eventId: options.eventId,
      dedupeKey: options.dedupeKey,
    });

    if (shouldSuppressDuplicate(dedupeKey, options.dedupeMs ?? DEFAULT_DEDUPE_MS)) return null;

    const template = getNotificationTemplate(normalizedType, itemPayload, options.templateOverride || null);
    const now = new Date();
    const itemTypeFromType = normalizedType.includes('_') ? normalizedType.split('_')[0] : null;
    const itemType = normalizeText(options.itemType, itemTypeFromType || normalizeText(itemPayload.itemType, 'system'));
    const itemId = itemPayload.id ?? options.eventId ?? Date.now();
    const originPath = normalizeText(
      options.originPath,
      resolveNotificationOriginPath({ itemType, itemId, notificationType: normalizedType, item: itemPayload })
    );

    const newNotification = {
      id: options.eventId ?? `${Date.now()}-${Math.random()}`,
      title: template.title,
      message: template.message,
      type: template.type,
      itemId,
      itemTitle: normalizeText(itemPayload.title, ''),
      itemType,
      notificationType: normalizedType,
      originPath,
      read: false,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: now.toLocaleDateString(),
      onClick: onClick || null,
      timestamp: options.timestamp || now.toISOString(),
      source,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
    if (playSound) playNotificationSound(normalizedType);
    if (source === 'socket' || source === 'scheduler') showBrowserNotification(newNotification);
    return newNotification;
  }, [playNotificationSound, shouldSuppressDuplicate, showBrowserNotification]);

  const markScheduledTrigger = useCallback((scheduleKey, firedAt = Date.now()) => {
    const next = pruneScheduledTriggerCache(scheduledTriggerCacheRef.current, firedAt);
    next[scheduleKey] = firedAt;
    scheduledTriggerCacheRef.current = next;
    persistScheduledTriggerCache(next);
  }, []);

  useEffect(() => {
    scheduledTriggerCacheRef.current = pruneScheduledTriggerCache(scheduledTriggerCacheRef.current);
    persistScheduledTriggerCache(scheduledTriggerCacheRef.current);
  }, []);

  useEffect(() => {
    if (authLoading || isAuthenticated) {
      return undefined;
    }

    const runReminderScheduler = () => {
      const now = Date.now();

      const manualReminders = Array.isArray(reminders) ? reminders : [];
      manualReminders.forEach((reminder) => {
        if (!reminder || reminder.status === 'completed') return;

        const reminderTimestamp = readTimestamp(reminder.reminderTime);
        if (reminderTimestamp === null || reminderTimestamp > now) return;

        const scheduleKey = buildReminderScheduleKey(reminder);
        if (scheduledTriggerCacheRef.current[scheduleKey]) return;

        const notificationType = resolveScheduledReminderType(reminder);
        const itemType = reminder.linkedGoalId
          ? 'goal'
          : reminder.taskId || reminder.linkedTaskId
          ? 'task'
          : 'reminder';

        addNotification(
          notificationType,
          {
            ...reminder,
            id: reminder.id,
            itemType,
            taskId: reminder.taskId || reminder.linkedTaskId || null,
            goalId: reminder.linkedGoalId || null,
          },
          null,
          shouldPlayReminderSound(reminder.notificationMethod),
          {
            source: 'scheduler',
            dedupeKey: scheduleKey,
            eventId: scheduleKey,
            itemType,
            originPath: getReminderOriginPath(reminder),
            timestamp: new Date(reminderTimestamp).toISOString(),
          }
        );

        markScheduledTrigger(scheduleKey, now);

        const nextReminderTimestamp = getNextReminderTimestamp(reminderTimestamp, reminder.frequency, now);
        if (nextReminderTimestamp) {
          updateReminder(reminder.id, {
            reminderTime: new Date(nextReminderTimestamp).toISOString(),
            status: 'upcoming',
            lastTriggeredAt: new Date(now).toISOString(),
          });
        } else if (reminder.status !== 'today') {
          updateReminder(reminder.id, {
            status: 'today',
            lastTriggeredAt: new Date(now).toISOString(),
          });
        }
      });

      const automatedTasks = Array.isArray(tasks) ? tasks : [];
      automatedTasks.forEach((task) => {
        if (!task || task.completed || !task.reminderSettings?.enabled) return;

        const scheduleTimes = getTaskReminderScheduleTimes(task);
        if (scheduleTimes.length === 0) return;

        const latestDueScheduleTime = [...scheduleTimes]
          .filter((scheduleTime) => Number.isFinite(scheduleTime) && scheduleTime <= now)
          .sort((left, right) => right - left)
          .find((scheduleTime) => {
            const scheduleKey = buildTaskReminderScheduleKey(
              task.id,
              scheduleTime,
              task.reminderSettings?.timing,
              task.reminderSettings?.frequency
            );
            return !scheduledTriggerCacheRef.current[scheduleKey];
          });

        if (!Number.isFinite(latestDueScheduleTime)) return;

        const scheduleKey = buildTaskReminderScheduleKey(
          task.id,
          latestDueScheduleTime,
          task.reminderSettings?.timing,
          task.reminderSettings?.frequency
        );

        addNotification(
          'task_reminder',
          {
            ...task,
            itemType: 'task',
            reminderTime: new Date(latestDueScheduleTime).toISOString(),
            taskId: task.id,
          },
          null,
          shouldPlayReminderSound(task.reminderSettings?.notificationMethod),
          {
            source: 'scheduler',
            dedupeKey: scheduleKey,
            eventId: scheduleKey,
            itemType: 'task',
            originPath: `/tasks#task-${encodeURIComponent(String(task.id))}`,
            timestamp: new Date(latestDueScheduleTime).toISOString(),
          }
        );

        markScheduledTrigger(scheduleKey, now);
      });
    };

    runReminderScheduler();
    const intervalId = window.setInterval(runReminderScheduler, REMINDER_SCHEDULER_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [addNotification, authLoading, isAuthenticated, markScheduledTrigger, reminders, tasks, updateReminder]);

  // ─── Socket.io ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const enableFlag = import.meta.env.VITE_ENABLE_SOCKET_NOTIFICATIONS;
    const socketUrl = normalizeText(import.meta.env.VITE_SOCKET_IO_URL, '');
    const apiBaseUrl = normalizeText(import.meta.env.VITE_API_BASE_URL, '');
    const scriptUrlFromEnv = normalizeText(import.meta.env.VITE_SOCKET_IO_SCRIPT_URL, '');
    const authToken = getAuthTokens()?.accessToken || authTokenFromContext || null;
    const shouldAttemptConnection = Boolean(
      authToken && (enableFlag === 'true' || socketUrl || apiBaseUrl || scriptUrlFromEnv || window.io)
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
            callback({ token: getAuthTokens()?.accessToken || authTokenFromContext || null });
          },
        });

        socketInstance.on('connect',       () => { if (!isDisposed) setSocketConnected(true);  });
        socketInstance.on('disconnect',    () => { if (!isDisposed) setSocketConnected(false); });
        socketInstance.on('connect_error', () => { if (!isDisposed) setSocketConnected(false); });

        const handleSocketPayload = (payload) => {
          const data = payload || {};
          const rawType =
            normalizeText(data.notificationType, '') ||
            normalizeText(data.eventType, '')        ||
            normalizeText(data.action, '')           ||
            normalizeText(data.type, '');
          const knownType = rawType.includes('_') ? rawType : 'socket_message';
          const severity = ['success', 'info', 'warning', 'error'].includes(rawType) ? rawType : 'info';
          const hasCustomTitleOrMessage = Boolean(data.title || data.message);
          const item = data.item || {
            id: data.itemId ?? data.id,
            title: data.itemTitle || data.title || data.message || 'Realtime update',
            progress: data.progress,
            status: data.status,
          };
          const templateOverride = hasCustomTitleOrMessage
            ? {
                title:   normalizeText(data.title,   'Notification'),
                message: normalizeText(data.message, normalizeText(item?.title, 'Realtime update')),
                type:    severity,
              }
            : null;

          addNotification(knownType, item, null, data.playSound !== false, {
            source:          'socket',
            eventId:         data.eventId ?? data.notificationId ?? data.id,
            dedupeMs:        SOCKET_DEDUPE_MS,
            itemType:        data.itemType,
            templateOverride,
          });
        };

        socketInstance.on('notification',  handleSocketPayload);
        socketInstance.on('notifications', (list) => {
          if (!Array.isArray(list)) return;
          list.forEach((entry) => handleSocketPayload(entry));
        });

        cleanupNotification  = () => socketInstance?.off('notification',  handleSocketPayload);
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

  // ─── Notification list helpers ─────────────────────────────────────────────
  const addTaskNotification = addNotification;

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const clearNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const getNotificationsByType = useCallback(
    (itemType) => notifications.filter((n) => n.itemType === itemType),
    [notifications]
  );

  const getNotificationsByItem = useCallback(
    (itemId, itemType) =>
      notifications.filter((n) => n.itemId === itemId && n.itemType === itemType),
    [notifications]
  );

  const getUnreadCount = useCallback(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const testNotificationSound = useCallback(() => {
    playNotificationSound();
  }, [playNotificationSound]);

  // ─── Context value ─────────────────────────────────────────────────────────
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
    disableQuietHoursForCurrentWindow,
    clearQuietHoursOverride,
    muteNotificationSounds,
    unmuteNotificationSounds,
    snoozeNotificationSounds,
    clearNotificationSoundSnooze,
    isSoundSnoozed: isSoundSnoozed(),
    isInQuietHours: quietHoursStatus.active,
    quietHoursWindowEnd: quietHoursStatus.windowEnd ? quietHoursStatus.windowEnd.toISOString() : null,
    quietHoursOverrideActive: quietHoursStatus.overrideActive,
    requestPushPermission,
    playNotificationSound,
    testNotificationSound,
    // ── Ringtone API ─────────────────────────────────────────────────────────
    previewRingtone,                    // (name: string, volume?: number) => void
    stopRingtone,                       // () => void  — fade out current sound
    ringtoneList: ringtoneManager.getList(), // [{ name, label, selected }]
    RINGTONE_CATALOGUE,                 // exported for settings UI
    soundSnoozedUntil: notificationSettings.soundSnoozedUntil,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
