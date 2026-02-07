import React from 'react';
import { FiSun, FiMoon, FiMonitor, FiX, FiCheck } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const ThemeModal = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      icon: <FiSun className="text-2xl" />,
      description: 'Always use light theme'
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: <FiMoon className="text-2xl" />,
      description: 'Always use dark theme'
    },
    {
      value: 'system',
      label: 'System',
      icon: <FiMonitor className="text-2xl" />,
      description: 'Match system preference'
    }
  ];

  const handleThemeSelect = (value) => {
    setTheme(value);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-slideIn">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Choose Theme
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiX className="text-xl text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeSelect(option.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  theme === option.value
                    ? 'border-[#3D9B9B] bg-[#3D9B9B] bg-opacity-10 dark:bg-opacity-20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-[#3D9B9B] hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {/* Icon */}
                <div className={`p-3 rounded-lg ${
                  theme === option.value
                    ? 'bg-[#3D9B9B] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {option.icon}
                </div>

                {/* Text */}
                <div className="flex-1 text-left">
                  <p className={`font-semibold ${
                    theme === option.value
                      ? 'text-[#3D9B9B]'
                      : 'text-gray-800 dark:text-white'
                  }`}>
                    {option.label}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>

                {/* Checkmark */}
                {theme === option.value && (
                  <FiCheck className="text-2xl text-[#3D9B9B]" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#3D9B9B] hover:bg-[#2d7b7b] text-white font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThemeModal;