import React, { useState, useRef, useEffect } from 'react';
import { 
  FiX, FiChevronDown, FiBell,
  FiBriefcase, FiUser, FiShoppingBag, FiHeart, FiBook, FiFolder,
  FiEdit2, FiCheck, FiClock
} from 'react-icons/fi';
import { Calendar, Clock } from 'lucide-react';

const DateTimeSelector = ({ formData, handleChange, errors }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  const timeOptions = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
    '07:00 PM', '07:30 PM', '08:00 PM'
  ];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateString = maxDate.toISOString().split('T')[0];

  // Generate calendar days
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    
    // Simulate input change
    const event = {
      target: {
        name: 'dueDate',
        value: formattedDate
      }
    };
    handleChange(event);
    setShowDatePicker(false);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  
  const days = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Horizontal container for date and time */}
      <div className="flex flex-row items-start gap-4">
        {/* Due Date - Left side */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            <label className="text-xs font-roboto font-normal text-gray-700 dark:text-gray-300">Due Date</label>
          </div>
          
          <div className="relative">
            {/* Custom date picker UI */}
            <div
              className={`w-full px-3 py-2.5 border rounded-lg cursor-pointer justify-between bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center ${
                errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              {formData.dueDate ? (
                <span className="text-gray-900 dark:text-gray-100 text-sm">
                  {new Date(formData.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Select date</span>
              )}
              <Calendar className="w-3 h-3 text-gray-400 dark:text-gray-300" />
            </div>
            
            {/* Hidden actual date input */}
            <input
              type="date"
              id="due-date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              min={minDate}
              max={maxDateString}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            
            {/* Custom Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => day && handleDateSelect(day)}
                      disabled={!day}
                      className={`h-8 w-8 rounded-full text-xs flex items-center justify-center ${
                        !day 
                          ? 'invisible' 
                          : formData.dueDate && 
                            new Date(formData.dueDate).getDate() === day &&
                            new Date(formData.dueDate).getMonth() === currentMonth &&
                            new Date(formData.dueDate).getFullYear() === currentYear
                            ? 'bg-[#3D9B9B] text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
          )}
          
          {formData.dueDate && !errors.dueDate && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Selected: {new Date(formData.dueDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>

        {/* Time (Optional) - Right side */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            <label className="text-xs font-roboto font-normal text-gray-700 dark:text-gray-300">
              Time <span className="text-xs font-roboto font-normal text-gray-700 dark:text-gray-300">(Optional)</span>
            </label>
          </div>
          
          <div className="relative">
            <select
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className={`w-full text-xs px-3 py-2.5 font-normal text-gray-700 dark:text-gray-200 font-roboto border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:outline-2 focus:outline-[#3D9B9B] focus:border-transparent bg-white dark:bg-gray-700 cursor-pointer ${
                errors.time ? 'border-red-400' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <option value="" className=''>Select time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Clock className="w-3 h-3 text-gray-500 dark:text-gray-300" />
            </div>
          </div>
          
          {formData.time && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Selected time: {formData.time}
            </p>
          )}
        </div>
      </div>

      {/* Selected summary - below the horizontal layout */}
      {(formData.dueDate || formData.time) && !errors.dueDate && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/40">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Selected:</h3>
          <p className="text-blue-700 dark:text-blue-300">
            {formData.dueDate && new Date(formData.dueDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
            {formData.dueDate && formData.time && ' at '}
            {formData.time}
          </p>
        </div>
      )}
    </div>
  );
};

const TaskFormModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    time: '',
    priority: 'medium',
    category: 'work',
    description: '',
    recurrence: 'none',
    enableReminders: false,
    reminderFrequency: 'once',
    reminderTiming: '1_day_before',
    customReminderTime: '',
    notificationMethod: 'app'
  });

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [errors, setErrors] = useState({});
  
  const categoryRef = useRef(null);
  const formRef = useRef(null);

  const categoryOptions = [
    { value: 'work', label: 'Work', icon: FiBriefcase, color: 'text-blue-600' },
    { value: 'personal', label: 'Personal', icon: FiUser, color: 'text-purple-600' },
    { value: 'shopping', label: 'Shopping', icon: FiShoppingBag, color: 'text-green-600' },
    { value: 'health', label: 'Health & Fitness', icon: FiHeart, color: 'text-red-600' },
    { value: 'education', label: 'Education', icon: FiBook, color: 'text-indigo-600' },
    { value: 'other', label: 'Other', icon: FiFolder, color: 'text-gray-600' }
  ];

  const reminderFrequencyOptions = [
    { value: 'once', label: 'Once before due date' },
    { value: 'multiple', label: 'Multiple reminders' },
    { value: 'daily', label: 'Daily until completed' }
  ];

  const reminderTimingOptions = [
    { value: '1_hour_before', label: '1 hour before' },
    { value: '2_hours_before', label: '2 hours before' },
    { value: '1_day_before', label: '1 day before' },
    { value: '2_days_before', label: '2 days before' },
    { value: '1_week_before', label: '1 week before' },
    { value: 'on_due_date', label: 'On due date' },
    { value: 'custom', label: 'Custom time' }
  ];

  const notificationMethodOptions = [
    { value: 'app', label: 'App notification', icon: '📱' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'both', label: 'Both', icon: '📱📧' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePrioritySelect = (priority) => {
    setFormData(prev => ({
      ...prev,
      priority
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (new Date(formData.dueDate) < new Date().setHours(0, 0, 0, 0)) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }
    
    if (formData.enableReminders && formData.reminderTiming === 'custom' && !formData.customReminderTime) {
      newErrors.customReminderTime = 'Custom reminder time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      let formattedTime = formData.time;
      if (formattedTime) {
        const timeParts = formattedTime.split(' ');
        if (timeParts.length === 2) {
          let [time, period] = timeParts;
          let [hours, minutes] = time.split(':');
          
          if (period === 'PM' && hours !== '12') {
            hours = String(parseInt(hours, 10) + 12);
          } else if (period === 'AM' && hours === '12') {
            hours = '00';
          }
          
          hours = hours.padStart(2, '0');
          formattedTime = `${hours}:${minutes}`;
        }
      }
      
      const timePart = formattedTime ? `T${formattedTime}:00` : 'T12:00:00';
      const formattedDueDate = new Date(formData.dueDate + timePart).toISOString();
      
      // Calculate reminder times based on settings
      let reminderSettings = null;
      if (formData.enableReminders) {
        reminderSettings = {
          enabled: true,
          frequency: formData.reminderFrequency,
          timing: formData.reminderTiming,
          customTime: formData.customReminderTime,
          notificationMethod: formData.notificationMethod,
          // You can add logic here to calculate actual reminder times
        };
      }
      
      const taskData = {
        ...formData,
        dueDate: formattedDueDate,
        completed: false,
        time: formattedTime || null,
        description: formData.description || '',
        recurrence: formData.recurrence === 'none' ? null : formData.recurrence,
        reminderSettings,
        createdAt: new Date().toISOString()
      };
      
      onSubmit(taskData);
      
      // Reset form
      setFormData({
        title: '',
        dueDate: '',
        time: '',
        priority: 'medium',
        category: 'work',
        description: '',
        recurrence: 'none',
        enableReminders: false,
        reminderFrequency: 'once',
        reminderTiming: '1_day_before',
        customReminderTime: '',
        notificationMethod: 'app'
      });
      
      setErrors({});
      setShowCategoryDropdown(false);
      onClose();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(e);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({
      ...prev,
      category
    }));
    setShowCategoryDropdown(false);
  };

  const handleSaveClick = () => {
    if (formRef.current) {
      const submitEvent = new Event('submit', { 
        cancelable: true, 
        bubbles: true 
      });
      formRef.current.dispatchEvent(submitEvent);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-md p-4"
  onClick={handleBackdropClick}
>
  <div className="bg-white dark:bg-gray-800/95 backdrop-blur-lg rounded-xl shadow-2xl shadow-gray-700/50 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header with Save Button (Top) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700">
          <h2 className="text-lg font-roboto font-normal text-gray-900 dark:text-gray-300">Create New Task</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveClick}
              className="px-4 py-1.5 bg-[#3D9B9B] text-white hover:bg-[#2D8B8B] rounded-xl font-roboto text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700 transition-colors"
              type="button"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        <form 
          id="task-form" 
          ref={formRef}
          onSubmit={handleFormSubmit} 
          className="p-6"
        >
          <h3 className="text-md font-roboto font-normal text-gray-800 dark:text-gray-300 mb-4">
            Essential Details
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium font-roboto text-gray-700 dark:text-gray-300 mb-1">
                Task Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="task-title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-[#3D9B9B] focus:outline-2 focus:outline-[#3D9B9B] focus:border-transparent transition-colors ${
                    errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                  placeholder="What needs to be done?"
                  aria-describedby={errors.title ? "title-error" : undefined}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300">
                  <FiEdit2 className="w-4 h-4" />
                </div>
              </div>
              {errors.title && (
                <p id="title-error" className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <DateTimeSelector 
              formData={formData}
              handleChange={handleChange}
              errors={errors}
            />

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300  mb-1">
                Priority
              </label>
              <div className="flex flex-row gap-3">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-xl border flex items-center justify-center transition-colors ${
                      formData.priority === 'high' 
                        ? 'border-red-500 bg-red-500' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                    }`}>
                      {formData.priority === 'high' && (
                        <FiCheck className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className={`font-medium transition-colors text-xs font-roboto ${
                      formData.priority === 'high' ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                    }`}>
                      High Priority
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="priority"
                    value="high"
                    checked={formData.priority === 'high'}
                    onChange={() => handlePrioritySelect('high')}
                    className="sr-only"
                  />
                </label>
                
                {/* Medium Priority */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-xl border flex items-center justify-center transition-colors ${
                      formData.priority === 'medium' 
                        ? 'border-yellow-500 bg-yellow-500' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                    }`}>
                      {formData.priority === 'medium' && (
                        <FiCheck className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className={`font-medium transition-colors text-xs font-roboto ${
                      formData.priority === 'medium' ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                    }`}>
                      Medium Priority
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="priority"
                    value="medium"
                    checked={formData.priority === 'medium'}
                    onChange={() => handlePrioritySelect('medium')}
                    className="sr-only"
                  />
                </label>

                {/* Low Priority */}
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                      formData.priority === 'low' 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                    }`}>
                      {formData.priority === 'low' && (
                        <FiCheck className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className={`font-medium transition-colors text-xs font-roboto ${
                      formData.priority === 'low' ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                    }`}>
                      Low Priority
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="priority"
                    value="low"
                    checked={formData.priority === 'low'}
                    onChange={() => handlePrioritySelect('low')}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Optional Details */}
          <div className="w-full overflow-hidden mt-6 mb-4">
            <div className="mt-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-light text-base text-gray-500 dark:text-gray-400 font-roboto">Optional Details</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Category */}
              <div ref={categoryRef}>
                <label className="block text-sm font-normal font-roboto text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:outline-2 focus:outline-[#3D9B9B] focus:border-transparent transition-colors hover:border-gray-400 dark:hover:border-gray-500 text-left flex items-center justify-between bg-white dark:bg-gray-700"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    aria-expanded={showCategoryDropdown}
                    aria-haspopup="listbox"
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const selectedCategory = categoryOptions.find(opt => opt.value === formData.category);
                        const Icon = selectedCategory?.icon || FiBriefcase;
                        const color = selectedCategory?.color || 'text-blue-400';
                        return (
                          <>
                            <Icon className={`w-3.5 h-3.5 ${color}`} />
                            <span className="text-gray-700 dark:text-gray-200 font-roboto text-sm">{selectedCategory?.label || 'Work'}</span>
                          </>
                        );
                      })()}
                    </div>
                    <FiChevronDown className={`text-gray-400 dark:text-gray-300 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showCategoryDropdown && (
                    <div 
                      className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      role="listbox"
                    >
                      {categoryOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <div
                            key={option.value}
                            role="option"
                            aria-selected={formData.category === option.value}
                            className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              formData.category === option.value ? 'bg-gray-100 dark:bg-gray-700' : ''
                            }`}
                            onClick={() => handleCategorySelect(option.value)}
                          >
                            <Icon className={`w-3.5 h-3.5 ${option.color}`} />
                            <span className="text-gray-900 dark:text-gray-100 text-sm font-roboto">{option.label}</span>
                            {formData.category === option.value && (
                              <div className="ml-auto" aria-hidden="true">
                                <svg className="w-4 h-4 text-[#3D9B9B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Description/Notes */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description/Notes
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-[#3D9B9B] focus:outline-2 focus:outline-[#3D9B9B] focus:border-transparent transition-colors hover:border-gray-400 dark:hover:border-gray-500 resize-none overflow-y-auto"
                  placeholder="Add any additional details..."
                  style={{ minHeight: '80px', maxHeight: '80px' }}
                />
              </div>

              {/* Recurrence */}
              <div>
                <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recurrence
                </label>
                <select
                  id="recurrence"
                  name="recurrence"
                  value={formData.recurrence}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3D9B9B] focus:outline-2 focus:outline-[#3D9B9B] focus:border-transparent transition-colors hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Automate Reminders Section */}
          <div className="w-full mt-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiBell className="text-gray-600 dark:text-gray-300" />
                <span className="font-light text-base text-gray-500 dark:text-gray-400 font-roboto">Automate Reminders</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="enableReminders"
                  checked={formData.enableReminders}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#3D9B9B]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3D9B9B]"></div>
              </label>
            </div>

            {formData.enableReminders && (
              <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/40">
                {/* Reminder Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reminder Frequency
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {reminderFrequencyOptions.map((option) => (
                      <label key={option.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="reminderFrequency"
                          value={option.value}
                          checked={formData.reminderFrequency === option.value}
                          onChange={handleChange}
                          className="mr-3 text-[#3D9B9B] focus:ring-[#3D9B9B] focus:outline-2 focus:outline-[#3D9B9B]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reminder Timing */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    When to Remind
                  </label>
                  <select
                    name="reminderTiming"
                    value={formData.reminderTiming}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:outline-2 focus:outline-[#3D9B9B] focus:border-transparent transition-colors hover:border-gray-400 dark:hover:border-gray-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {reminderTimingOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Reminder Time */}
                {formData.reminderTiming === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Custom Reminder Time
                    </label>
                    <input
                      type="datetime-local"
                      name="customReminderTime"
                      value={formData.customReminderTime}
                      onChange={handleChange}
                      className={`w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3D9B9B] focus:outline-2 focus:outline-[#3D9B9B] focus:border-transparent transition-colors ${
                        errors.customReminderTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    {errors.customReminderTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.customReminderTime}</p>
                    )}
                  </div>
                )}

                {/* Notification Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notification Method
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {notificationMethodOptions.map((option) => (
                      <label key={option.value} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="notificationMethod"
                          value={option.value}
                          checked={formData.notificationMethod === option.value}
                          onChange={handleChange}
                          className="mr-3 text-[#3D9B9B] focus:ring-[#3D9B9B] focus:outline-2 focus:outline-[#3D9B9B]"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <span>{option.icon}</span>
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reminder Preview */}
                <div className="pt-3 border-t border-blue-100 dark:border-blue-900/40">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Reminder Preview:</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    {formData.reminderFrequency === 'once' && 'One reminder '}
                    {formData.reminderFrequency === 'multiple' && 'Multiple reminders '}
                    {formData.reminderFrequency === 'daily' && 'Daily reminders '}
                    {formData.reminderTiming !== 'custom' && `sent ${formData.reminderTiming.replace('_', ' ')}`}
                    {formData.reminderTiming === 'custom' && 'sent at custom time'}
                    {formData.notificationMethod === 'app' && ' via app notification'}
                    {formData.notificationMethod === 'email' && ' via email'}
                    {formData.notificationMethod === 'both' && ' via app notification and email'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer with Save Button (Bottom) */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200/50 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700 rounded-lg font-roboto text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            className="px-4 py-2 bg-[#3D9B9B] text-white hover:bg-[#2D8B8B] rounded-lg font-roboto text-sm font-medium transition-colors"
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskFormModal;
