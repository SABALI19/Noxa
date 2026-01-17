import React from 'react';
import { FiTarget } from 'react-icons/fi';

const GoalCard = ({ 
  title = "Goals", 
  count = 0, 
  completed = 0,
  color = "#3D9B9B",
  onClick 
}) => {
  const completionRate = count > 0 ? Math.round((completed / count) * 100) : 0;
  
  return (
    <div 
      className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-full transform hover:-translate-y-1 active:scale-95"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-lg transition-colors duration-300"
            style={{ backgroundColor: `${color}15` }}
          >
            <FiTarget className="text-xl" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500">Click to view details</p>
          </div>
        </div>
        <span className="text-2xl font-bold" style={{ color }}>
          {count}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Completed</span>
          <span className="font-medium">{completed}/{count}</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-700"
            style={{ 
              width: `${completionRate}%`,
              backgroundColor: color
            }}
          ></div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          {completionRate}% of goals achieved
        </p>
      </div>
      
      <div className="mt-4 text-sm font-medium flex items-center gap-1 justify-end" style={{ color }}>
        <span>View Details</span>
        <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">→</span>
      </div>
    </div>
  );
};

export default GoalCard;