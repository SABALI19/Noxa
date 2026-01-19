// components/cards/TaskCard.jsx
import React from 'react';
import { FiCheckSquare } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../../context/TaskContext';

const TaskCard = () => {
  const navigate = useNavigate();
  const { getTaskStats } = useTasks();
  
  const stats = getTaskStats();
  const totalTasks = stats.total;
  const completionRate = totalTasks > 0 ? Math.round((stats.completed / totalTasks) * 100) : 0;
  
  const handleViewAll = () => {
    navigate('/tasks?view=all&page=1');
  };
  
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm h-full">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-100">
            <FiCheckSquare className="text-base text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Tasks</h3>
            <p className="text-xs text-gray-500">Manage your tasks</p>
          </div>
        </div>
        <span className="text-xl font-bold text-green-600">
          {totalTasks}
        </span>
      </div>
      
      {/* Compact Stats */}
      <div className="space-y-1.5 mb-2">
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
            <span className="text-gray-500">Pending</span>
          </div>
          <span className="font-medium">{stats.pending}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-gray-500">Completed</span>
          </div>
          <span className="font-medium">{stats.completed}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <span className="text-gray-500">Overdue</span>
          </div>
          <span className="font-medium">{stats.overdue}</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium">{completionRate}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>
      
      {/* Compact Button */}
      <button 
        onClick={handleViewAll}
        className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1 w-full justify-end hover:underline pt-2 border-t border-gray-100"
      >
        <span>View All Tasks</span>
        <span className="text-base">→</span>
      </button>
    </div>
  );
};

export default TaskCard;