// TaskSidebar.jsx
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
  X,
  Home,
  Wrench,
  AlarmClock
} from "lucide-react";
import Button from "../Button";
import { useTasks } from "../../context/TaskContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

// MobileOverlay component with blur
const MobileOverlay = ({ isOpen, onClose }) => (
  <div 
    className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-300 ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}
    onClick={onClose}
  />
);

const TOOLS = [
  { id: "notes", label: "Notes", path: "/notes", icon: NotebookText },
  { id: "lists", label: "Lists", path: "/calendar", icon: CalendarDays },
  { id: "alarm", label: "Alarm", path: "/reminders", icon: AlarmClock }
];

const ReminderCalendarPopup = ({ isOpen, onClose, reminders, onOpenCalendarPage }) => {
  const [activeDate, setActiveDate] = useState(new Date());

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedDay = activeDate.getDate();

  const normalizedReminders = reminders
    .map((reminder) => {
      const date = new Date(reminder.reminderTime || reminder.dueDate);
      if (Number.isNaN(date.getTime())) return null;
      return { ...reminder, _date: date };
    })
    .filter(Boolean);

  const remindersByDay = normalizedReminders.reduce((acc, reminder) => {
    if (reminder._date.getFullYear() === year && reminder._date.getMonth() === month) {
      const day = reminder._date.getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push(reminder);
    }
    return acc;
  }, {});

  const selectedDateReminders = (remindersByDay[selectedDay] || []).sort(
    (a, b) => new Date(a._date) - new Date(b._date)
  );

  const monthLabel = activeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const calendarCells = [];
  for (let i = 0; i < firstDay; i += 1) calendarCells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) calendarCells.push(day);

  const goMonth = (offset) => {
    setActiveDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60">
      <div className="w-full max-w-3xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="text-[#3D9B9B] dark:text-[#4fb3b3]" size={20} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reminder Calendar</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close reminder calendar popup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-4 p-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                className="px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Prev
              </button>
              <p className="font-medium text-gray-900 dark:text-gray-100">{monthLabel}</p>
              <button
                type="button"
                onClick={() => goMonth(1)}
                className="px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                <div key={dayName}>{dayName}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} className="h-10" />;
                const dayReminders = remindersByDay[day] || [];
                const isSelected = day === selectedDay;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setActiveDate(new Date(year, month, day))}
                    className={`h-10 rounded-lg text-sm relative transition-colors ${
                      isSelected
                        ? "bg-[#3D9B9B] text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {day}
                    {dayReminders.length > 0 && (
                      <span
                        className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[10px] leading-4 ${
                          isSelected ? "bg-white text-[#3D9B9B]" : "bg-[#3D9B9B] text-white"
                        }`}
                      >
                        {dayReminders.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlarmClock className="text-[#3D9B9B] dark:text-[#4fb3b3]" size={18} />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Reminders for {selectedDay}</h4>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {selectedDateReminders.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No reminders on this day.</p>
              )}
              {selectedDateReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-3"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{reminder.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {reminder._date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" • "}
                    {reminder.status || "upcoming"}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenCalendarPage}
              className="mt-4 w-full rounded-lg bg-[#3D9B9B] hover:bg-[#2d7b7b] text-white py-2 text-sm font-medium"
            >
              Open Calendar Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolsDropdown = ({
  isOpen,
  onToggle,
  pathname,
  onToolNavigate,
  onCalendarClick,
  isCalendarPopupOpen
}) => (
  <div className="mb-4">
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-2xl w-full transition-all duration-300 ${
        isOpen
          ? 'bg-[#3D9B9B] text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      <Wrench
        size={20}
        className={isOpen ? 'text-white' : 'text-[#3D9B9B] dark:text-[#4fb3b3]'}
      />
      <span className="flex-1 text-left font-medium">Tools</span>
      <ChevronDown
        size={16}
        className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>

    {isOpen && (
      <div className="mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
        {TOOLS.map((tool, index) => {
          const ToolIcon = tool.icon;
          const isActive = pathname === tool.path || (tool.id === "lists" && isCalendarPopupOpen);
          const itemBaseClass = "w-full p-3 flex items-center gap-3 text-left transition-colors";
          const activeClass = "bg-[#3D9B9B] text-white";
          const inactiveClass = "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750";
          const borderClass = index === TOOLS.length - 1 ? "" : "border-b border-gray-100 dark:border-gray-700";

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => (tool.id === "lists" ? onCalendarClick() : onToolNavigate(tool.path))}
              className={`${itemBaseClass} ${isActive ? activeClass : inactiveClass} ${borderClass}`}
            >
              <ToolIcon size={18} className={isActive ? "text-white" : "text-[#3D9B9B] dark:text-[#4fb3b3]"} />
              <span className="font-medium">{tool.label}</span>
            </button>
          );
        })}
      </div>
    )}
  </div>
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
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const fabRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  
  // Get tasks and filter functions from context
  const {
    tasks,
    reminders,
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

    if (Math.abs(newX - fabPosition.x) > 5 || Math.abs(newY - fabPosition.y) > 5) {
      setHasMoved(true);
    }

    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;

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

    if (Math.abs(newX - fabPosition.x) > 5 || Math.abs(newY - fabPosition.y) > 5) {
      setHasMoved(true);
    }

    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;

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

  const handleHomeClick = () => {
    navigate("/dashboard", { state: { from: "task-sidebar", ts: Date.now() } });
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleToolNavigate = (path) => {
    setShowCalendarPopup(false);
    navigate(path);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleCalendarToolClick = () => {
    setShowToolsDropdown(false);
    setShowCalendarPopup(true);
  };

  const handleOpenCalendarPage = () => {
    setShowCalendarPopup(false);
    navigate("/calendar");
    if (isMobile) {
      setIsMobileMenuOpen(false);
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

  // Collapsed sidebar for desktop
  if (isCollapsed && !isMobile) {
    return (
      <>
        <div className="w-16 h-full bg-[#f2f5f7] dark:bg-gray-800 shadow-md shadow-black overflow-y-auto transition-all duration-300 hidden md:block">
          <div className="p-4 flex flex-col items-center">
            <Button
              variant="icon"
              size="xs"
              className="mb-6 hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={toggleSidebar}
            >
              <PanelRightOpen className="text-sm text-[#3D9B9B] dark:text-[#4fb3b3]" size={20} />
            </Button>
            
            {/* Home Icon */}
            <button
              onClick={handleHomeClick}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mb-6"
              title="Home"
            >
              <Home size={20} className="text-[#3D9B9B] dark:text-[#4fb3b3]" />
            </button>

            <div className="flex flex-col items-center gap-2 mb-4">
              {TOOLS.map((tool) => {
                const ToolIcon = tool.icon;
                const isActiveTool = location.pathname === tool.path || (tool.id === "lists" && showCalendarPopup);
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => (tool.id === "lists" ? handleCalendarToolClick() : handleToolNavigate(tool.path))}
                    className={`p-2 rounded-lg transition-colors ${
                      isActiveTool ? "bg-[#3D9B9B]" : "hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                    title={tool.label}
                  >
                    <ToolIcon
                      size={20}
                      className={isActiveTool ? "text-white" : "text-[#3D9B9B] dark:text-[#4fb3b3]"}
                    />
                  </button>
                );
              })}
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isDarkMode ? 'bg-[#3D9B9B]' : 'bg-gray-400'
                }`}
                title={isDarkMode ? "Disable Dark Mode" : "Enable Dark Mode"}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <CalendarDays size={20} className="text-[#3D9B9B] dark:text-[#4fb3b3] mb-7" />
              <AlertCircle size={20} className="text-[#e67373] mb-7" />
              <CheckCircle size={20} className="text-[#4cb04f]" />
            </div>
          </div>
        </div>
        <ReminderCalendarPopup
          isOpen={showCalendarPopup}
          onClose={() => setShowCalendarPopup(false)}
          reminders={reminders}
          onOpenCalendarPage={handleOpenCalendarPage}
        />
      </>
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
            className="bg-[#3D9B9B] hover:bg-[#2d7b7b] text-white rounded-full p-4 shadow-lg active:shadow-xl transition-all duration-200 dark:bg-[#2d7b7b] dark:hover:bg-[#3D9B9B]"
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
        <div className={`fixed left-0 top-0 h-full w-[280px] sm:w-[320px] bg-[#f2f5f7] dark:bg-gray-800 shadow-xl z-50 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 h-full overflow-y-auto">
            {/* Mobile Header - separated action buttons */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="icon"
                size="xs"
                className="hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </Button>
              <button
                onClick={handleHomeClick}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Home"
              >
                <Home size={20} className="text-[#3D9B9B] dark:text-[#4fb3b3]" />
              </button>
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
                        onClick={() => {
                          updateFilters({ activeView: view.id, activeCategory: null, activePriority: null });
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent
                            style={{
                              color: filters.activeView === view.id ? 'white' : view.iconColor
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
                        onClick={() => {
                          updateFilters({ activeCategory: category.id, activeView: null, activePriority: null });
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <CategoryIcon 
                            style={{ 
                              color: filters.activeCategory === category.id ? 'white' : category.iconColor
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
                        onClick={() => {
                          updateFilters({ activePriority: priority.id, activeView: null, activeCategory: null });
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <PriorityIcon 
                            style={{ 
                              color: filters.activePriority === priority.id ? 'white' : priority.iconColor
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
                        onClick={() => {
                          updateFilters({ sortBy: sort.id });
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <SortIcon 
                          style={{ 
                            color: filters.sortBy === sort.id ? 'white' : sort.iconColor
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

            {/* Tools below action buttons */}
            <ToolsDropdown
              isOpen={showToolsDropdown}
              onToggle={() => setShowToolsDropdown((prev) => !prev)}
              pathname={location.pathname}
              onToolNavigate={handleToolNavigate}
              onCalendarClick={handleCalendarToolClick}
              isCalendarPopupOpen={showCalendarPopup}
            />

            {/* Dark mode below action buttons */}
            <div className="mb-4 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Dark Mode</span>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isDarkMode ? 'bg-[#3D9B9B]' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Results Summary */}
            <div className="mt-8 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300">Filter Results</h3>
                <Button
                  variant="secondaryPro"
                  size="xs"
                  onClick={() => {
                    resetFilters();
                    setIsMobileMenuOpen(false);
                  }}
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
        <ReminderCalendarPopup
          isOpen={showCalendarPopup}
          onClose={() => setShowCalendarPopup(false)}
          reminders={reminders}
          onOpenCalendarPage={handleOpenCalendarPage}
        />
      </>
    );
  }

  // Desktop Full Sidebar
  return (
    <>
      <div className="hidden md:block w-[280px] h-full bg-[#f2f5f7] dark:bg-gray-800 shadow-md shadow-black overflow-y-auto transition-all duration-300">
        <div className="p-4">
          {/* Header action buttons */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="icon"
              size="xs"
              className="hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={toggleSidebar}
            >
              <PanelLeftOpen className="text-sm text-[#3D9B9B] dark:text-[#4fb3b3]" size={20} />
            </Button>
            <button
              onClick={handleHomeClick}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Home"
            >
              <Home size={20} className="text-[#3D9B9B] dark:text-[#4fb3b3]" />
            </button>
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
                      onClick={() => updateFilters({ activeView: view.id, activeCategory: null, activePriority: null })}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent 
                          style={{ 
                            color: filters.activeView === view.id ? 'white' : view.iconColor
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
                      onClick={() => updateFilters({ activeCategory: category.id, activeView: null, activePriority: null })}
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIcon 
                          style={{ 
                            color: filters.activeCategory === category.id ? 'white' : category.iconColor
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
                      onClick={() => updateFilters({ activePriority: priority.id, activeView: null, activeCategory: null })}
                    >
                      <div className="flex items-center gap-3">
                        <PriorityIcon 
                          style={{ 
                            color: filters.activePriority === priority.id ? 'white' : priority.iconColor
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
                      onClick={() => updateFilters({ sortBy: sort.id })}
                    >
                      <SortIcon 
                        style={{ 
                          color: filters.sortBy === sort.id ? 'white' : sort.iconColor
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

          {/* Tools below action buttons */}
          <ToolsDropdown
            isOpen={showToolsDropdown}
            onToggle={() => setShowToolsDropdown((prev) => !prev)}
            pathname={location.pathname}
            onToolNavigate={handleToolNavigate}
            onCalendarClick={handleCalendarToolClick}
            isCalendarPopupOpen={showCalendarPopup}
          />

          {/* Dark mode below action buttons */}
          <div className="mb-4 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">Dark Mode</span>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isDarkMode ? 'bg-[#3D9B9B]' : 'bg-gray-400'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Results Summary */}
          <div className="mt-8 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300">Filter Results</h3>
              <Button
                variant="secondaryPro"
                size="xs"
                onClick={resetFilters}
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
      <ReminderCalendarPopup
        isOpen={showCalendarPopup}
        onClose={() => setShowCalendarPopup(false)}
        reminders={reminders}
        onOpenCalendarPage={handleOpenCalendarPage}
      />
    </>
  );
};

export default TaskSidebar;
