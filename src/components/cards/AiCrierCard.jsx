import React, { useState } from 'react';
import { GiRobotGolem } from 'react-icons/gi';
import { FiMessageSquare, FiZap } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const AiCrierCard = ({ 
  title = "AI Crier", 
  status = "active",
  recentActivities = 12,
  color = "#10B981",
  onActivate,
  onChatNow,
  isActive: controlledIsActive
}) => {
  const navigate = useNavigate();
  const [internalActive, setInternalActive] = useState(status === "active");
  const isControlled = typeof controlledIsActive === 'boolean';
  const isActive = isControlled ? controlledIsActive : internalActive;
  
  const handleToggle = () => {
    const nextState = !isActive;
    if (!isControlled) {
      setInternalActive(nextState);
    }
    if (onActivate) onActivate(nextState);
  };
  
  const getStatusColor = () => {
    return isActive ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
  };
  
  const getStatusText = () => {
    return isActive ? "Active & Monitoring" : "Sleep Mode";
  };
  
  const handleChatClick = () => {
    if (onChatNow) {
      onChatNow();
      return;
    }
    navigate('/ai');
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer h-55 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-lg dark:bg-opacity-20"
            style={{ backgroundColor: `${color}20` }}
          >
            <GiRobotGolem className="text-xl" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-300">{title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={handleToggle}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
              isActive ? 'bg-green-500 dark:bg-green-600 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'
            }`}
          >
            <div className="w-4 h-4 bg-white dark:bg-gray-200 rounded-full"></div>
          </button>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <FiZap className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">Recent Activities</span>
          </div>
          <span className="font-medium dark:text-gray-300">{recentActivities}</span>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Your AI assistant is {isActive ? 'actively monitoring' : 'in sleep mode'}</p>
          <p className="text-xs mt-1">
            {isActive 
              ? "Providing insights and alerts in real-time" 
              : "Activate to receive AI-powered insights"}
          </p>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={handleChatClick}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          style={{ 
            backgroundColor: `${color}20`,
            color
          }}
        >
          <FiMessageSquare />
          Chat Now
        </button>
        
        <button
          onClick={handleToggle}
          className="flex-1 py-2 rounded-lg font-medium text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
};

export default AiCrierCard;
