// Sidebar.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import Button from "../Button";
import { FiBell, FiHome, FiUser } from "react-icons/fi";
import { IoColorPaletteOutline } from "react-icons/io5";
import { MdOutlineShield } from "react-icons/md";
import { IoIosHelpCircleOutline } from "react-icons/io";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PanelLeftOpen, PanelRightOpen, Menu, NotebookText, ChevronDown, Wrench, AlarmClock, CalendarDays, X } from "lucide-react";
import ThemeModal from "../modals/ThemeModal";
import { useTheme } from "../../context/ThemeContext";
import { useTasks } from "../../context/TaskContext";

const SIDEBAR_TOOLS = [
  { id: "notes", label: "Notes", path: "/notes", icon: NotebookText },
  { id: "lists", label: "Lists", path: "/calendar", icon: CalendarDays },
  { id: "alarm", label: "Alarm", path: "/reminders", icon: AlarmClock }
];

const CalendarPopup = ({ isOpen, onClose, reminders, onOpenCalendarPage }) => {
  const [activeDate, setActiveDate] = useState(new Date());

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
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
    const day = reminder._date.getDate();
    const reminderMonth = reminder._date.getMonth();
    const reminderYear = reminder._date.getFullYear();
    if (reminderMonth === month && reminderYear === year) {
      if (!acc[day]) acc[day] = [];
      acc[day].push(reminder);
    }
    return acc;
  }, {});

  const selectedDateReminders = (remindersByDay[selectedDay] || []).sort(
    (a, b) => new Date(a._date) - new Date(b._date)
  );

  const monthLabel = activeDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const calendarCells = [];
  for (let i = 0; i < firstDay; i += 1) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarCells.push(day);
  }

  const goMonth = (offset) => {
    setActiveDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60">
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
            aria-label="Close calendar popup"
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
                if (!day) {
                  return <div key={`blank-${index}`} className="h-10" />;
                }
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
                          isSelected
                            ? "bg-white text-[#3D9B9B]"
                            : "bg-[#3D9B9B] text-white"
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
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Reminders for {selectedDay}</h4>
              <FiBell className="text-[#3D9B9B] dark:text-[#4fb3b3]" />
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
  isCollapsed,
  isOpen,
  onToggle,
  pathname,
  onToolNavigate,
  onCalendarClick,
  isCalendarPopupOpen
}) => (
  <div className="mb-4 relative">
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
      {!isCollapsed && (
        <span className="flex-1 text-left font-medium">Tools</span>
      )}
      {!isCollapsed && (
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      )}
    </button>

    {isOpen && !isCollapsed && (
      <div className="mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
        {SIDEBAR_TOOLS.map((tool, index) => {
          const ToolIcon = tool.icon;
          const isActive = pathname === tool.path || (tool.id === "lists" && isCalendarPopupOpen);
          const borderClass = index === SIDEBAR_TOOLS.length - 1 ? "" : "border-b border-gray-100 dark:border-gray-700";

          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => (tool.id === "lists" ? onCalendarClick() : onToolNavigate(tool.path))}
              className={`w-full p-3 flex items-center gap-3 text-left transition-colors ${
                isActive
                  ? "bg-[#3D9B9B] text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
              } ${borderClass}`}
            >
              <ToolIcon
                size={18}
                className={isActive ? "text-white" : "text-[#3D9B9B] dark:text-[#4fb3b3]"}
              />
              <span className="font-medium">{tool.label}</span>
            </button>
          );
        })}
      </div>
    )}

    {/* Collapsed mode tooltip */}
    {isCollapsed && isOpen && (
      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-lg whitespace-nowrap z-50">
        Tools
      </div>
    )}
  </div>
);

const Sidebar = ({ onToggle, isMobile, isOpen = false }) => {
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [fabPosition, setFabPosition] = useState({ x: window.innerWidth - 72, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const fabRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { reminders } = useTasks();

  // Derive collapsed state from props instead of using state
  const isCollapsed = isMobile ? true : !isOpen;

  // Initialize FAB position to top right and update on resize
  useEffect(() => {
    const updateFabPosition = () => {
      if (isMobile) {
        setFabPosition({ x: window.innerWidth - 72, y: 80 });
      }
    };
    
    updateFabPosition();
    window.addEventListener('resize', updateFabPosition);
    
    return () => window.removeEventListener('resize', updateFabPosition);
  }, [isMobile]);

  // FAB drag handlers
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: touch.clientX - fabPosition.x,
      y: touch.clientY - fabPosition.y
    });
  };

  const handleTouchMove = (e) => {
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
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    if (!isMobile) return;
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: e.clientX - fabPosition.x,
      y: e.clientY - fabPosition.y
    });
  };

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
  }, [isDragging, isMobile, dragStart, fabPosition]);

  const handleMouseUp = useCallback(() => {
    if (!isMobile) return;
    setIsDragging(false);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isMobile, handleMouseMove, handleMouseUp]);

  const handleFabClick = () => {
    if (!hasMoved) {
      toggleSidebar();
    }
  };

  const menuItems = [
    { id: "account", icon: <FiUser className="text-xl" />, label: "Account", path: "/account" },
    { id: "notifications", icon: <FiBell className="text-xl" />, label: "Notifications", path: "/notifications" },
    { id: "appearance", icon: <IoColorPaletteOutline className="text-xl" />, label: "Appearance", path: null },
    { id: "data-privacy", icon: <MdOutlineShield className="text-xl" />, label: "Settings", path: "/data-privacy" },
    { id: "help", icon: <IoIosHelpCircleOutline className="text-xl"/>, label: "Help & Support", path: "/help-support" }
  ];

  const toggleSidebar = () => {
    if (isMobile) {
      if (onToggle) onToggle(!isOpen);
    } else {
      if (onToggle) onToggle(isCollapsed);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLinkClick = () => {
    if (isMobile && onToggle) {
      onToggle(false);
    }
  };

  const handleHomeClick = () => {
    navigate("/dashboard");
    if (isMobile && onToggle) {
      onToggle(false);
    }
  };

  const handleToolNavigate = (path) => {
    setShowCalendarPopup(false);
    navigate(path);
    if (isMobile && onToggle) {
      onToggle(false);
    }
  };

  const handleCalendarToolClick = () => {
    setShowToolsDropdown(false);
    setShowCalendarPopup(true);
  };

  const handleOpenCalendarPage = () => {
    setShowCalendarPopup(false);
    navigate("/calendar");
    if (isMobile && onToggle) {
      onToggle(false);
    }
  };

  const handleAppearanceClick = () => {
    setShowThemeModal(true);
  };

  // Mobile FAB button when sidebar is closed
  if (isMobile && !isOpen) {
    return (
      <>
        <div 
          ref={fabRef}
          className="fixed z-50 cursor-move touch-none"
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
        
        <ThemeModal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />
      </>
    );
  }

  // Mobile sidebar - slides in from left with blurred backdrop
  if (isMobile && isOpen) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => onToggle(false)}
        />
        
        <div 
          className={`fixed left-0 top-0 h-full w-64 bg-[#f2f5f7] dark:bg-gray-800 shadow-xl rounded-2xl z-50 p-4 transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Header - separated action buttons */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => onToggle(false)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close sidebar"
            >
              <PanelRightOpen className="text-sm text-[#3D9B9B] dark:text-[#4fb3b3]" />
            </button>
            <button
              onClick={handleHomeClick}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Home"
            >
              <FiHome className="text-2xl text-[#3D9B9B] hover:text-[#2d7b7b] dark:text-[#4fb3b3] dark:hover:text-[#3D9B9B]" />
            </button>
          </div>

          <div className="mt-2">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              
              if (item.id === 'appearance') {
                return (
                  <Button
                    key={item.id}
                    onClick={handleAppearanceClick}
                    variant="secondaryPro"
                    className="group flex items-center hover:text-white hover:bg-[#3D9B9B] gap-4 w-full rounded-2xl p-3 mb-2 dark:hover:bg-[#2d7b7b]"
                  >
                    <span className="text-[#3D9B9B] group-hover:text-white dark:text-[#4fb3b3] dark:group-hover:text-white">
                      {item.icon}
                    </span>
                    <p className="group-hover:text-white text-sm md:text-base font-medium whitespace-nowrap dark:text-gray-200">
                      Appearance
                    </p>
                  </Button>
                );
              }
              
              return (
                <Link 
                  key={item.id} 
                  to={item.path}
                  onClick={handleLinkClick}
                  className="block mb-2"
                >
                  <Button
                    variant={active ? "primary" : "secondaryPro"}
                    className={`group flex items-center hover:text-white hover:bg-[#3D9B9B] gap-4 w-full rounded-2xl p-3 ${
                      active ? "bg-[#3D9B9B] text-white dark:bg-[#2d7b7b]" : "dark:hover:bg-[#2d7b7b]"
                    }`}
                  >
                    <span className={`${
                      active 
                        ? "text-white" 
                        : "text-[#3D9B9B] group-hover:text-white dark:text-[#4fb3b3] dark:group-hover:text-white"
                    }`}>
                      {item.icon}
                    </span>
                    <p className={`${
                      active 
                        ? "text-white" 
                        : "group-hover:text-white dark:text-gray-200"
                    } text-sm md:text-base font-medium whitespace-nowrap`}>
                      {item.label}
                    </p>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Tools below menu action buttons */}
          <ToolsDropdown
            isCollapsed={false}
            isOpen={showToolsDropdown}
            onToggle={() => setShowToolsDropdown((prev) => !prev)}
            pathname={location.pathname}
            onToolNavigate={handleToolNavigate}
            onCalendarClick={handleCalendarToolClick}
            isCalendarPopupOpen={showCalendarPopup}
          />

          {/* Dark mode below menu action buttons */}
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
        </div>
        
        <ThemeModal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />
        <CalendarPopup
          isOpen={showCalendarPopup}
          onClose={() => setShowCalendarPopup(false)}
          reminders={reminders}
          onOpenCalendarPage={handleOpenCalendarPage}
        />
      </>
    );
  }

  // Desktop sidebar
  return (
    <>
      <div className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } h-[calc(100vh-3.5rem)] bg-[#f2f5f7] dark:bg-gray-800 p-4 transition-all duration-300 fixed left-0 top-14 z-30`}>
        {/* Header action buttons */}
        <div className={`${isCollapsed ? "flex flex-wrap justify-center gap-2" : "flex items-center justify-between"} mb-4`}>
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Collapse sidebar"
            >
              <PanelRightOpen className="text-sm text-[#3D9B9B] dark:text-[#4fb3b3]" />
            </button>
          )}
          
          {isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="text-sm text-[#3D9B9B] dark:text-[#4fb3b3]" />
            </button>
          )}
          
          <button
            onClick={handleHomeClick}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative group"
            title={isCollapsed ? "Home" : ""}
          >
            <FiHome className="text-2xl text-[#3D9B9B] group-hover:text-[#2d7b7b] dark:text-[#4fb3b3] dark:group-hover:text-[#3D9B9B]" />
            
            {isCollapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                Home
              </span>
            )}
          </button>
        </div>

        <div className="mt-2">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            
            if (item.id === 'appearance') {
              return (
                <Button
                  key={item.id}
                  onClick={handleAppearanceClick}
                  variant="secondaryPro"
                  className={`group flex items-center hover:text-white hover:bg-[#3D9B9B] gap-4 w-full rounded-2xl mb-2 relative ${
                    isCollapsed ? 'justify-center px-0 relative' : ''
                  } dark:hover:bg-[#2d7b7b]`}
                  title={isCollapsed ? "Appearance" : ""}
                >
                  <span className="text-[#3D9B9B] group-hover:text-white dark:text-[#4fb3b3] dark:group-hover:text-white">
                    {item.icon}
                  </span>
                  
                  {isCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                      Appearance
                    </span>
                  )}
                  
                  {!isCollapsed && (
                    <p className="group-hover:text-white text-sm md:text-base lg:text-lg font-medium whitespace-nowrap transition-opacity duration-300 dark:text-gray-200">
                      Appearance
                    </p>
                  )}
                </Button>
              );
            }
            
            return (
              <Link 
                key={item.id} 
                to={item.path}
                onClick={handleLinkClick}
                className="block mb-2 relative"
                title={isCollapsed ? item.label : ""}
              >
                <Button
                  variant={active ? "primary" : "secondaryPro"}
                  className={`group flex items-center hover:text-white hover:bg-[#3D9B9B] gap-4 w-full rounded-2xl ${
                    active ? "bg-[#3D9B9B] text-white dark:bg-[#2d7b7b]" : "dark:hover:bg-[#2d7b7b]"
                  } ${isCollapsed ? 'justify-center px-0 relative' : ''}`}
                >
                  <span className={`${
                    active 
                      ? "text-white" 
                      : "text-[#3D9B9B] group-hover:text-white dark:text-[#4fb3b3] dark:group-hover:text-white"
                  }`}>
                    {item.icon}
                  </span>
                  
                  {isCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                      {item.label}
                    </span>
                  )}
                  
                  {!isCollapsed && (
                    <p className={`${
                      active 
                        ? "text-white" 
                        : "group-hover:text-white dark:text-gray-200"
                    } text-sm md:text-base lg:text-lg font-medium whitespace-nowrap transition-opacity duration-300`}>
                      {item.label}
                    </p>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Tools below menu action buttons */}
        {!isCollapsed && (
          <ToolsDropdown
            isCollapsed={false}
            isOpen={showToolsDropdown}
            onToggle={() => setShowToolsDropdown((prev) => !prev)}
            pathname={location.pathname}
            onToolNavigate={handleToolNavigate}
            onCalendarClick={handleCalendarToolClick}
            isCalendarPopupOpen={showCalendarPopup}
          />
        )}

        {/* Collapsed mode tools shortcuts */}
        {isCollapsed && (
          <div className="flex flex-col items-center gap-2 mb-4">
            {SIDEBAR_TOOLS.map((tool) => {
              const ToolIcon = tool.icon;
              const isActiveTool = location.pathname === tool.path || (tool.id === "lists" && showCalendarPopup);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => (tool.id === "lists" ? handleCalendarToolClick() : handleToolNavigate(tool.path))}
                  className={`p-2 rounded-lg transition-colors ${
                    isActiveTool
                      ? "bg-[#3D9B9B]"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700"
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
          </div>
        )}

        {/* Dark mode below menu action buttons */}
        {!isCollapsed && (
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
        )}

        {/* Collapsed mode dark mode toggle */}
        {isCollapsed && (
          <div className="flex justify-center mb-4">
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
        )}
      </div>
      
      <ThemeModal 
        isOpen={showThemeModal} 
        onClose={() => setShowThemeModal(false)} 
      />
      <CalendarPopup
        isOpen={showCalendarPopup}
        onClose={() => setShowCalendarPopup(false)}
        reminders={reminders}
        onOpenCalendarPage={handleOpenCalendarPage}
      />
    </>
  );
};

export default Sidebar;
