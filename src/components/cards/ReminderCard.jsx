import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiChevronRight } from 'react-icons/fi';
import { useTasks } from '../../context/TaskContext';

const ReminderCard = ({ 
  today,
  upcoming,
  completed
}) => {
  const navigate = useNavigate();
  const { getReminderStats } = useTasks();
  const stats = getReminderStats();

  const todayCount = Number.isFinite(today) ? today : stats.today;
  const upcomingCount = Number.isFinite(upcoming) ? upcoming : stats.upcoming;
  const completedCount = Number.isFinite(completed) ? completed : stats.completed;
  const hasPropCounts =
    Number.isFinite(today) && Number.isFinite(upcoming) && Number.isFinite(completed);
  const totalReminders = hasPropCounts
    ? todayCount + upcomingCount + completedCount
    : Number.isFinite(stats.total)
    ? stats.total
    : todayCount + upcomingCount + completedCount;
  
  const handleViewAllClick = () => {
    navigate('/reminders', { state: { from: window.location.pathname } });
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm h-full cursor-pointer hover:shadow-md transition-all border border-gray-200 dark:border-gray-800 hover:border-yellow-300 dark:hover:border-yellow-700/60">
      <div 
        className="flex items-center justify-between mb-3"
        onClick={handleViewAllClick}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
            <FiBell className="text-xl text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Reminders</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Stay on track</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {totalReminders}
          </span>
          <FiChevronRight className="text-gray-400 dark:text-gray-500" />
        </div>
      </div>
      
      <div className=''>
        <div className="space-y-2">
        <div 
          className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          onClick={handleViewAllClick}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="font-normal text-gray-800 dark:text-gray-300">Today</span>
            </div>
            <span className="font-bold text-yellow-700 dark:text-yellow-400">{todayCount}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Reminders for today</p>
        </div>

        <div className="px-1 py-1 rounded-lg bg-gray-50 dark:bg-gray-800/70 border border-transparent dark:border-gray-700/70">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 dark:text-gray-400">Upcoming</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{upcomingCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-1.5">
            <span className="text-gray-500 dark:text-gray-400">Completed</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">{completedCount}</span>
          </div>
        </div>
      </div>
      
      <button 
        className="mt-4 text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 flex items-center gap-1"
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
