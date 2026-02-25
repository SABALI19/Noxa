import React from 'react';
import { FiCheckSquare } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';

const TaskCard = ({ pending, completed, overdue, total }) => {
  const navigate = useNavigate();
  const { getTaskStats } = useTasks();
  const stats = getTaskStats();

  const totalTasks = Number.isFinite(total) ? total : stats.total;
  const pendingTasks = Number.isFinite(pending) ? pending : stats.pending;
  const completedTasks = Number.isFinite(completed) ? completed : stats.completed;
  const overdueTasks = Number.isFinite(overdue) ? overdue : stats.overdue;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const handleViewAll = () => {
    navigate('/tasks?view=all&page=1');
  };
  
  return (
    <div onClick={handleViewAll}
    className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm h-full border border-gray-200 dark:border-gray-700">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <FiCheckSquare className="text-base text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-300 text-sm">Tasks</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manage your tasks</p>
          </div>
        </div>
        <span className="text-xl font-bold text-green-600 dark:text-green-500">
          {totalTasks}
        </span>
      </div>
      
      {/* Compact Stats */}
      <div className="space-y-1.5 mb-2">
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
            <span className="text-gray-500 dark:text-gray-400">Pending</span>
          </div>
          <span className="font-medium dark:text-gray-300">{pendingTasks}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-gray-500 dark:text-gray-400">Completed</span>
          </div>
          <span className="font-medium dark:text-gray-300">{completedTasks}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <span className="text-gray-500 dark:text-gray-400">Overdue</span>
          </div>
          <span className="font-medium dark:text-gray-300">{overdueTasks}</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500 dark:text-gray-400">Progress</span>
          <span className="font-medium dark:text-gray-300">{completionRate}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>
      
      {/* Compact Button */}
      <button 
        
        className="text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center gap-1 w-full justify-end hover:underline pt-2 border-t border-gray-100 dark:border-gray-700"
      >
        <span>View All Tasks</span>
        <span className="text-base">→</span>
      </button>
    </div>
  );
};

export default TaskCard;
