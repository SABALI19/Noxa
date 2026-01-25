// src/components/reminders/SetReminderModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiRepeat, FiBell, FiMail, FiSmartphone, FiAlertCircle, FiTarget, FiCheckSquare } from 'react-icons/fi';
import Button from '../Button';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationTracking } from '../../hooks/useNotificationTracking';

const SetReminderModal = ({ isOpen, onClose, onSubmit, linkedGoal = null, linkedTask = null }) => {
  const { addNotification } = useNotifications();
  const { trackNotification } = useNotificationTracking();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    reminderDate: '',
    reminderTime: '',
    priority: 'medium',
    category: 'general',
    frequency: 'once',
    notificationMethod: 'app',
    autoSnooze: false,
    autoComplete: false,
    linkedGoalId: null,
    linkedTaskId: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      dueTime: '',
      reminderDate: '',
      reminderTime: '',
      priority: 'medium',
      category: 'general',
      frequency: 'once',
      notificationMethod: 'app',
      autoSnooze: false,
      autoComplete: false,
      linkedGoalId: null,
      linkedTaskId: null
    });
    setErrors({});
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle date/time pickers
  const handleDateChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Set reminder to current time + 1 hour by default
  const setDefaultReminderTime = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60000);
    
    const reminderDate = oneHourLater.toISOString().split('T')[0];
    const reminderTime = oneHourLater.toTimeString().slice(0, 5);
    
    setFormData(prev => ({
      ...prev,
      reminderDate: prev.reminderDate || reminderDate,
      reminderTime: prev.reminderTime || reminderTime,
      dueDate: prev.dueDate || reminderDate
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.reminderDate) {
      newErrors.reminderDate = 'Reminder date is required';
    }
    
    if (!formData.reminderTime) {
      newErrors.reminderTime = 'Reminder time is required';
    }
    
    // Check if reminder time is in the past
    if (formData.reminderDate && formData.reminderTime) {
      const reminderDateTime = new Date(`${formData.reminderDate}T${formData.reminderTime}`);
      if (reminderDateTime < new Date()) {
        newErrors.reminderTime = 'Reminder time cannot be in the past';
      }
    }
    
    // Check due date if provided
    if (formData.dueDate && formData.reminderDate) {
      const dueDate = new Date(formData.dueDate);
      const reminderDate = new Date(formData.reminderDate);
      if (reminderDate > dueDate) {
        newErrors.reminderDate = 'Reminder cannot be after due date';
      }
    }
    
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format dates for submission
      const reminderDateTime = new Date(`${formData.reminderDate}T${formData.reminderTime}`);
      const dueDateTime = formData.dueDate 
        ? new Date(`${formData.dueDate}T${formData.dueTime || '23:59'}`)
        : null;
      
      const reminderData = {
        id: Date.now(), // Generate temporary ID
        title: formData.title,
        description: formData.description,
        reminderTime: reminderDateTime.toISOString(),
        dueDate: dueDateTime ? dueDateTime.toISOString() : reminderDateTime.toISOString(),
        priority: formData.priority,
        category: formData.category,
        frequency: formData.frequency,
        notificationMethod: formData.notificationMethod,
        autoSnooze: formData.autoSnooze,
        autoComplete: formData.autoComplete,
        linkedGoalId: formData.linkedGoalId,
        linkedTaskId: formData.linkedTaskId,
        status: 'upcoming',
        createdAt: new Date().toISOString()
      };
      
      // Call the onSubmit callback
      await onSubmit(reminderData);
      
      // Send reminder creation notification
      addNotification('reminder_created', reminderData);
      
      // Track notification
      trackNotification(reminderData.id, 'reminder', 'sent', 'reminder_created');
      
      // If linked to a goal, send goal reminder notification
      if (formData.linkedGoalId && linkedGoal) {
        addNotification('goal_reminder', {
          id: formData.linkedGoalId,
          title: linkedGoal.title,
          reminder: formData.title
        });
        trackNotification(formData.linkedGoalId, 'goal', 'sent', 'goal_reminder_set');
      }
      
      // If linked to a task, send task reminder notification
      if (formData.linkedTaskId && linkedTask) {
        addNotification('task_updated', {
          id: formData.linkedTaskId,
          title: `Reminder set for: ${linkedTask.title}`
        });
        trackNotification(formData.linkedTaskId, 'task', 'sent', 'task_reminder_set');
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating reminder:', error);
      setErrors({ submit: 'Failed to create reminder. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Set default times when modal opens
  useEffect(() => {
    if (isOpen) {
      setDefaultReminderTime();
      
      // Pre-fill from linked goal or task
      if (linkedGoal) {
        setFormData(prev => ({
          ...prev,
          title: `Reminder: ${linkedGoal.title}`,
          description: linkedGoal.description || '',
          category: linkedGoal.category?.toLowerCase() || 'general',
          priority: linkedGoal.priority || 'medium',
          linkedGoalId: linkedGoal.id
        }));
      }
      
      if (linkedTask) {
        setFormData(prev => ({
          ...prev,
          title: `Reminder: ${linkedTask.title}`,
          description: linkedTask.description || '',
          priority: linkedTask.priority || 'medium',
          linkedTaskId: linkedTask.id
        }));
      }
    }
  }, [isOpen, linkedGoal, linkedTask]);

  // Set today's date as default for due date
  useEffect(() => {
    if (isOpen && !formData.dueDate) {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, dueDate: today }));
    }
  }, [isOpen, formData.dueDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <FiBell className="text-teal-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Set a Reminder</h2>
              <p className="text-xs md:text-sm text-gray-600 truncate">
                {linkedGoal ? `For goal: ${linkedGoal.title}` : 
                 linkedTask ? `For task: ${linkedTask.title}` : 
                 'Create a new reminder'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-4 md:p-6 space-y-6">
            {/* Linked Item Display */}
            {(linkedGoal || linkedTask) && (
              <div className={`p-4 rounded-xl border-2 ${
                linkedGoal ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-3">
                  {linkedGoal ? (
                    <FiTarget className="text-purple-600 text-xl flex-shrink-0" />
                  ) : (
                    <FiCheckSquare className="text-blue-600 text-xl flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700">
                      Linked to {linkedGoal ? 'Goal' : 'Task'}
                    </p>
                    <p className="text-base font-semibold text-gray-900 truncate">
                      {linkedGoal?.title || linkedTask?.title}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Reminder Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="What do you want to be reminded about?"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" /> {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add any additional details..."
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reminder Date & Time */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Reminder Date & Time *
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-gray-400 flex-shrink-0" />
                    <input
                      type="date"
                      value={formData.reminderDate}
                      onChange={(e) => handleDateChange('reminderDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none ${
                        errors.reminderDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock className="text-gray-400 flex-shrink-0" />
                    <input
                      type="time"
                      value={formData.reminderTime}
                      onChange={(e) => handleDateChange('reminderTime', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none ${
                        errors.reminderTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {(errors.reminderDate || errors.reminderTime) && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="w-4 h-4" /> {errors.reminderDate || errors.reminderTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Due Date & Time (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Due Date & Time (Optional)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-gray-400 flex-shrink-0" />
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock className="text-gray-400 flex-shrink-0" />
                    <input
                      type="time"
                      name="dueTime"
                      value={formData.dueTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Priority and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    formData.priority === 'high' ? 'bg-red-500' :
                    formData.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 capitalize">
                    {formData.priority} priority
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                >
                  <option value="general">General</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health & Fitness</option>
                  <option value="finance">Finance</option>
                  <option value="shopping">Shopping</option>
                  <option value="meeting">Meetings</option>
                  <option value="learning">Learning</option>
                </select>
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Frequency
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'once', label: 'Once' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' }
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.frequency === option.value
                        ? 'bg-teal-50 border-teal-400 text-teal-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="frequency"
                      value={option.value}
                      checked={formData.frequency === option.value}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <FiRepeat className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notification Method */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Notification Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'app', label: 'App Only', icon: FiSmartphone, color: 'text-blue-500' },
                  { value: 'email', label: 'Email Only', icon: FiMail, color: 'text-purple-500' },
                  { value: 'both', label: 'Both', icon: FiBell, color: 'text-teal-500' }
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.notificationMethod === option.value
                          ? 'bg-teal-50 border-teal-400 text-teal-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="notificationMethod"
                        value={option.value}
                        checked={formData.notificationMethod === option.value}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <Icon className={`${option.color} flex-shrink-0`} />
                      <span className="font-medium">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Advanced Options</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors flex-shrink-0">
                      <FiBell className="text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">Auto-snooze if not completed</p>
                      <p className="text-sm text-gray-600">Automatically snooze reminder after 1 hour</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                    <input
                      type="checkbox"
                      name="autoSnooze"
                      checked={formData.autoSnooze}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-400"></div>
                  </label>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors flex-shrink-0">
                      <FiBell className="text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">Auto-mark as completed</p>
                      <p className="text-sm text-gray-600">Mark as completed when due date passes</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                    <input
                      type="checkbox"
                      name="autoComplete"
                      checked={formData.autoComplete}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-400"></div>
                  </label>
                </label>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5 flex-shrink-0" /> 
                  <span>{errors.submit}</span>
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 md:px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Set Reminder'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              Reminders will be automatically tracked and synced with {linkedGoal ? 'your goal' : linkedTask ? 'your task' : 'your activities'}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetReminderModal;