export const REMINDER_TIME_OPTIONS = [
  { value: '5 minutes before', label: '5 minutes before', minutesBefore: 5, taskTimingValue: '5_minutes_before' },
  { value: '10 minutes before', label: '10 minutes before', minutesBefore: 10, taskTimingValue: '10_minutes_before' },
  { value: '15 minutes before', label: '15 minutes before', minutesBefore: 15, taskTimingValue: '15_minutes_before' },
  { value: '30 minutes before', label: '30 minutes before', minutesBefore: 30, taskTimingValue: '30_minutes_before' },
  { value: '1 hour before', label: '1 hour before', minutesBefore: 60, taskTimingValue: '1_hour_before' },
  { value: '2 hours before', label: '2 hours before', minutesBefore: 120, taskTimingValue: '2_hours_before' },
  { value: '1 day before', label: '1 day before', minutesBefore: 1440, taskTimingValue: '1_day_before' },
];

export const GOAL_CHECKIN_FREQUENCY_OPTIONS = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Bi-weekly', label: 'Bi-weekly' },
  { value: 'Monthly', label: 'Monthly' },
];

export const DEFAULT_SNOOZE_MINUTES_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 1440, label: '1 day' },
];

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enableNotifications: true,
  pushNotifications: false,
  emailNotifications: false,
  customRingtones: false,
  defaultSound: 'Default',
  soundEnabled: true,
  ringtoneVolume: 0.8,
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

export const normalizeNotificationMethodPreference = (method, fallback = 'app') => {
  const value = String(method || '').toLowerCase();
  if (value === 'email') return 'email';
  if (value === 'both') return 'both';
  if (value === 'push' || value === 'in_app' || value === 'app') return 'app';
  return fallback;
};

export const normalizeDefaultSnoozeMinutes = (value, fallback = 30) => {
  const numeric = Number(value);
  const allowed = DEFAULT_SNOOZE_MINUTES_OPTIONS.map((option) => option.value);
  return allowed.includes(numeric) ? numeric : fallback;
};

export const getReminderLeadTimeConfig = (value, fallback = DEFAULT_NOTIFICATION_SETTINGS.defaultReminderTime) => {
  const candidate = REMINDER_TIME_OPTIONS.find((option) => option.value === value);
  if (candidate) return candidate;
  return REMINDER_TIME_OPTIONS.find((option) => option.value === fallback) || REMINDER_TIME_OPTIONS[2];
};

export const getReminderLeadTimeMinutes = (value, fallback) =>
  getReminderLeadTimeConfig(value, fallback).minutesBefore;

export const mapReminderLeadTimeToTaskTiming = (value, fallback) =>
  getReminderLeadTimeConfig(value, fallback).taskTimingValue;

export const mapGoalCheckInFrequencyToReminderFrequency = (value, fallback = 'weekly') => {
  const candidate = String(value || '').toLowerCase();
  if (candidate === 'daily') return 'daily';
  if (candidate === 'weekly') return 'weekly';
  if (candidate === 'monthly') return 'monthly';
  if (candidate === 'bi-weekly') return 'weekly';
  return fallback;
};

export const buildTaskChannelsFromMethod = (method) => {
  const normalized = normalizeNotificationMethodPreference(method);
  if (normalized === 'email') {
    return { push: false, email: true, both: false };
  }
  if (normalized === 'both') {
    return { push: false, email: false, both: true };
  }
  return { push: true, email: false, both: false };
};

export const parseTaskChannelsToMethod = (channels = {}) => {
  if (channels.both || (channels.push && channels.email)) return 'both';
  if (channels.email) return 'email';
  if (channels.push) return 'app';
  return DEFAULT_NOTIFICATION_SETTINGS.taskNotificationMethod;
};

export const buildGoalChannelsFromMethod = (method) => {
  const normalized = normalizeNotificationMethodPreference(method);
  if (normalized === 'email') {
    return { push: false, email: true };
  }
  if (normalized === 'both') {
    return { push: true, email: true };
  }
  return { push: true, email: false };
};

export const parseGoalChannelsToMethod = (channels = {}) => {
  if (channels.push && channels.email) return 'both';
  if (channels.email) return 'email';
  if (channels.push) return 'app';
  return DEFAULT_NOTIFICATION_SETTINGS.goalNotificationMethod;
};

export const buildEventChannelsFromMethod = (method) => {
  const normalized = normalizeNotificationMethodPreference(method);
  if (normalized === 'both') {
    return { push: false, both: true };
  }
  return { push: true, both: false };
};

export const parseEventChannelsToMethod = (channels = {}) => {
  if (channels.both) return 'both';
  if (channels.push) return 'app';
  return DEFAULT_NOTIFICATION_SETTINGS.eventNotificationMethod;
};

export const formatSnoozeActionLabel = (minutes) => {
  const numeric = normalizeDefaultSnoozeMinutes(minutes);
  if (numeric % 1440 === 0) {
    const days = numeric / 1440;
    return `Snooze ${days}d`;
  }
  if (numeric % 60 === 0) {
    const hours = numeric / 60;
    return `Snooze ${hours}h`;
  }
  return `Snooze ${numeric}m`;
};

export const parseTimeLabelToMinutes = (value) => {
  const match = String(value || '')
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  const normalizedHours = hours % 12;
  return normalizedHours * 60 + minutes + (meridiem === 'PM' ? 12 * 60 : 0);
};

export const getQuietHoursWindow = (startLabel, endLabel, now = new Date()) => {
  const startMinutes = parseTimeLabelToMinutes(startLabel);
  const endMinutes = parseTimeLabelToMinutes(endLabel);

  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) {
    return {
      scheduledActive: false,
      windowStart: null,
      windowEnd: null,
    };
  }

  const currentTime = now instanceof Date ? now : new Date(now);
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const windowStart = new Date(currentTime);
  const windowEnd = new Date(currentTime);
  windowStart.setSeconds(0, 0);
  windowEnd.setSeconds(0, 0);

  if (startMinutes < endMinutes) {
    if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
      return {
        scheduledActive: false,
        windowStart: null,
        windowEnd: null,
      };
    }

    windowStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    windowEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
    return {
      scheduledActive: true,
      windowStart,
      windowEnd,
    };
  }

  if (currentMinutes >= startMinutes) {
    windowStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    windowEnd.setDate(windowEnd.getDate() + 1);
    windowEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
    return {
      scheduledActive: true,
      windowStart,
      windowEnd,
    };
  }

  if (currentMinutes < endMinutes) {
    windowStart.setDate(windowStart.getDate() - 1);
    windowStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    windowEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
    return {
      scheduledActive: true,
      windowStart,
      windowEnd,
    };
  }

  return {
    scheduledActive: false,
    windowStart: null,
    windowEnd: null,
  };
};

export const getQuietHoursStatus = (
  startLabel,
  endLabel,
  now = new Date(),
  disabledUntil = null
) => {
  const currentTime = now instanceof Date ? now : new Date(now);
  const windowState = getQuietHoursWindow(startLabel, endLabel, currentTime);
  const disabledUntilDate = disabledUntil ? new Date(disabledUntil) : null;
  const overrideActive =
    disabledUntilDate instanceof Date &&
    !Number.isNaN(disabledUntilDate.getTime()) &&
    disabledUntilDate.getTime() > currentTime.getTime();

  return {
    ...windowState,
    disabledUntil: overrideActive ? disabledUntilDate.toISOString() : null,
    overrideActive,
    active: windowState.scheduledActive && !overrideActive,
  };
};

export const isQuietHoursActive = (
  startLabel,
  endLabel,
  now = new Date(),
  disabledUntil = null
) => {
  const status = getQuietHoursStatus(startLabel, endLabel, now, disabledUntil);
  return status.active;
};
