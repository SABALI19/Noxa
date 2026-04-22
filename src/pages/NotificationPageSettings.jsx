import React, { useEffect, useState, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { ringtoneManager } from '../services/ringtones/RingtoneManager';
import {
  REMINDER_TIME_OPTIONS,
  GOAL_CHECKIN_FREQUENCY_OPTIONS,
  buildTaskChannelsFromMethod,
  parseTaskChannelsToMethod,
  buildGoalChannelsFromMethod,
  parseGoalChannelsToMethod,
  buildEventChannelsFromMethod,
  parseEventChannelsToMethod,
} from '../utils/notificationPreferences';

// ─── Reusable sub-components (exact original style + dark mode) ───────────────

const ToggleSwitch = ({ checked, onChange, label, description, disabled = false }) => (
  <div className="flex items-start justify-between gap-4 py-4">
    <div className="flex-1">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">{label}</h3>
      <p className="text-xs font-roboto text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`ml-2 sm:ml-4 relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-100 shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

const Checkbox = ({ checked, onChange, label }) => (
  <label className="flex items-center cursor-pointer py-1.5">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 bg-white dark:bg-gray-800 cursor-pointer"
    />
    <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">{label}</span>
  </label>
);

const SelectDropdown = ({ value, onChange, options, label, description }) => (
  <div className="mb-6">
    <label className="block">
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
      {description && (
        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">{description}</span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 dark:text-gray-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const NotificationPageSettings = () => {
  const {
    notificationSettings,
    updateNotificationSettings,
    requestPushPermission,
    pushSupported,
    notificationPermission,
    previewRingtone,
    stopRingtone,
    ringtoneList,
  } = useNotifications();

  const [enableNotifications, setEnableNotifications] = useState(notificationSettings.enableNotifications);
  const [pushNotifications, setPushNotifications]     = useState(notificationSettings.pushNotifications);
  const [emailNotifications, setEmailNotifications]   = useState(notificationSettings.emailNotifications);
  const [customRingtones, setCustomRingtones]         = useState(notificationSettings.customRingtones ?? false);
  const [defaultSound, setDefaultSound]               = useState(notificationSettings.defaultSound ?? 'Default');
  const [soundEnabled, setSoundEnabled]               = useState(notificationSettings.soundEnabled ?? true);
  const [ringtoneVolume, setRingtoneVolume]           = useState(notificationSettings.ringtoneVolume ?? 0.8);

  const [defaultReminderTime, setDefaultReminderTime] = useState(notificationSettings.defaultReminderTime);
  const [taskNotificationChannels, setTaskNotificationChannels] = useState(
    buildTaskChannelsFromMethod(notificationSettings.taskNotificationMethod)
  );
  const [quietHoursStart, setQuietHoursStart] = useState(notificationSettings.quietHoursStart);
  const [quietHoursEnd, setQuietHoursEnd]     = useState(notificationSettings.quietHoursEnd);
  const [checkInFrequency, setCheckInFrequency] = useState(notificationSettings.checkInFrequency);
  const [goalNotificationChannels, setGoalNotificationChannels] = useState(
    buildGoalChannelsFromMethod(notificationSettings.goalNotificationMethod)
  );
  const [defaultAdvanceNotice, setDefaultAdvanceNotice] = useState(notificationSettings.defaultAdvanceNotice);
  const [multipleReminders, setMultipleReminders] = useState(notificationSettings.multipleReminders ?? false);
  const [eventNotificationChannels, setEventNotificationChannels] = useState(
    buildEventChannelsFromMethod(notificationSettings.eventNotificationMethod)
  );
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewing, setPreviewing]     = useState(null);
  const previewTimerRef                 = useRef(null);

  const reminderTimeOptions = REMINDER_TIME_OPTIONS;
  const frequencyOptions = GOAL_CHECKIN_FREQUENCY_OPTIONS;

  const soundOptions = [
    { value: 'Default',      label: 'Default - C Major Arpeggio'   },
    { value: 'Chime',        label: 'Chime - Subtle Beep'          },
    { value: 'Bell',         label: 'Bell - Classic Bell'          },
    { value: 'Ding',         label: 'Ding - Modern Pop'            },
    { value: 'Alert',        label: 'Alert - Two-Tone Warning'     },
    { value: 'Notification', label: 'Notification - Elegant Chord' },
  ];

  const timeOptions = [
    '12:00 AM','1:00 AM','2:00 AM','3:00 AM','4:00 AM','5:00 AM',
    '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
    '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
    '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:00 PM',
  ].map((t) => ({ value: t, label: t }));

  useEffect(() => {
    setEnableNotifications(notificationSettings.enableNotifications);
    setPushNotifications(notificationSettings.pushNotifications);
    setEmailNotifications(notificationSettings.emailNotifications);
    setCustomRingtones(notificationSettings.customRingtones ?? false);
    setDefaultSound(notificationSettings.defaultSound ?? 'Default');
    setSoundEnabled(notificationSettings.soundEnabled ?? true);
    setRingtoneVolume(notificationSettings.ringtoneVolume ?? 0.8);
    setDefaultReminderTime(notificationSettings.defaultReminderTime);
    setTaskNotificationChannels(buildTaskChannelsFromMethod(notificationSettings.taskNotificationMethod));
    setQuietHoursStart(notificationSettings.quietHoursStart);
    setQuietHoursEnd(notificationSettings.quietHoursEnd);
    setCheckInFrequency(notificationSettings.checkInFrequency);
    setGoalNotificationChannels(buildGoalChannelsFromMethod(notificationSettings.goalNotificationMethod));
    setDefaultAdvanceNotice(notificationSettings.defaultAdvanceNotice);
    setMultipleReminders(notificationSettings.multipleReminders ?? false);
    setEventNotificationChannels(buildEventChannelsFromMethod(notificationSettings.eventNotificationMethod));
  }, [notificationSettings]);

  const handleTaskChannelChange = (channel, checked) => {
    if (!checked) {
      setTaskNotificationChannels(buildTaskChannelsFromMethod('app'));
      return;
    }
    setTaskNotificationChannels(buildTaskChannelsFromMethod(channel === 'push' ? 'app' : channel));
  };

  const handleGoalChannelChange = (channel, checked) => {
    setGoalNotificationChannels((prev) => {
      if (!checked) {
        const next = { ...prev, [channel]: false };
        return next.push || next.email ? next : buildGoalChannelsFromMethod('app');
      }
      return { ...prev, [channel]: true };
    });
  };

  const handleEventChannelChange = (channel, checked) => {
    if (!checked) {
      setEventNotificationChannels(buildEventChannelsFromMethod('app'));
      return;
    }
    setEventNotificationChannels(buildEventChannelsFromMethod(channel === 'push' ? 'app' : 'both'));
  };

  // Built-in oscillator sounds (unchanged from original)
  const playDefaultSound = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [{ freq: 523.25, time: 0 }, { freq: 659.25, time: 0.08 }, { freq: 783.99, time: 0.16 }].forEach(({ freq, time }) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.35);
      osc.start(ctx.currentTime + time); osc.stop(ctx.currentTime + time + 0.35);
    });
  };
  const playChimeSound = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
  };
  const playBellSound = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  };
  const playDingSound = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  };
  const playAlertSound = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.setValueAtTime(500, ctx.currentTime + 0.12);
    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.24);
    gain.gain.setValueAtTime(0.25, ctx.currentTime); gain.gain.setValueAtTime(0, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.12); gain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.24);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  };
  const playNotificationSound = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const t = ctx.currentTime + i * 0.03;
      gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.start(t); osc.stop(t + 0.5);
    });
  };
  const playBuiltInSound = (name) => {
    switch (name) {
      case 'Chime': return playChimeSound();
      case 'Bell':  return playBellSound();
      case 'Ding':  return playDingSound();
      case 'Alert': return playAlertSound();
      case 'Notification': return playNotificationSound();
      default: return playDefaultSound();
    }
  };

  const handleTestSound = () => {
    if (!soundEnabled) { alert('Please enable "Notification Sounds" first!'); return; }
    customRingtones ? ringtoneManager.ring(ringtoneVolume) : playBuiltInSound(defaultSound);
  };

  const handleSelectRingtone = (name) => {
    updateNotificationSettings({ defaultSound: name });
    ringtoneManager.select(name);
  };

  const handlePreview = (name) => {
    clearTimeout(previewTimerRef.current);
    if (previewing === name) { stopRingtone(); setPreviewing(null); return; }
    stopRingtone();
    previewRingtone(name, ringtoneVolume);
    setPreviewing(name);
    previewTimerRef.current = setTimeout(() => setPreviewing(null), 4000);
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    setRingtoneVolume(vol);
    ringtoneManager.setVolume(vol);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    ringtoneManager.load('CustomUpload', URL.createObjectURL(file));
  };

  const handlePushNotificationsChange = async (checked) => {
    if (!checked) { setPushNotifications(false); return; }
    if (!pushSupported) { alert('Push notifications are not supported in this browser.'); setPushNotifications(false); return; }
    const permission = await requestPushPermission();
    if (permission !== 'granted') { alert('Please allow browser notifications to enable push notifications.'); setPushNotifications(false); return; }
    setPushNotifications(true);
  };

  const handleSaveChanges = async () => {
    if (pushNotifications && notificationPermission !== 'granted') {
      const permission = await requestPushPermission();
      if (permission !== 'granted') { alert('Push notifications were not enabled because browser permission is blocked.'); return; }
    }
    updateNotificationSettings({
      enableNotifications,
      pushNotifications,
      emailNotifications,
      customRingtones,
      defaultSound,
      soundEnabled,
      ringtoneVolume,
      defaultReminderTime,
      taskNotificationMethod: parseTaskChannelsToMethod(taskNotificationChannels),
      quietHoursStart,
      quietHoursEnd,
      checkInFrequency,
      goalNotificationMethod: parseGoalChannelsToMethod(goalNotificationChannels),
      defaultAdvanceNotice,
      multipleReminders,
      eventNotificationMethod: parseEventChannelsToMethod(eventNotificationChannels),
    });
    if (soundEnabled) {
      customRingtones ? ringtoneManager.ring(ringtoneVolume) : playBuiltInSound(defaultSound);
    }
    alert('Settings saved successfully!');
  };

  const sectionCardClass = 'w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5 mb-6';

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-950 px-3 sm:px-4 md:px-6 py-4">
      <div className="w-full max-w-5xl mx-auto">

        {/* Back Button */}
        <div className="py-3">
          <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        {/* Header */}
        <div className="py-5">
          <h1 className="text-2xl font-semibold font-roboto text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-sm font-roboto text-gray-500 dark:text-gray-400 mt-1">Notifications</p>
        </div>

        <div className="w-full py-2 sm:py-4">

          {/* Enable Notifications */}
          <div className={sectionCardClass}>
            <ToggleSwitch checked={enableNotifications} onChange={setEnableNotifications} label="Enable Notifications" description="Master switch to control all notifications" />
          </div>

          {/* Channel Preferences */}
          <div className={sectionCardClass}>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Channel Preferences</h2>
            <ToggleSwitch
              checked={pushNotifications}
              onChange={handlePushNotificationsChange}
              label="Push Notifications"
              description={
                !pushSupported ? 'Not supported in this browser.'
                : notificationPermission === 'denied' ? 'Blocked in browser settings. Enable it in site permissions.'
                : 'Receive notifications on your device'
              }
              disabled={!pushSupported}
            />
            <ToggleSwitch checked={emailNotifications} onChange={setEmailNotifications} label="Email Notifications" description="Receive notifications via email" />
            <ToggleSwitch checked={soundEnabled} onChange={setSoundEnabled} label="Notification Sounds" description="Play sound when notifications appear" />
          </div>

          {/* Task Reminders */}
          <div className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Task Reminders</h2>
            <SelectDropdown value={defaultReminderTime} onChange={setDefaultReminderTime} options={reminderTimeOptions} label="Default Reminder Time" description="How long before due date to remind you" />
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Notification Channel</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">How you want to be notified</span>
              </label>
              <div className="space-y-1">
                <Checkbox checked={taskNotificationChannels.push}  onChange={(v) => handleTaskChannelChange('push', v)}  label="Push notifications" />
                <Checkbox checked={taskNotificationChannels.email} onChange={(v) => handleTaskChannelChange('email', v)} label="Email" />
                <Checkbox checked={taskNotificationChannels.both}  onChange={(v) => handleTaskChannelChange('both', v)}  label="Both" />
              </div>
            </div>
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Quiet Hours</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">Do not send notifications during these hours</span>
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <select value={quietHoursStart} onChange={(e) => setQuietHoursStart(e.target.value)} className="w-full sm:flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100">
                  {timeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <span className="text-sm text-gray-500 dark:text-gray-400">to</span>
                <select value={quietHoursEnd} onChange={(e) => setQuietHoursEnd(e.target.value)} className="w-full sm:flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100">
                  {timeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Goal Check-in */}
          <div className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Goal Check-in Settings</h2>
            <SelectDropdown value={checkInFrequency} onChange={setCheckInFrequency} options={frequencyOptions} label="Check-in Frequency" description="How often to remind you to update your goals" />
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Notification Channel</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">How you want to be reminded</span>
              </label>
              <div className="space-y-1">
                <Checkbox checked={goalNotificationChannels.push}  onChange={(v) => handleGoalChannelChange('push', v)}  label="Push notifications" />
                <Checkbox checked={goalNotificationChannels.email} onChange={(v) => handleGoalChannelChange('email', v)} label="Email" />
              </div>
            </div>
          </div>

          {/* Event Reminders */}
          <div className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Event Reminders</h2>
            <SelectDropdown value={defaultAdvanceNotice} onChange={setDefaultAdvanceNotice} options={reminderTimeOptions} label="Default Advance Notice" description="How long before events to remind you" />
            <div className="mb-6">
              <ToggleSwitch checked={multipleReminders} onChange={setMultipleReminders} label="Multiple Reminders" description="Send additional reminders for important events" />
            </div>
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Notification Channel</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">How you want to be reminded</span>
              </label>
              <div className="space-y-1">
                <Checkbox checked={eventNotificationChannels.push} onChange={(v) => handleEventChannelChange('push', v)} label="Push notifications" />
                <Checkbox checked={eventNotificationChannels.both} onChange={(v) => handleEventChannelChange('both', v)} label="Both" />
              </div>
            </div>
          </div>

          {/* ── Notification Sounds ──────────────────────────────────────────────── */}
          <div className={sectionCardClass}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Notification Sounds</h2>

            {/* Sounds off message */}
            {!soundEnabled && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sounds are off. Enable "Notification Sounds" in Channel Preferences above.
                </p>
              </div>
            )}

            {soundEnabled && (
              <>
                {/* Volume */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Volume</span>
                    <span className="text-sm font-medium text-teal-600 dark:text-teal-400">{Math.round(ringtoneVolume * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={ringtoneVolume} onChange={handleVolumeChange} className="w-full accent-teal-600" />
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-600 mt-1">
                    <span>Silent</span><span>Loud</span>
                  </div>
                </div>

                {/* Mode tabs */}
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-5">
                  <button
                    onClick={() => setCustomRingtones(false)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      !customRingtones ? 'bg-teal-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    🎵 Built-in Sounds
                  </button>
                  <button
                    onClick={() => setCustomRingtones(true)}
                    className={`flex-1 py-2.5 text-sm font-medium border-l border-gray-200 dark:border-gray-700 transition-colors ${
                      customRingtones ? 'bg-teal-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    🔔 Custom Ringtones
                  </button>
                </div>

                {/* Built-in tab */}
                {!customRingtones && (
                  <div className="mb-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Choose from Noxa's built-in notification sounds</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <select
                        value={defaultSound}
                        onChange={(e) => setDefaultSound(e.target.value)}
                        className="w-full sm:flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 dark:text-gray-100"
                      >
                        {soundOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <button
                        onClick={handleTestSound}
                        className="px-4 py-2 text-sm font-medium text-teal-600 dark:text-teal-300 hover:text-teal-700 dark:hover:text-teal-200 flex items-center gap-1 transition-colors self-start"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test
                      </button>
                    </div>
                  </div>
                )}

                {/* Custom ringtones tab */}
                {customRingtones && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Select and preview your notification ringtone</p>

                    <div className="space-y-2 mb-4">
                      {ringtoneList.map(({ name, label, selected }) => (
                        <div
                          key={name}
                          onClick={() => handleSelectRingtone(name)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                            selected
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-500'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-teal-300 dark:hover:border-teal-600'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? 'border-teal-500 bg-teal-500' : 'border-gray-300 dark:border-gray-600'}`}>
                              {selected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                            </span>
                            <span className={`text-sm ${selected ? 'text-teal-700 dark:text-teal-300 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>{label}</span>
                            {selected && <span className="text-xs text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 rounded-full font-medium">Active</span>}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePreview(name); }}
                            className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              previewing === name
                                ? 'border-teal-500 text-teal-600 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20'
                                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-teal-300 dark:hover:border-teal-600 hover:text-teal-600 dark:hover:text-teal-300'
                            }`}
                          >
                            {previewing === name ? (
                              <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>Stop</>
                            ) : (
                              <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>Preview</>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Upload */}
                    <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Your Own</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">MP3, WAV, or OGG</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <input id="file-upload" type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-500 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-300 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Choose File
                          </span>
                        </label>
                        {uploadedFile
                          ? <span className="text-sm text-teal-600 dark:text-teal-400 font-medium break-all">✅ {uploadedFile.name}</span>
                          : <span className="text-sm text-gray-400 dark:text-gray-600">No file chosen</span>
                        }
                      </div>
                      {uploadedFile && <p className="mt-2 text-xs text-teal-600 dark:text-teal-400">Loaded — select "Custom Upload" in the list above to use it.</p>}
                    </div>

                    <p className="mt-3 text-xs text-gray-400 dark:text-gray-600 leading-relaxed">
                      📁 Place MP3s in <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-gray-600 dark:text-gray-400">/public/sounds/ringtones/</code>.{' '}
                      Free sounds:{' '}
                      <a href="https://mixkit.co/free-sound-effects/phone/" target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">Mixkit</a>{' · '}
                      <a href="https://freesound.org" target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">Freesound</a>{' · '}
                      <a href="https://zapsplat.com" target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">Zapsplat</a>
                    </p>
                  </div>
                )}

                {/* Test button */}
                <button
                  onClick={handleTestSound}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors mt-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 9.5v5m-3.536-6.036a5 5 0 000 7.072M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  🔊 Test Current Sound
                </button>
              </>
            )}
          </div>

          {/* Save Changes */}
          <div className="flex justify-center sm:justify-end pt-4 pb-2">
            <button
              onClick={handleSaveChanges}
              className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            >
              Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotificationPageSettings;
