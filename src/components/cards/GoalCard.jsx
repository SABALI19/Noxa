import React, { useEffect, useMemo, useState } from 'react';
import { FiTarget } from 'react-icons/fi';
import { getGoals, goalEvents, hydrateGoalsFromBackend } from '../../services/goalStorage';

const GoalCard = ({ 
  title = "Goals", 
  count,
  completed,
  color = "#3D9B9B",
  onClick 
}) => {
  const [goals, setGoals] = useState(() => getGoals());

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const hydratedGoals = await hydrateGoalsFromBackend();
      if (isMounted && Array.isArray(hydratedGoals)) {
        setGoals(hydratedGoals);
      }
    };

    hydrate();

    const syncGoals = (event) => {
      if (event?.detail && Array.isArray(event.detail)) {
        setGoals(event.detail);
      } else {
        setGoals(getGoals());
      }
    };

    const syncFromStorage = (event) => {
      if (event.key === 'noxa_goals') {
        setGoals(getGoals());
      }
    };

    window.addEventListener(goalEvents.updated, syncGoals);
    window.addEventListener('storage', syncFromStorage);

    return () => {
      isMounted = false;
      window.removeEventListener(goalEvents.updated, syncGoals);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  const derivedStats = useMemo(() => {
    const total = goals.length;
    const completedCount = goals.filter((goal) => goal.completed).length;
    return { total, completedCount };
  }, [goals]);

  const totalGoals = Number.isFinite(count) ? count : derivedStats.total;
  const completedGoals = Number.isFinite(completed) ? completed : derivedStats.completedCount;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  
  return (
    <div 
      className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-full transform hover:-translate-y-1 active:scale-95 border border-gray-200 dark:border-gray-50"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-lg transition-colors duration-300 dark:bg-opacity-20"
            style={{ backgroundColor: `${color}20` }}
          >
            <FiTarget className="text-xl" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-300">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Click to view details</p>
          </div>
        </div>
        <span className="text-2xl font-bold dark:text-gray-300" style={{ color }}>
          {totalGoals}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Completed</span>
          <span className="font-medium dark:text-gray-300">{completedGoals}/{totalGoals}</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-700"
            style={{ 
              width: `${completionRate}%`,
              backgroundColor: color
            }}
          ></div>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {completionRate}% of goals achieved
        </p>
      </div>
      
      <div className="mt-4 text-sm font-medium flex items-center gap-1 justify-end" style={{ color }}>
        <span className="dark:text-gray-300">View Details</span>
        <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">→</span>
      </div>
    </div>
  );
};

export default GoalCard;
