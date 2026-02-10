import React, { useState } from 'react';
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
            <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            <label className="text-xs font-roboto font-normal text-gray-700 dark:text-gray-300">Due Date</label>
          </div>
          
          <div className="relative">
            {/* Custom date picker UI */}
            <div
              className={`w-full px-3 py-2.5 border rounded-lg cursor-pointer justify-between bg-white dark:bg-gray-700 flex items-center ${
                errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              {formData.dueDate ? (
                <span className="text-gray-900 dark:text-gray-300 text-sm">
                  {new Date(formData.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">Select date</span>
              )}
              <Calendar className="w-3 h-3 text-gray-400 dark:text-gray-500" />
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
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4">
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
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">
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
                    <div key={day} className="text-xs rounded  text-gray-500 dark:text-gray-400 text-center py-1">
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
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-300'
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
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {errors.dueDate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dueDate}</p>
          )}
          
          {formData.dueDate && !errors.dueDate && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
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
            <Clock className="w-3 h-3 text-gray-600 dark:text-gray-400" />
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
              className={`w-full text-xs px-3 py-2.5 font-normal text-gray-400 dark:text-gray-500 font-roboto border rounded-lg focus:ring-2 focus:ring-[#3D9B9B] focus:outline-2 focus:outline-[#3D9B9B] focus:border-transparent bg-white dark:bg-gray-700 cursor-pointer ${
                errors.time ? 'border-red-400' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <option value="" className='text-gray-400 dark:text-gray-500'>Select time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time} className="text-gray-900 dark:text-gray-300">
                  {time}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
          
          {formData.time && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selected time: {formData.time}
            </p>
          )}
        </div>
      </div>

      {/* Selected summary - below the horizontal layout */}
      {(formData.dueDate || formData.time) && !errors.dueDate && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Selected:</h3>
          <p className="text-blue-700 dark:text-blue-400">
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

export default DateTimeSelector;