// src/components/TaskSidebar.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  FiCheckSquare as FiClipboard, 
  FiCalendar, 
  FiFlag, 
  FiFolder, 
  FiCheckCircle,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiMenu,
  FiX
} from "react-icons/fi";
import { 
  CalendarDays, 
  Calendar, 
  Flag, 
  Folder, 
  Briefcase, 
  CheckCircle, 
  AlertCircle, 
  PanelRightOpen, 
  PanelLeftOpen,
  ChevronDown, 
  ChevronUp, 
  ClipboardList, 
  NotebookText, 
  House, 
  Heart, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  Menu,
  X
} from "lucide-react";
import Button from "../Button";
import { useTasks } from "../../context/TaskContext";

// Move MobileOverlay outside the component
const MobileOverlay = ({ isOpen, onClose }) => (
  <div 
    className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}
    onClick={onClose}
  />
);

const TaskSidebar = () => {
  const [expandedSections, setExpandedSections] = useState({
    views: true,
    categories: true,
    priority: true,
    sort: true
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [fabPosition, setFabPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const fabRef = useRef(null);
  
  // Get tasks and filter functions from context
  const {
    tasks,
    getTaskStats,
    getTodayTasks,
    filters,
    updateFilters,
    resetFilters,
    getFilteredTasks,
    getWeekTasks
  } = useTasks();
  
  const stats = getTaskStats();
  const completed = stats.completed;
  const overdue = stats.overdue;
  const todayTasks = getTodayTasks();
  const filteredTasks = getFilteredTasks();
  const weekTasks = getWeekTasks ? getWeekTasks() : [];

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // FAB drag handlers
  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: touch.clientX - fabPosition.x,
      y: touch.clientY - fabPosition.y
    });
  }, [isMobile, fabPosition.x, fabPosition.y]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !isMobile) return;
    e.preventDefault();
    const touch = e.touches[0];

    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    // Check if moved more than 5px to distinguish from tap
    if (Math.abs(newX - fabPosition.x) > 5 || Math.abs(newY - fabPosition.y) > 5) {
      setHasMoved(true);
    }

    // Get viewport dimensions
    const maxX = window.innerWidth - 56; // 56px is the FAB width
    const maxY = window.innerHeight - 56;

    // Constrain to viewport
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    setFabPosition({ x: constrainedX, y: constrainedY });
  }, [isDragging, isMobile, dragStart.x, dragStart.y, fabPosition.x, fabPosition.y]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    setIsDragging(false);
  }, [isMobile]);

  const handleMouseDown = useCallback((e) => {
    if (!isMobile) return;
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: e.clientX - fabPosition.x,
      y: e.clientY - fabPosition.y
    });
  }, [isMobile, fabPosition.x, fabPosition.y]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !isMobile) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Check if moved more than 5px to distinguish from click
    if (Math.abs(newX - fabPosition.x) > 5 || Math.abs(newY - fabPosition.y) > 5) {
      setHasMoved(true);
    }

    // Get viewport dimensions
    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;

    // Constrain to viewport
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    setFabPosition({ x: constrainedX, y: constrainedY });
  }, [isDragging, isMobile, dragStart.x, dragStart.y, fabPosition.x, fabPosition.y]);

  const handleMouseUp = useCallback(() => {
    if (!isMobile) return;
    setIsDragging(false);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      const handleMouseMoveWrapper = (e) => handleMouseMove(e);
      const handleMouseUpWrapper = (e) => handleMouseUp(e);

      document.addEventListener('mousemove', handleMouseMoveWrapper);
      document.addEventListener('mouseup', handleMouseUpWrapper);

      return () => {
        document.removeEventListener('mousemove', handleMouseMoveWrapper);
        document.removeEventListener('mouseup', handleMouseUpWrapper);
      };
    }
  }, [isDragging, isMobile, dragStart, handleMouseMove, handleMouseUp]);

  const handleFabClick = () => {
    if (!hasMoved) {
      toggleSidebar();
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Handle filter button clicks
  const handleViewFilter = (viewId) => {
    updateFilters({ 
      activeView: viewId,
      activeCategory: null,
      activePriority: null 
    });
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleCategoryFilter = (categoryId) => {
    updateFilters({ 
      activeCategory: categoryId,
      activeView: null,
      activePriority: null 
    });
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handlePriorityFilter = (priorityId) => {
    updateFilters({ 
      activePriority: priorityId,
      activeView: null,
      activeCategory: null 
    });
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleSortChange = (sortId) => {
    updateFilters({ sortBy: sortId });
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleResetFilters = () => {
    resetFilters();
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Get priority and category colors
  const getPriorityIconColor = (priority) => {
    switch (priority) {
      case 'high': return '#e67373';
      case 'medium': return '#fbbf24';
      case 'low': return '#4cb04f';
      default: return '#9CA3AF';
    }
  };

  const getCategoryIconColor = (category) => {
    switch (category) {
      case 'work': return '#3D9B9B';
      case 'personal': return '#8B5CF6';
      case 'health': return '#ffb84d';
      default: return '#3D9B9B';
    }
  };

  // Color functions are used directly in the component

  // Collapsed sidebar for desktop
  if (isCollapsed && !isMobile) {
    return (
      <div className="w-16 h-full bg-[#f2f5f7] dark:bg-gray-800 shadow-md shadow-black overflow-y-auto transition-all duration-300 hidden md:block">
        <div className="p-4 flex flex-col items-center">
          <Button
            variant="icon"
            size="xs"
            className="mb-6"
            onClick={toggleSidebar}
          >
            <PanelRightOpen className="text-sm" size={20} />
          </Button>
          
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-2">
              <NotebookText size={20} className="text-[#3D9B9B] mb-7" />
              <Calendar size={20} className="text-[#313333] dark:text-gray-300 mb-7" />
              <CalendarDays size={20} className="text-[#3D9B9B] mb-7" />
              <AlertCircle size={20} className="text-[#e67373] mb-7" />
              <CheckCircle size={20} className="text-[#4cb04f]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Menu Button (Draggable FAB)
  if (isMobile && !isMobileMenuOpen) {
    return (
      <>
        <div 
          ref={fabRef}
          className="fixed z-50 md:hidden cursor-move touch-none"
          style={{
            left: `${fabPosition.x}px`,
            top: `${fabPosition.y}px`,
            transition: isDragging ? 'none' : 'all 0.3s ease'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <button
            className="bg-[#3D9B9B] hover:bg-[#2d7b7b] text-white rounded-full p-4 shadow-lg active:shadow-xl transition-all duration-200"
            onClick={handleFabClick}
          >
            <Menu size={24} />
          </button>
        </div>
      </>
    );
  }

  // Mobile Sidebar Drawer
  if (isMobile && isMobileMenuOpen) {
    return (
      <>
        <MobileOverlay 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
        <div className={`fixed left-0 top-0 h-full w-[280px]  sm:w-[320px] bg-[#f2f5f7] dark:bg-gray-800 shadow-xl z-50 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 h-full overflow-y-auto">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold font-roboto text-gray-800 dark:text-gray-300">Task Filters</h2>
              <Button
                variant="icon"
                size="xs"
                className="hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={20} />
              </Button>
            </div>

            {/* Views Filter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-roboto font-semibold text-gray-500 dark:text-gray-400 uppercase">Views</h3>
                <button
                  onClick={() => toggleSection('views')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-colors"
                >
                  {expandedSections.views ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {expandedSections.views && (
                <div className="space-y-2">
                  {[
                    { id: 'all', label: 'All Tasks', icon: NotebookText, iconColor: '#3D9B9B', count: tasks.length },
                    { id: 'today', label: 'Today', icon: Calendar, iconColor: '#3D9B9B', count: todayTasks.length },
                    { id: 'week', label: 'This Week', icon: CalendarDays, iconColor: '#3D9B9B', count: weekTasks.length },
                    { id: 'overdue', label: 'Overdue', icon: AlertCircle, iconColor: '#e67373', count: overdue },
                    { id: 'completed', label: 'Completed', icon: CheckCircle, iconColor: '#4cb04f', count: completed }
                  ].map(view => {
                    const IconComponent = view.icon;
                    return (
                      <Button
                        key={view.id}
                        variant={filters.activeView === view.id ? "primary" : "secondaryPro"}
                        size="sm"
                        className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                          filters.activeView === view.id ? "bg-[#3D9B9B] text-white" : "text-gray-700 dark:text-gray-300"
                        }`}
                        onClick={() => handleViewFilter(view.id)}
                      >
                        <div className="flex items-center gap-3">
                        <IconComponent
                          style={{
                            color: filters.activeView === view.id ? 'white' : view.iconColor,
                            transition: 'color 0.3s ease'
                          }}
                          className="text-lg group-hover:text-white"
                          size={18}
                        />
                          <span className="font-medium font-roboto text-sm">{view.label}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                          filters.activeView === view.id 
                            ? "bg-white/20 text-white" 
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-white/20 group-hover:text-white"
                        }`}>
                          {view.count}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Categories Filter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold font-roboto text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categories</h3>
                <button
                  onClick={() => toggleSection('categories')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-colors"
                >
                  {expandedSections.categories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {expandedSections.categories && (
                <div className="space-y-2">
                  {[
                    { id: 'work', label: 'Work', icon: Briefcase, iconColor: '#3D9B9B', count: tasks.filter(t => t.category === 'work').length },
                    { id: 'personal', label: 'Personal', icon: House, iconColor: '#8B5CF6', count: tasks.filter(t => t.category === 'personal').length },
                    { id: 'health', label: 'Health', icon: Heart, iconColor: '#ffb84d', count: tasks.filter(t => t.category === 'health').length }
                  ].map(category => {
                    const CategoryIcon = category.icon;
                    return (
                      <Button
                        key={category.id}
                        variant={filters.activeCategory === category.id ? "primary" : "secondaryPro"}
                        size="sm"
                        className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                          filters.activeCategory === category.id ? "bg-[#3D9B9B] text-white" : "text-gray-700 dark:text-gray-300"
                        }`}
                        onClick={() => handleCategoryFilter(category.id)}
                      >
                        <div className="flex items-center gap-3">
                          <CategoryIcon 
                            style={{ 
                              color: filters.activeCategory === category.id ? 'white' : category.iconColor,
                              transition: 'color 0.3s ease'
                            }}
                            className="text-lg group-hover:text-white" 
                            size={18}
                          />
                          <span className="font-medium font-roboto text-md">{category.label}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                          filters.activeCategory === category.id 
                            ? "bg-white/20 text-white" 
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-white/20 group-hover:text-white"
                        }`}>
                          {category.count}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Priority Filter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</h3>
                <button
                  onClick={() => toggleSection('priority')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-colors"
                >
                  {expandedSections.priority ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {expandedSections.priority && (
                <div className="space-y-2">
                  {[
                    { id: 'high', label: 'High Priority', icon: ArrowUp, iconColor: '#e67373', count: tasks.filter(t => t.priority === 'high').length },
                    { id: 'medium', label: 'Medium Priority', icon: Minus, iconColor: '#fbbf24', count: tasks.filter(t => t.priority === 'medium').length },
                    { id: 'low', label: 'Low Priority', icon: ArrowDown, iconColor: '#4cb04f', count: tasks.filter(t => t.priority === 'low').length }
                  ].map(priority => {
                    const PriorityIcon = priority.icon;
                    return (
                      <Button
                        key={priority.id}
                        variant={filters.activePriority === priority.id ? "primary" : "secondaryPro"}
                        size="sm"
                        className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                          filters.activePriority === priority.id ? "bg-[#3D9B9B] text-white" : "text-gray-700 dark:text-gray-300"
                        }`}
                        onClick={() => handlePriorityFilter(priority.id)}
                      >
                        <div className="flex items-center gap-3">
                          <PriorityIcon 
                            style={{ 
                              color: filters.activePriority === priority.id ? 'white' : priority.iconColor,
                              transition: 'color 0.3s ease'
                            }}
                            className="text-lg group-hover:text-white" 
                            size={18}
                          />
                          <span className="font-medium text-sm">{priority.label}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                          filters.activePriority === priority.id 
                            ? "bg-white/20 text-white" 
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-white/20 group-hover:text-white"
                        }`}>
                          {priority.count}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sort By */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sort by</h3>
                <button
                  onClick={() => toggleSection('sort')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-colors"
                >
                  {expandedSections.sort ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {expandedSections.sort && (
                <div className="space-y-2">
                  {[
                    { id: 'dueDate', label: 'Due Date', icon: Calendar, iconColor: '#3D9B9B' },
                    { id: 'priority', label: 'Priority', icon: Flag, iconColor: '#3D9B9B' },
                    { id: 'category', label: 'Category', icon: Folder, iconColor: '#3D9B9B' },
                    { id: 'created', label: 'Created Date', icon: Calendar, iconColor: '#3D9B9B' }
                  ].map(sort => {
                    const SortIcon = sort.icon;
                    return (
                      <Button
                        key={sort.id}
                        variant={filters.sortBy === sort.id ? "primary" : "secondaryPro"}
                        size="md"
                        className={`group flex items-center w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                          filters.sortBy === sort.id ? "bg-[#3D9B9B] text-white" : "text-gray-700 dark:text-gray-300"
                        }`}
                        onClick={() => handleSortChange(sort.id)}
                      >
                        <SortIcon 
                          style={{ 
                            color: filters.sortBy === sort.id ? 'white' : sort.iconColor,
                            transition: 'color 0.3s ease'
                          }}
                          className="text-lg mr-3 group-hover:text-white" 
                          size={18}
                        />
                        <span className="font-medium text-sm">{sort.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop Full Sidebar
  return (
    <>
      <div className="hidden md:block w-[280px] h-full bg-[#f2f5f7] dark:bg-gray-800 shadow-md shadow-black overflow-y-auto transition-all duration-300">
        <div className="p-4">
          {/* Collapse Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="icon"
              size="xs"
              className="hover:bg-[#2d7b7b] hover:text-white"
              onClick={toggleSidebar}
            >
              <PanelLeftOpen className="text-sm" size={20} />
            </Button>
          </div>

          {/* Views Filter */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-roboto font-semibold text-gray-500 dark:text-gray-400 uppercase">Views</h3>
              <button
                onClick={() => toggleSection('views')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-colors"
              >
                {expandedSections.views ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {expandedSections.views && (
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'All Tasks', icon: NotebookText, iconColor: '#3D9B9B', count: tasks.length },
                  { id: 'today', label: 'Today', icon: Calendar, iconColor: '#3D9B9B', count: todayTasks.length },
                  { id: 'week', label: 'This Week', icon: CalendarDays, iconColor: '#3D9B9B', count: weekTasks.length },
                  { id: 'overdue', label: 'Overdue', icon: AlertCircle, iconColor: '#e67373', count: overdue },
                  { id: 'completed', label: 'Completed', icon: CheckCircle, iconColor: '#4cb04f', count: completed }
                ].map(view => {
                  const IconComponent = view.icon;
                  return (
                    <Button
                      key={view.id}
                      variant={filters.activeView === view.id ? "primary" : "secondaryPro"}
                      size="sm"
                      className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                        filters.activeView === view.id ? "bg-[#3D9B9B] text-white" : "text-gray-700 dark:text-gray-300"
                      }`}
                      onClick={() => handleViewFilter(view.id)}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent 
                          style={{ 
                            color: filters.activeView === view.id ? 'white' : view.iconColor,
                            transition: 'color 0.3s ease'
                          }}
                          className="text-lg group-hover:text-white" 
                          size={18}
                        />
                        <span className="font-medium font-roboto text-sm">{view.label}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                        filters.activeView === view.id 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-white/20 group-hover:text-white"
                      }`}>
                        {view.count}
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Categories Filter */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold font-roboto text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categories</h3>
              <button
                onClick={() => toggleSection('categories')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-colors"
              >
                {expandedSections.categories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {expandedSections.categories && (
              <div className="space-y-2">
                {[
                  { id: 'work', label: 'Work', icon: Briefcase, iconColor: '#3D9B9B', count: tasks.filter(t => t.category === 'work').length },
                  { id: 'personal', label: 'Personal', icon: House, iconColor: '#8B5CF6', count: tasks.filter(t => t.category === 'personal').length },
                  { id: 'health', label: 'Health', icon: Heart, iconColor: '#ffb84d', count: tasks.filter(t => t.category === 'health').length }
                ].map(category => {
                  const CategoryIcon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={filters.activeCategory === category.id ? "primary" : "secondaryPro"}
                      size="sm"
                      className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                        filters.activeCategory === category.id ? "bg-[#3D9B9B] text-white" : "text-gray-700 dark:text-gray-300"
                      }`}
                      onClick={() => handleCategoryFilter(category.id)}
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIcon 
                          style={{ 
                            color: filters.activeCategory === category.id ? 'white' : category.iconColor,
                            transition: 'color 0.3s ease'
                          }}
                          className="text-lg group-hover:text-white" 
                          size={18}
                        />
                        <span className="font-medium font-roboto text-md">{category.label}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                        filters.activeCategory === category.id 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-white/20 group-hover:text-white"
                      }`}>
                        {category.count}
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority Filter */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</h3>
              <button
                onClick={() => toggleSection('priority')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-colors"
              >
                {expandedSections.priority ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {expandedSections.priority && (
              <div className="space-y-2">
                {[
                  { id: 'high', label: 'High Priority', icon: ArrowUp, iconColor: '#e67373', count: tasks.filter(t => t.priority === 'high').length },
                  { id: 'medium', label: 'Medium Priority', icon: Minus, iconColor: '#fbbf24', count: tasks.filter(t => t.priority === 'medium').length },
                  { id: 'low', label: 'Low Priority', icon: ArrowDown, iconColor: '#4cb04f', count: tasks.filter(t => t.priority === 'low').length }
                ].map(priority => {
                  const PriorityIcon = priority.icon;
                  return (
                    <Button
                      key={priority.id}
                      variant={filters.activePriority === priority.id ? "primary" : "secondaryPro"}
                      size="sm"
                      className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                        filters.activePriority === priority.id ? "bg-[#3D9B9B] text-white" : "text-gray-700 dark:text-gray-300"
                      }`}
                      onClick={() => handlePriorityFilter(priority.id)}
                    >
                      <div className="flex items-center gap-3">
                        <PriorityIcon 
                          style={{ 
                            color: filters.activePriority === priority.id ? 'white' : priority.iconColor,
                            transition: 'color 0.3s ease'
                          }}
                          className="text-lg group-hover:text-white" 
                          size={18}
                        />
                        <span className="font-medium text-sm">{priority.label}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                        filters.activePriority === priority.id 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-white/20 group-hover:text-white"
                      }`}>
                        {priority.count}
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sort By */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sort by</h3>
              <button
                onClick={() => toggleSection('sort')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 transition-colors"
              >
                {expandedSections.sort ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {expandedSections.sort && (
              <div className="space-y-2">
                {[
                  { id: 'dueDate', label: 'Due Date', icon: Calendar, iconColor: '#3D9B9B' },
                  { id: 'priority', label: 'Priority', icon: Flag, iconColor: '#3D9B9B' },
                  { id: 'category', label: 'Category', icon: Folder, iconColor: '#3D9B9B' },
                  { id: 'created', label: 'Created Date', icon: Calendar, iconColor: '#3D9B9B' }
                ].map(sort => {
                  const SortIcon = sort.icon;
                  return (
                    <Button
                      key={sort.id}
                      variant={filters.sortBy === sort.id ? "primary" : "secondaryPro"}
                      size="md"
                      className={`group flex items-center w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                        filters.sortBy === sort.id ? "bg-[#3D9B9B] text-white" : "text-gray-700 dark:text-gray-300"
                      }`}
                      onClick={() => handleSortChange(sort.id)}
                    >
                      <SortIcon 
                        style={{ 
                          color: filters.sortBy === sort.id ? 'white' : sort.iconColor,
                          transition: 'color 0.3s ease'
                        }}
                        className="text-lg mr-3 group-hover:text-white" 
                        size={18}
                      />
                      <span className="font-medium text-sm">{sort.label}</span>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mt-8 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300">Filter Results</h3>
              <Button
                variant="secondaryPro"
                size="xs"
                onClick={handleResetFilters}
                className="text-xs"
              >
                Reset All
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Filtered Tasks</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-300">{filteredTasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-300">{tasks.length}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Match Rate</span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {tasks.length > 0 ? Math.round((filteredTasks.length / tasks.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskSidebar;