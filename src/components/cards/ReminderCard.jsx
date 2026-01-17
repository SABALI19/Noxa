// src/components/ReminderCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiChevronRight } from 'react-icons/fi';

const ReminderCard = ({ 
  today = 0,
  upcoming = 0,
  completed = 0
}) => {
  const navigate = useNavigate();
  const totalReminders = today + upcoming + completed;
  
  const handleViewAllClick = () => {
    navigate('/reminders', { state: { from: window.location.pathname } });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm h-full cursor-pointer hover:shadow-md transition-shadow">
      <div 
        className="flex items-center justify-between mb-3"
        onClick={handleViewAllClick}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-yellow-100">
            <FiBell className="text-xl text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Reminders</h3>
            <p className="text-sm text-gray-500">Stay on track</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-yellow-600">
            {totalReminders}
          </span>
          <FiChevronRight className="text-gray-400" />
        </div>
      </div>
      
      <div className=''>
        <div className="space-y-4">
        <div 
          className="bg-yellow-50 p-3 rounded-lg hover:bg-yellow-100 transition-colors"
          onClick={handleViewAllClick}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="font-normal text-gray-800">Today</span>
            </div>
            <span className="font-bold text-yellow-700">{today}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">Reminders for today</p>
        </div>
        
        <div className='flex'>
          
        </div>
      </div>
      
      <button 
        className="mt-4 text-sm font-medium text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
        onClick={handleViewAllClick}
      >
        <span>View All Reminders</span>
        <FiChevronRight className="text-lg" />
      </button>
      </div>
    </div>
  );
};

export default ReminderCard;