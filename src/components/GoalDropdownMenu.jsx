// src/components/GoalDropdownMenu.jsx
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  FiFileText, FiBarChart2, FiEdit3, FiCheckSquare, FiTrendingUp,
  FiShare2, FiFlag, FiCalendar, FiTrash2
} from 'react-icons/fi';

const GoalDropdownMenu = ({ goalId, isOpen, onClose, onMenuAction, triggerRect }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleItemClick = (itemId) => {
    onMenuAction(goalId, itemId);
    onClose();
  };

  const menuItems = [
    { id: "view", label: "View Details", icon: <FiFileText className="text-lg" /> },
    { id: "view_tracking", label: "View Tracking", icon: <FiBarChart2 className="text-lg" /> },
    { id: "edit", label: "Edit Goal", icon: <FiEdit3 className="text-lg" /> },
    { id: "complete", label: "Mark Complete", icon: <FiCheckSquare className="text-lg" /> },
    { id: "progress", label: "Track Progress", icon: <FiTrendingUp className="text-lg" /> },
    { id: "share", label: "Share", icon: <FiShare2 className="text-lg" /> },
    { id: "milestone", label: "Add Milestone", icon: <FiFlag className="text-lg" /> },
    { id: "notes", label: "Add Notes", icon: <FiEdit3 className="text-lg" /> },
    { id: "reminder", label: "Set Reminder", icon: <FiCalendar className="text-lg" /> },
    { id: "priority", label: "Change Priority", icon: <FiFlag className="text-lg" /> },
    { id: "archive", label: "Archive", icon: <FiFileText className="text-lg" /> },
    { id: "duplicate", label: "Duplicate", icon: <FiEdit3 className="text-lg" /> },
    { id: "export", label: "Export", icon: <FiShare2 className="text-lg" /> },
    { id: "delete", label: "Delete", icon: <FiTrash2 className="text-lg" />, danger: true },
  ];

  if (!isOpen) return null;

  // Calculate position based on trigger element
  const getPositionStyle = () => {
    if (!triggerRect) return {};
    
    const viewportHeight = window.innerHeight;
    const menuHeight = 400; // Approximate menu height
    
    // Check if there's enough space below
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    
    // Position below if enough space, otherwise above
    const top = spaceBelow > menuHeight || spaceBelow > spaceAbove
      ? triggerRect.bottom + 4
      : triggerRect.top - menuHeight - 4;
    
    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${Math.min(triggerRect.right - 256, window.innerWidth - 280)}px`,
      zIndex: 9999,
    };
  };

  const menuContent = (
    <div
      ref={menuRef}
      className="w-64 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 py-2 max-h-[70vh] overflow-hidden"
      style={getPositionStyle()}
    >
      <div className="px-2 pb-2 border-b border-gray-100 mb-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-3 py-2">Goal Actions</h4>
      </div>
      
      <div className="overflow-y-auto max-h-[60vh]">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`w-full px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              item.danger 
                ? "text-red-600 hover:bg-red-50" 
                : "text-gray-700 hover:text-gray-900"
            }`}
          >
            <span className={`${item.danger ? 'text-red-500' : 'text-gray-500  dark:text-gray-300'}`}>
              {item.icon}
            </span>
            <span className="flex-1 text-left dark:text-gray-300">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return ReactDOM.createPortal(menuContent, document.body);
};

export default GoalDropdownMenu;