import React, { useState, useEffect } from "react";
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

const TaskSidebar = () => {
  const [activeView, setActiveView] = useState("all");
  const [activeCategory, setActiveCategory] = useState(null);
  const [activePriority, setActivePriority] = useState(null);
  const [sortBy, setSortBy] = useState("dueDate");
  const [expandedSections, setExpandedSections] = useState({
    views: true,
    categories: true,
    priority: true,
    sort: true
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Review quarterly budget report',
      description: '',
      dueDate: '2024-01-20T20:00:00',
      priority: 'high',
      category: 'work',
      completed: false,
      overdue: true
    },
    {
      id: 2,
      title: 'Prepare presentation slides',
      description: '',
      dueDate: '2024-01-22T17:30:00',
      priority: 'medium',
      category: 'work',
      completed: false,
      overdue: false
    },
    {
      id: 3,
      title: 'Schedule dentist appointment',
      description: '',
      dueDate: '2024-01-23T10:00:00',
      priority: 'low',
      category: 'personal',
      completed: false,
      overdue: false
    },
    {
      id: 4,
      title: 'Morning workout routine',
      description: '',
      dueDate: '2024-01-22T08:00:00',
      priority: 'medium',
      category: 'health',
      completed: true,
      overdue: false
    },
    {
      id: 5,
      title: 'Buy groceries for the week',
      description: '',
      dueDate: '2024-01-26T21:00:00',
      priority: 'low',
      category: 'personal',
      completed: false,
      overdue: false
    }
  ]);

  const pending = tasks.filter(t => !t.completed && !t.overdue).length;
  const completed = tasks.filter(t => t.completed).length;
  const overdue = tasks.filter(t => t.overdue && !t.completed).length;

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse on mobile
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  useEffect(() => {
    localStorage.setItem('taskFilters', JSON.stringify({
      activeView,
      activeCategory,
      activePriority,
      sortBy
    }));
  }, [activeView, activeCategory, activePriority, sortBy]);

  // Mobile sidebar overlay
  const MobileOverlay = () => (
    <div 
      className={`fixed inset-0  bg-opacity-50 z-40 transition-opacity duration-300 ${
        isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setIsMobileMenuOpen(false)}
    />
  );

  // Collapsed sidebar for desktop
  if (isCollapsed && !isMobile) {
    return (
      <div className="w-16 h-full bg-[#f2f5f7] shadow-md shadow-black overflow-y-auto transition-all duration-300 hidden md:block">
        <div className="p-4 flex flex-col items-center">
          {/* Collapse/Expand Button */}
          <Button
            variant="icon"
            size="xs"
            className="mb-6"
            onClick={toggleSidebar}
          >
            <PanelRightOpen className="text-sm" size={20} />
          </Button>
          
          {/* Collapsed Icons Only */}
          <div className="space-y-4">
            {/* Views Icons */}
            <div className="flex flex-col items-center space-y-2">
              <NotebookText size={20} className="text-[#3D9B9B] mb-7" />
              <Calendar size={20} className="text-[#313333] mb-7" />
              <CalendarDays size={20} className="text-[#3D9B9B] mb-7" />
              <AlertCircle size={20} className="text-[#e67373] mb-7" />
              <CheckCircle size={20} className="text-[#4cb04f]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Menu Button (only on mobile)
  if (isMobile && !isMobileMenuOpen) {
    return (
      <>
        <div className="fixed top-4 left-4 z-30 md:hidden">
          <Button
            variant="primary"
            size="sm"
            className="rounded-full p-3 shadow-lg"
            onClick={toggleSidebar}
          >
            <Menu size={20} />
          </Button>
        </div>
      </>
    );
  }

  // Mobile Sidebar Drawer - Adjusted width for mobile/tablet only
  if (isMobile && isMobileMenuOpen) {
    return (
      <>
        <MobileOverlay />
        <div className={`fixed left-0 top-0 h-full w-[280px] sm:w-[320px] bg-[#f2f5f7] shadow-xl z-50 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 h-full overflow-y-auto">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold font-roboto text-gray-800">Task Filters</h2>
              <Button
                variant="icon"
                size="xs"
                className="hover:bg-gray-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={20} />
              </Button>
            </div>

            {/* Views Filter */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[15px] font-roboto font-semibold text-gray-500 uppercase">Views</h3>
                <button
                  onClick={() => toggleSection('views')}
                  className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                >
                  {expandedSections.views ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {expandedSections.views && (
                <div className="space-y-2">
                  {[
                    { id: 'all', label: 'All Tasks', icon: NotebookText, iconColor: '#3D9B9B', count: tasks.length },
                    { id: 'today', label: 'Today', icon: Calendar, iconColor: '#3D9B9B', count: tasks.filter(t => new Date(t.dueDate).toDateString() === new Date().toDateString()).length },
                    { id: 'week', label: 'This Week', icon: CalendarDays, iconColor: '#3D9B9B', count: 2 },
                    { id: 'overdue', label: 'Overdue', icon: AlertCircle, iconColor: '#e67373', count: overdue },
                    { id: 'completed', label: 'Completed', icon: CheckCircle, iconColor: '#4cb04f', count: completed }
                  ].map(view => {
                    const IconComponent = view.icon;
                    return (
                      <Button
                        key={view.id}
                        variant={activeView === view.id ? "primary" : "secondaryPro"}
                        size="sm"
                        className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                          activeView === view.id ? "bg-[#3D9B9B] text-white" : "text-gray-700"
                        }`}
                        onClick={() => {
                          setActiveView(view.id);
                          setActiveCategory(null);
                          setActivePriority(null);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent 
                            style={{ 
                              color: activeView === view.id ? 'white' : view.iconColor,
                              transition: 'color 0.3s ease'
                            }}
                            className="text-lg group-hover:text-white" 
                            size={18}
                          />
                          <span className="font-medium font-roboto text-sm">{view.label}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                          activeView === view.id 
                            ? "bg-white/20 text-white" 
                            : "bg-gray-200 text-gray-600 group-hover:bg-white/20 group-hover:text-white"
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
                <h3 className="text-xs font-semibold font-roboto text-gray-500 uppercase tracking-wider">Categories</h3>
                <button
                  onClick={() => toggleSection('categories')}
                  className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
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
                        variant={activeCategory === category.id ? "primary" : "secondaryPro"}
                        size="sm"
                        className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                          activeCategory === category.id ? "bg-[#3D9B9B] text-white" : "text-gray-700"
                        }`}
                        onClick={() => {
                          setActiveCategory(category.id);
                          setActiveView(null);
                          setActivePriority(null);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <CategoryIcon 
                            style={{ 
                              color: activeCategory === category.id ? 'white' : category.iconColor,
                              transition: 'color 0.3s ease'
                            }}
                            className="text-lg group-hover:text-white" 
                            size={18}
                          />
                          <span className="font-medium font-roboto text-md">{category.label}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                          activeCategory === category.id 
                            ? "bg-white/20 text-white" 
                            : "bg-gray-200 text-gray-600 group-hover:bg-white/20 group-hover:text-white"
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
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</h3>
                <button
                  onClick={() => toggleSection('priority')}
                  className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
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
                        variant={activePriority === priority.id ? "primary" : "secondaryPro"}
                        size="sm"
                        className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                          activePriority === priority.id ? "bg-[#3D9B9B] text-white" : "text-gray-700"
                        }`}
                        onClick={() => {
                          setActivePriority(priority.id);
                          setActiveView(null);
                          setActiveCategory(null);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <PriorityIcon 
                            style={{ 
                              color: activePriority === priority.id ? 'white' : priority.iconColor,
                              transition: 'color 0.3s ease'
                            }}
                            className="text-lg group-hover:text-white" 
                            size={18}
                          />
                          <span className="font-medium text-sm">{priority.label}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                          activePriority === priority.id 
                            ? "bg-white/20 text-white" 
                            : "bg-gray-200 text-gray-600 group-hover:bg-white/20 group-hover:text-white"
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
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort by</h3>
                <button
                  onClick={() => toggleSection('sort')}
                  className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
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
                        variant={sortBy === sort.id ? "primary" : "secondaryPro"}
                        size="md"
                        className={`group flex items-center w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                          sortBy === sort.id ? "bg-[#3D9B9B] text-white" : "text-gray-700"
                        }`}
                        onClick={() => {
                          setSortBy(sort.id);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <SortIcon 
                          style={{ 
                            color: sortBy === sort.id ? 'white' : sort.iconColor,
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

  // Desktop Full Sidebar - Original width (unchanged)
  return (
    <>
      {/* Mobile Menu Button (hidden on desktop) */}
      <div className="fixed top-4 left-4 z-30 md:hidden">
        <Button
          variant="primary"
          size="sm"
          className="rounded-full p-3 shadow-lg"
          onClick={toggleSidebar}
        >
          <Menu size={20} />
        </Button>
      </div>

      {/* Desktop Sidebar - Original width */}
      <div className="hidden md:block w-[280px] h-full bg-[#f2f5f7] shadow-md shadow-black overflow-y-auto transition-all duration-300">
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
              <h3 className="text-[15px] font-roboto font-semibold text-gray-500 uppercase">Views</h3>
              <button
                onClick={() => toggleSection('views')}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
              >
                {expandedSections.views ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {expandedSections.views && (
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'All Tasks', icon: NotebookText, iconColor: '#3D9B9B', count: tasks.length },
                  { id: 'today', label: 'Today', icon: Calendar, iconColor: '#3D9B9B', count: tasks.filter(t => new Date(t.dueDate).toDateString() === new Date().toDateString()).length },
                  { id: 'week', label: 'This Week', icon: CalendarDays, iconColor: '#3D9B9B', count: 2 },
                  { id: 'overdue', label: 'Overdue', icon: AlertCircle, iconColor: '#e67373', count: overdue },
                  { id: 'completed', label: 'Completed', icon: CheckCircle, iconColor: '#4cb04f', count: completed }
                ].map(view => {
                  const IconComponent = view.icon;
                  return (
                    <Button
                      key={view.id}
                      variant={activeView === view.id ? "primary" : "secondaryPro"}
                      size="sm"
                      className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                        activeView === view.id ? "bg-[#3D9B9B] text-white" : "text-gray-700"
                      }`}
                      onClick={() => {
                        setActiveView(view.id);
                        setActiveCategory(null);
                        setActivePriority(null);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent 
                          style={{ 
                            color: activeView === view.id ? 'white' : view.iconColor,
                            transition: 'color 0.3s ease'
                          }}
                          className="text-lg group-hover:text-white" 
                          size={18}
                        />
                        <span className="font-medium font-roboto text-sm">{view.label}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                        activeView === view.id 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-200 text-gray-600 group-hover:bg-white/20 group-hover:text-white"
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
              <h3 className="text-xs font-semibold font-roboto text-gray-500 uppercase tracking-wider">Categories</h3>
              <button
                onClick={() => toggleSection('categories')}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
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
                      variant={activeCategory === category.id ? "primary" : "secondaryPro"}
                      size="sm"
                      className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                        activeCategory === category.id ? "bg-[#3D9B9B] text-white" : "text-gray-700"
                      }`}
                      onClick={() => {
                        setActiveCategory(category.id);
                        setActiveView(null);
                        setActivePriority(null);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIcon 
                          style={{ 
                            color: activeCategory === category.id ? 'white' : category.iconColor,
                            transition: 'color 0.3s ease'
                          }}
                          className="text-lg group-hover:text-white" 
                          size={18}
                        />
                        <span className="font-medium font-roboto text-md">{category.label}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                        activeCategory === category.id 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-200 text-gray-600 group-hover:bg-white/20 group-hover:text-white"
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
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</h3>
              <button
                onClick={() => toggleSection('priority')}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
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
                      variant={activePriority === priority.id ? "primary" : "secondaryPro"}
                      size="sm"
                      className={`group flex items-center justify-between w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                        activePriority === priority.id ? "bg-[#3D9B9B] text-white" : "text-gray-700"
                      }`}
                      onClick={() => {
                        setActivePriority(priority.id);
                        setActiveView(null);
                        setActiveCategory(null);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <PriorityIcon 
                          style={{ 
                            color: activePriority === priority.id ? 'white' : priority.iconColor,
                            transition: 'color 0.3s ease'
                          }}
                          className="text-lg group-hover:text-white" 
                          size={18}
                        />
                        <span className="font-medium text-sm">{priority.label}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium min-w-8 text-center transition-colors ${
                        activePriority === priority.id 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-200 text-gray-600 group-hover:bg-white/20 group-hover:text-white"
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
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort by</h3>
              <button
                onClick={() => toggleSection('sort')}
                className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
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
                      variant={sortBy === sort.id ? "primary" : "secondaryPro"}
                      size="md"
                      className={`group flex items-center w-full p-3 rounded-2xl text-left hover:text-white hover:bg-[#3D9B9B] transition-all duration-300 ${
                        sortBy === sort.id ? "bg-[#3D9B9B] text-white" : "text-gray-700"
                      }`}
                      onClick={() => setSortBy(sort.id)}
                    >
                      <SortIcon 
                        style={{ 
                          color: sortBy === sort.id ? 'white' : sort.iconColor,
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
};

export default TaskSidebar;