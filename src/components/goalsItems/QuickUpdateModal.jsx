import React, { useState } from 'react';

const QuickUpdateModal = ({ goal, onClose, onUpdate }) => {
  const [value, setValue] = useState(goal.progress);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-96 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-300">Update Progress for {goal.title}</h2>
        <div className="mb-4">
          <label className="block mb-2 text-gray-700 dark:text-gray-300">Current Progress (%)</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full accent-teal-500"
          />
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-300">{value}%</span>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onUpdate(goal.id, value)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Update
          </button>
        </div>  
      </div>
    </div>
  );
};

export default QuickUpdateModal;