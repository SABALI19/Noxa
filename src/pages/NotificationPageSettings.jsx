import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

// Reusable Toggle Switch Component
const ToggleSwitch = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-start justify-between py-4">
      <div className="flex-1">
        <h3 className="text-lg font-medium text-gray-900">{label}</h3>
        <p className="text-xs font-roboto text-gray-500 mt-1">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`ml-4 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

// Checkbox Component
const Checkbox = ({ checked, onChange, label }) => {
  return (
    <label className="flex items-center cursor-pointer py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
      />
      <span className="ml-2 text-sm text-gray-900">{label}</span>
    </label>
  );
};

// Select Dropdown Component
const SelectDropdown = ({ value, onChange, options, label, description }) => {
  return (
    <div className="mb-6">
      <label className="block">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        {description && (
          <span className="block text-xs text-gray-500 mt-1 mb-2">{description}</span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

// Main Settings Component
const NotificationPageSettings = () => {
  const { notificationSettings, updateNotificationSettings, testNotificationSound } = useNotifications();
  
  // Initialize state directly from context (no useEffect needed)
  const [enableNotifications, setEnableNotifications] = useState(notificationSettings.enableNotifications);
  const [pushNotifications, setPushNotifications] = useState(notificationSettings.pushNotifications);
  const [emailNotifications, setEmailNotifications] = useState(notificationSettings.emailNotifications);
  const [customRingtones, setCustomRingtones] = useState(notificationSettings.customRingtones);
  const [defaultSound, setDefaultSound] = useState(notificationSettings.defaultSound);
  const [soundEnabled, setSoundEnabled] = useState(notificationSettings.soundEnabled);

  // Task Reminders state
  const [defaultReminderTime, setDefaultReminderTime] = useState('15 minutes before');
  const [taskNotificationChannels, setTaskNotificationChannels] = useState({
    push: false,
    email: false,
    both: false,
  });
  const [quietHoursStart, setQuietHoursStart] = useState('10:00 PM');
  const [quietHoursEnd, setQuietHoursEnd] = useState('7:00 AM');

  // Goal Check-in Settings state
  const [checkInFrequency, setCheckInFrequency] = useState('Weekly');
  const [goalNotificationChannels, setGoalNotificationChannels] = useState({
    push: false,
    email: false,
  });

  // Event Reminders state
  const [defaultAdvanceNotice, setDefaultAdvanceNotice] = useState('30 minutes before');
  const [multipleReminders, setMultipleReminders] = useState(false);
  const [eventNotificationChannels, setEventNotificationChannels] = useState({
    push: false,
    both: false,
  });

  // Notification Sounds state
  const [uploadedFile, setUploadedFile] = useState(null);

  const reminderTimeOptions = [
    { value: '5 minutes before', label: '5 minutes before' },
    { value: '10 minutes before', label: '10 minutes before' },
    { value: '15 minutes before', label: '15 minutes before' },
    { value: '30 minutes before', label: '30 minutes before' },
    { value: '1 hour before', label: '1 hour before' },
    { value: '2 hours before', label: '2 hours before' },
    { value: '1 day before', label: '1 day before' },
  ];

  const frequencyOptions = [
    { value: 'Daily', label: 'Daily' },
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Bi-weekly', label: 'Bi-weekly' },
    { value: 'Monthly', label: 'Monthly' },
  ];

  const soundOptions = [
    { value: 'Default', label: 'Default' },
    { value: 'Chime', label: 'Chime' },
    { value: 'Bell', label: 'Bell' },
    { value: 'Ding', label: 'Ding' },
    { value: 'Alert', label: 'Alert' },
    { value: 'Notification', label: 'Notification' },
  ];

  const timeOptions = [
    { value: '12:00 AM', label: '12:00 AM' },
    { value: '1:00 AM', label: '1:00 AM' },
    { value: '2:00 AM', label: '2:00 AM' },
    { value: '3:00 AM', label: '3:00 AM' },
    { value: '4:00 AM', label: '4:00 AM' },
    { value: '5:00 AM', label: '5:00 AM' },
    { value: '6:00 AM', label: '6:00 AM' },
    { value: '7:00 AM', label: '7:00 AM' },
    { value: '8:00 AM', label: '8:00 AM' },
    { value: '9:00 AM', label: '9:00 AM' },
    { value: '10:00 AM', label: '10:00 AM' },
    { value: '11:00 AM', label: '11:00 AM' },
    { value: '12:00 PM', label: '12:00 PM' },
    { value: '1:00 PM', label: '1:00 PM' },
    { value: '2:00 PM', label: '2:00 PM' },
    { value: '3:00 PM', label: '3:00 PM' },
    { value: '4:00 PM', label: '4:00 PM' },
    { value: '5:00 PM', label: '5:00 PM' },
    { value: '6:00 PM', label: '6:00 PM' },
    { value: '7:00 PM', label: '7:00 PM' },
    { value: '8:00 PM', label: '8:00 PM' },
    { value: '9:00 PM', label: '9:00 PM' },
    { value: '10:00 PM', label: '10:00 PM' },
    { value: '11:00 PM', label: '11:00 PM' },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleTestSound = () => {
    testNotificationSound();
  };

  const handleSaveChanges = () => {
    // Update notification settings in context
    updateNotificationSettings({
      enableNotifications,
      pushNotifications,
      emailNotifications,
      customRingtones,
      defaultSound,
      soundEnabled
    });
    
    alert('Settings saved successfully!');
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="w-full p-4">
         {/* Back Button */}
         <div className="px-6 py-3">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

         {/* Header */}
        <div className=" px-6 py-5">
          <h1 className="text-2xl font-semibold font-roboto text-gray-900">Settings</h1>
          <p className="text-sm font-roboto text-gray-500 mt-1">Notifications</p>
        </div>
      
       

        {/* Settings Content */}
        <div className="w-full px-6 py-5">
            
          {/* Enable Notifications */}
         <div className='w-full bg-white rounded-lg p-4 mb-6'>
             <ToggleSwitch
            checked={enableNotifications}
            onChange={setEnableNotifications}
            label="Enable Notifications"
            description="Master switch to control all notifications"
          />
         </div>

          {/* Channel Preferences Section */}
          <div className="w-full bg-white rounded-lg p-4 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Channel Preferences
            </h2>

            <div className="">
              {/* Push Notifications */}
              <ToggleSwitch
                checked={pushNotifications}
                onChange={setPushNotifications}
                label="Push Notifications"
                description="Receive notifications on your device"
              />

              {/* Email Notifications */}
              <ToggleSwitch
                checked={emailNotifications}
                onChange={setEmailNotifications}
                label="Email Notifications"
                description="Receive notifications via email"
              />

              {/* Custom Ringtones */}
              <ToggleSwitch
                checked={customRingtones}
                onChange={setCustomRingtones}
                label="Custom Ringtones"
                description="Use custom sounds for notifications"
              />
              
              {/* Sound Enabled */}
              <ToggleSwitch
                checked={soundEnabled}
                onChange={setSoundEnabled}
                label="Notification Sounds"
                description="Play sound when notifications appear"
              />
            </div>
          </div>

          {/* Task Reminders Section */}
          <div className="w-full bg-white rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Task Reminders
            </h2>

            {/* Default Reminder Time */}
            <SelectDropdown
              value={defaultReminderTime}
              onChange={setDefaultReminderTime}
              options={reminderTimeOptions}
              label="Default Reminder Time"
              description="How long before due date to remind you"
            />

            {/* Notification Channel */}
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-900">Notification Channel</span>
                <span className="block text-xs text-gray-500 mt-1 mb-3">
                  How you want to be notified
                </span>
              </label>
              <div className="space-y-1">
                <Checkbox
                  checked={taskNotificationChannels.push}
                  onChange={(checked) =>
                    setTaskNotificationChannels({ ...taskNotificationChannels, push: checked })
                  }
                  label="Push notifications"
                />
                <Checkbox
                  checked={taskNotificationChannels.email}
                  onChange={(checked) =>
                    setTaskNotificationChannels({ ...taskNotificationChannels, email: checked })
                  }
                  label="Email"
                />
                <Checkbox
                  checked={taskNotificationChannels.both}
                  onChange={(checked) =>
                    setTaskNotificationChannels({ ...taskNotificationChannels, both: checked })
                  }
                  label="Both"
                />
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-900">Quiet Hours</span>
                <span className="block text-xs text-gray-500 mt-1 mb-3">
                  Do not send notifications during these hours
                </span>
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {timeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">to</span>
                <select
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {timeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Goal Check-in Settings Section */}
          <div className="w-full bg-white rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Goal Check-in Settings
            </h2>

            {/* Check-in Frequency */}
            <SelectDropdown
              value={checkInFrequency}
              onChange={setCheckInFrequency}
              options={frequencyOptions}
              label="Check-in Frequency"
              description="How often to remind you to update your goals"
            />

            {/* Notification Channel */}
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-900">Notification Channel</span>
                <span className="block text-xs text-gray-500 mt-1 mb-3">
                  How you want to be reminded
                </span>
              </label>
              <div className="space-y-1">
                <Checkbox
                  checked={goalNotificationChannels.push}
                  onChange={(checked) =>
                    setGoalNotificationChannels({ ...goalNotificationChannels, push: checked })
                  }
                  label="Push notifications"
                />
                <Checkbox
                  checked={goalNotificationChannels.email}
                  onChange={(checked) =>
                    setGoalNotificationChannels({ ...goalNotificationChannels, email: checked })
                  }
                  label="Email"
                />
              </div>
            </div>
          </div>

          {/* Event Reminders Section */}
          <div className="w-full bg-white rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Event Reminders
            </h2>

            {/* Default Advance Notice */}
            <SelectDropdown
              value={defaultAdvanceNotice}
              onChange={setDefaultAdvanceNotice}
              options={reminderTimeOptions}
              label="Default Advance Notice"
              description="How long before events to remind you"
            />

            {/* Multiple Reminders Toggle */}
            <div className="mb-6">
              <ToggleSwitch
                checked={multipleReminders}
                onChange={setMultipleReminders}
                label="Multiple Reminders"
                description="Send additional reminders for important events"
              />
            </div>

            {/* Notification Channel */}
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-900">Notification Channel</span>
                <span className="block text-xs text-gray-500 mt-1 mb-3">
                  How you want to be reminded
                </span>
              </label>
              <div className="space-y-1">
                <Checkbox
                  checked={eventNotificationChannels.push}
                  onChange={(checked) =>
                    setEventNotificationChannels({ ...eventNotificationChannels, push: checked })
                  }
                  label="Push notifications"
                />
                <Checkbox
                  checked={eventNotificationChannels.both}
                  onChange={(checked) =>
                    setEventNotificationChannels({ ...eventNotificationChannels, both: checked })
                  }
                  label="Both"
                />
              </div>
            </div>
          </div>

          {/* Notification Sounds Section */}
          <div className="w-full bg-white rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Notification Sounds
            </h2>

            {/* Default Sound */}
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-900">Default Sound</span>
                <span className="block text-xs text-gray-500 mt-1 mb-2">
                  Choose your notification sound
                </span>
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={defaultSound}
                  onChange={(e) => setDefaultSound(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {soundOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleTestSound}
                  className="px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Test
                </button>
              </div>
            </div>

            {/* Upload Custom Ringtone */}
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-900">Upload Custom Ringtone</span>
                <span className="block text-xs text-gray-500 mt-1 mb-3">
                  Upload your own notification sound
                </span>
              </label>
              <div className="flex items-center">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <input
                    id="file-upload"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose File
                  </span>
                </label>
                {uploadedFile && (
                  <span className="ml-3 text-sm text-gray-600">
                    {uploadedFile.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Save Changes Button */}
          <div className="flex justify-end pt-4 pb-2">
            <button
              onClick={handleSaveChanges}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
          </div>
        </div>
      
    </div>
  );
};

export default NotificationPageSettings;