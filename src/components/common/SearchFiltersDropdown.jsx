// src/components/search/SearchFiltersDropdown.jsx
import React from 'react';
import { FiX, FiBriefcase, FiHome, FiHeart, FiCheck } from 'react-icons/fi';
import Button from '../Button';

const SearchFiltersDropdown = ({ currentFilters, onFilterChange, onClose, isMobile = false }) => {
  const categoryOptions = [
    { id: 'work', label: 'Work', icon: FiBriefcase, color: 'bg-blue-100 text-blue-800' },
    { id: 'personal', label: 'Personal', icon: FiHome, color: 'bg-purple-100 text-purple-800' },
    { id: 'health', label: 'Health', icon: FiHeart, color: 'bg-green-100 text-green-800' },
  ];

  const priorityOptions = [
    { id: 'high', label: 'High Priority', color: 'bg-red-100 text-red-800' },
    { id: 'medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'low', label: 'Low Priority', color: 'bg-green-100 text-green-800' },
  ];

  const statusOptions = [
    { id: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { id: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
  ];

  const handleFilterClick = (filterType, value) => {
    onFilterChange(filterType, value);
  };

  const hasActiveFilters = currentFilters.category || currentFilters.priority || currentFilters.status;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-800 text-lg">Search Filters</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          <FiX className="text-lg text-gray-600" />
        </button>
      </div>

      {/* Category Filters */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Category</h4>
        <div className="grid grid-cols-3 gap-2">
          {categoryOptions.map(category => {
            const Icon = category.icon;
            const isActive = currentFilters.category === category.id;
            return (
              <button
                key={category.id}
                onClick={() => handleFilterClick('category', category.id)}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                  isActive 
                    ? `${category.color} border-transparent` 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className={`text-lg mb-2 ${isActive ? category.color.split(' ')[1] : 'text-gray-500'}`} />
                <span className="text-xs font-medium mb-1">{category.label}</span>
                {isActive && <FiCheck className="text-green-600 mt-1" size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority Filters */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Priority</h4>
        <div className="grid grid-cols-3 gap-2">
          {priorityOptions.map(priority => {
            const isActive = currentFilters.priority === priority.id;
            return (
              <button
                key={priority.id}
                onClick={() => handleFilterClick('priority', priority.id)}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                  isActive 
                    ? `${priority.color} border-transparent` 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div 
                  className={`w-8 h-2 rounded-full mb-2 ${
                    priority.id === 'high' ? 'bg-red-500' :
                    priority.id === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                />
                <span className="text-xs font-medium mb-1">{priority.label}</span>
                {isActive && <FiCheck className="text-green-600 mt-1" size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Filters */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Status</h4>
        <div className="grid grid-cols-3 gap-2">
          {statusOptions.map(status => {
            const isActive = currentFilters.status === status.id;
            return (
              <button
                key={status.id}
                onClick={() => handleFilterClick('status', status.id)}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                  isActive 
                    ? `${status.color} border-transparent` 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${isActive ? 'font-bold' : ''}`}>
                  {status.label}
                </div>
                {isActive && <FiCheck className="text-green-600 mt-1" size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button
              variant="secondaryPro"
              size="sm"
              className="flex-1"
              onClick={() => {
                onFilterChange('category', null);
                onFilterChange('priority', null);
                onFilterChange('status', null);
              }}
            >
              Clear Filters
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            className={`${hasActiveFilters ? 'flex-1' : 'w-full'}`}
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchFiltersDropdown;