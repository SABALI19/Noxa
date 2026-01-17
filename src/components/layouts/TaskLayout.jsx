import React from 'react';
import { 
  FiCheckSquare, 
  FiCalendar, 
  FiFlag, 
  FiFolder, 
  FiCalendar as FiCalendarAlt,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import TaskCard from '../cards/TaskCard';

const TaskLayout = ({ 
  children,
  // Props for filters
  tasks = [],
  activeView,
  setActiveView,
  activeCategory,
  setActiveCategory,
  activePriority,
  setActivePriority,
  sortBy,
  setSortBy,
  // Stats
  pending = 0,
  completed = 0,
  overdue = 0
}) => {
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar - Filters */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-6 overflow-y-auto">
          {/* Task Summary Card */}
          <div className="mb-8">
            <TaskCard 
              pending={pending}
              completed={completed}
              overdue={overdue}
            />
          </div>

          {/* Views Filter */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Views</h3>
            <div className="space-y-2">
              {[
                { id: 'all', label: 'All Tasks', icon: FiCheckSquare, count: tasks.length },
                { id: 'today', label: 'Today', icon: FiCalendar, count: tasks.filter(t => new Date(t.dueDate).toDateString() === new Date().toDateString()).length },
                { id: 'week', label: 'This Week', icon: FiCalendarAlt, count: 2 },
                { id: 'overdue', label: 'Overdue', icon: FiAlertCircle, count: overdue },
                { id: 'completed', label: 'Completed', icon: FiCheckCircle, count: completed }
              ].map(view => (
                <button
                  key={view.id}
                  onClick={() => {
                    setActiveView(view.id);
                    setActiveCategory(null);
                    setActivePriority(null);
                  }}
                  className={`flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors ${
                    activeView === view.id 
                      ? 'bg-green-50 text-green-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <view.icon className="text-lg" />
                    <span className="font-medium">{view.label}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center">
                    {view.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Categories Filter */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Categories</h3>
            <div className="space-y-2">
              {[
                { id: 'work', label: 'Work', count: tasks.filter(t => t.category === 'work').length },
                { id: 'personal', label: 'Personal', count: tasks.filter(t => t.category === 'personal').length },
                { id: 'health', label: 'Health', count: tasks.filter(t => t.category === 'health').length }
              ].map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setActiveView(null);
                    setActivePriority(null);
                  }}
                  className={`flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors ${
                    activeCategory === category.id 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FiFolder className="text-lg" />
                    <span className="font-medium">{category.label}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Priority</h3>
            <div className="space-y-2">
              {[
                { id: 'high', label: 'High Priority', count: tasks.filter(t => t.priority === 'high').length },
                { id: 'medium', label: 'Medium Priority', count: tasks.filter(t => t.priority === 'medium').length },
                { id: 'low', label: 'Low Priority', count: tasks.filter(t => t.priority === 'low').length }
              ].map(priority => (
                <button
                  key={priority.id}
                  onClick={() => {
                    setActivePriority(priority.id);
                    setActiveView(null);
                    setActiveCategory(null);
                  }}
                  className={`flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors ${
                    activePriority === priority.id 
                      ? 'bg-red-50 text-red-700' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FiFlag className={`text-lg ${getPriorityColor(priority.id).replace('bg-', 'text-')}`} />
                    <span className="font-medium">{priority.label}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center">
                    {priority.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Sort by</h3>
            <div className="space-y-2">
              {[
                { id: 'dueDate', label: 'Due Date', icon: FiCalendarAlt },
                { id: 'priority', label: 'Priority', icon: FiFlag },
                { id: 'category', label: 'Category', icon: FiFolder },
                { id: 'created', label: 'Created Date', icon: FiCalendar }
              ].map(sort => (
                <button
                  key={sort.id}
                  onClick={() => setSortBy(sort.id)}
                  className={`flex items-center w-full p-3 rounded-lg text-left transition-colors ${
                    sortBy === sort.id 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <sort.icon className="text-lg mr-3" />
                  <span className="font-medium">{sort.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default TaskLayout;