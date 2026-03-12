/**
 * ringtoneManager.js
 * Manages Noxa's ringtone catalogue, per-category sound routing,
 * user preferences, preloading, and playback.
 *
 * Every notification type from NotificationContext is mapped to a
 * sound category so tasks, goals, reminders and system events each
 * have their own distinct sound — while still respecting the user's
 * chosen ringtone for the "user-selected" category.
 */

import { RingtonePlayer } from './RingtonePlayer';

// ─── Ringtone catalogue ───────────────────────────────────────────────────────
// Place MP3 files in /public/sounds/ringtones/
// Free sources: mixkit.co · freesound.org · zapsplat.com
export const RINGTONE_CATALOGUE = {
  // ── User-selectable ringtones (shown in settings picker) ──────────────────
  Default: {
    label: 'Default',
    url: '/sounds/ringtones/default.mp3',
    loop: false,
    userSelectable: true,
  },
  Classic: {
    label: 'Classic Ring',
    url: '/sounds/ringtones/classic-ring.mp3',
    loop: true,
    userSelectable: true,
  },
  Chime: {
    label: 'Soft Chime',
    url: '/sounds/ringtones/soft-chime.mp3',
    loop: false,
    userSelectable: true,
  },
  Bell: {
    label: 'Bell',
    url: '/sounds/ringtones/bell.mp3',
    loop: false,
    userSelectable: true,
  },
  Ding: {
    label: 'Ding',
    url: '/sounds/ringtones/ding.mp3',
    loop: false,
    userSelectable: true,
  },
  Alert: {
    label: 'Alert',
    url: '/sounds/ringtones/alert.mp3',
    loop: false,
    userSelectable: true,
  },
  Retro: {
    label: 'Retro Phone',
    url: '/sounds/ringtones/retro-phone.mp3',
    loop: true,
    userSelectable: true,
  },

  // ── Category-specific sounds (not shown in picker, played automatically) ──
  TaskSound: {
    label: 'Task Sound',
    url: '/sounds/ringtones/task-sound.mp3',
    loop: false,
    userSelectable: false,
  },
  GoalSound: {
    label: 'Goal Sound',
    url: '/sounds/ringtones/goal-sound.mp3',
    loop: false,
    userSelectable: false,
  },
  ReminderSound: {
    label: 'Reminder Sound',
    url: '/sounds/ringtones/reminder-sound.mp3',
    loop: true,
    userSelectable: false,
  },
  SystemSound: {
    label: 'System Sound',
    url: '/sounds/ringtones/system-sound.mp3',
    loop: false,
    userSelectable: false,
  },
};

// ─── Notification type → sound category mapping ───────────────────────────────
const NOTIFICATION_SOUND_MAP = {
  // Task events
  task_created:              'task',
  task_completed:            'task',
  task_in_progress:          'task',
  task_updated:              'task',
  task_deleted:              'task',
  task_reminder:             'reminder',
  // Goal events
  goal_created:              'goal',
  goal_completed:            'goal',
  goal_updated:              'goal',
  goal_progress:             'goal',
  goal_deleted:              'goal',
  goal_milestone:            'goal',
  goal_reminder:             'reminder',
  goal_deadline_approaching: 'reminder',
  automation_enabled:        'goal',
  // Reminder events
  reminder_created:          'task',
  reminder_triggered:        'reminder',
  reminder_snoozed:          'system',
  reminder_completed:        'task',
  reminder_updated:          'task',
  reminder_deleted:          'system',
  reminder_reopened:         'reminder',
  reminders_cleared:         'system',
  // Note events
  note_created:              'task',
  note_updated:              'task',
  note_deleted:              'system',
  // Account / auth events
  account_created:           'user',
  user_logged_in:            'system',
  profile_updated:           'system',
  profile_image_uploaded:    'system',
  // Generic
  socket_message:            'user',
};

const resolveSoundCategory = (notificationType = '') => {
  const key = String(notificationType).toLowerCase().trim();
  if (NOTIFICATION_SOUND_MAP[key]) return NOTIFICATION_SOUND_MAP[key];
  if (key.startsWith('task_'))        return 'task';
  if (key.startsWith('goal_'))        return 'goal';
  if (key.startsWith('reminder_'))    return 'reminder';
  if (key.startsWith('note_'))        return 'task';
  if (key.startsWith('profile_'))     return 'system';
  if (key.startsWith('account_'))     return 'system';
  if (key.startsWith('automation_'))  return 'goal';
  return 'user';
};

const resolveCatalogueKey = (category, selectedName) => {
  switch (category) {
    case 'task':     return 'TaskSound';
    case 'goal':     return 'GoalSound';
    case 'reminder': return 'ReminderSound';
    case 'system':   return 'SystemSound';
    case 'silent':   return null;
    case 'user':
    default:
      return selectedName || 'Default';
  }
};

const STORAGE_KEY = 'noxa_selected_ringtone';
const DEFAULT_RINGTONE = 'Default';
const CUSTOM_UPLOAD_KEY = 'CustomUpload';

class RingtoneManager {
  constructor() {
    this.player = new RingtonePlayer();
    this.selectedName = this._loadPreference();
    this._initiated = false;
    this.customUpload = null;
  }

  init() {
    if (this._initiated) return;
    this.player.init();
    this._initiated = true;
  }

  async preloadAll() {
    this.init();
    await Promise.allSettled(
      Object.entries(RINGTONE_CATALOGUE).map(([name, { url }]) =>
        this.player.load(name, url)
      )
    );
  }

  async preloadEssential() {
    this.init();
    const essential = [
      this.selectedName,
      'TaskSound',
      'GoalSound',
      'ReminderSound',
      'SystemSound',
    ];
    await Promise.allSettled(
      essential
        .map((name) => this._resolveTone(name))
        .filter(Boolean)
        .map(({ key, url }) => this.player.load(key, url))
    );
  }

  // Main entry point — called by NotificationContext with the notificationType
  async playForType(notificationType, volume = 1.0) {
    this.init();
    const category = resolveSoundCategory(notificationType);
    if (category === 'silent') return false;
    const baseKey = resolveCatalogueKey(category, this.selectedName);
    const resolved = this._resolveTone(baseKey) || this._resolveTone(DEFAULT_RINGTONE);
    if (!resolved) return false;
    return this.player.play(resolved.key, resolved.url, {
      loop: resolved.loop,
      volume,
    });
  }

  // Play user's selected ringtone (test / generic)
  async ring(volume = 1.0) {
    this.init();
    const resolved = this._resolveTone(this.selectedName) || this._resolveTone(DEFAULT_RINGTONE);
    if (!resolved) return false;
    return this.player.play(resolved.key, resolved.url, {
      loop: resolved.loop,
      volume,
    });
  }

  async preview(name, volume = 0.8) {
    this.init();
    const resolved = this._resolveTone(name);
    if (!resolved) return false;
    return this.player.play(resolved.key, resolved.url, {
      loop: false,
      volume,
    });
  }

  // Allows runtime uploads from settings page.
  async load(name, url, options = {}) {
    this.init();
    const key = String(name || '').trim() || CUSTOM_UPLOAD_KEY;
    if (!url) return false;

    if (RINGTONE_CATALOGUE[key]) {
      await this.player.load(key, url);
      return true;
    }

    this.customUpload = {
      key,
      label: options.label || 'Custom Upload',
      url,
      loop: Boolean(options.loop),
      userSelectable: true,
    };
    await this.player.load(key, url);
    return true;
  }

  stop(fade = true) {
    if (fade) this.player.fadeOut(0.5);
    else this.player.stop();
  }

  setVolume(value) {
    this.player.setVolume(value);
  }

  select(name) {
    if (!RINGTONE_CATALOGUE[name] && this.customUpload?.key !== name) return;
    this.selectedName = name;
    if (name !== CUSTOM_UPLOAD_KEY) {
      this._savePreference(name);
    }
  }

  // Only returns user-selectable entries for the settings picker
  getList() {
    const list = Object.entries(RINGTONE_CATALOGUE)
      .filter(([, { userSelectable }]) => userSelectable)
      .map(([name, { label }]) => ({
        name,
        label,
        selected: name === this.selectedName,
      }));

    if (this.customUpload) {
      list.push({
        name: this.customUpload.key,
        label: this.customUpload.label,
        selected: this.customUpload.key === this.selectedName,
      });
    }

    return list;
  }

  getSoundCategory(notificationType) {
    return resolveSoundCategory(notificationType);
  }

  get isPlaying() {
    return this.player.isPlaying;
  }

  _loadPreference() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return RINGTONE_CATALOGUE[stored]?.userSelectable ? stored : DEFAULT_RINGTONE;
    } catch {
      return DEFAULT_RINGTONE;
    }
  }

  _savePreference(name) {
    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch { }
  }

  _resolveTone(name) {
    if (name && RINGTONE_CATALOGUE[name]) {
      return {
        key: name,
        ...RINGTONE_CATALOGUE[name],
      };
    }

    if (name && this.customUpload?.key === name) {
      return {
        key: this.customUpload.key,
        label: this.customUpload.label,
        url: this.customUpload.url,
        loop: this.customUpload.loop,
        userSelectable: true,
      };
    }

    return null;
  }
}

export const ringtoneManager = new RingtoneManager();
export { resolveSoundCategory };
