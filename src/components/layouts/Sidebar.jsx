// Sidebar.jsx
// ─── CHANGES FROM ORIGINAL ────────────────────────────────────────────────────
// 1. Added RingtoneQuickPanel — a slide-out panel that appears when the user
//    clicks the small 🎵 icon next to "Notifications" in the sidebar.
//    It shows the ringtone picker + volume slider + preview inline, without
//    needing to navigate away from the current page.
// 2. The Notifications menu item now has a small music note icon button
//    alongside it that toggles the quick panel.
// 3. All existing layout, dark mode, collapse behaviour, tools dropdown,
//    calendar popup, FAB drag logic and ThemeModal are 100% unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from "react";
import Button from "../Button";
import { FiBell, FiHome, FiUser } from "react-icons/fi";
import { IoColorPaletteOutline } from "react-icons/io5";
import { MdOutlineShield } from "react-icons/md";
import { IoIosHelpCircleOutline } from "react-icons/io";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  PanelLeftOpen, PanelRightOpen, Menu, NotebookText,
  ChevronDown, Wrench, AlarmClock, CalendarDays, X, Music2,
} from "lucide-react";
import ThemeModal from "../modals/ThemeModal";
import { useTheme } from "../../hooks/useTheme";
import { useTasks } from "../../context/TaskContext";
import { useNotifications } from "../../hooks/useNotifications";
import { ringtoneManager } from "../../services/ringtones/RingtoneManager";

const SIDEBAR_TOOLS = [
  { id: "notes",  label: "Notes",                path: "/notes",        icon: NotebookText, type: "route" },
  { id: "lists",  label: "Lists",                path: "/calendar",     icon: CalendarDays, type: "calendar" },
  { id: "alarm",  label: "Alarm",                path: "/reminders",    icon: AlarmClock,   type: "route" },
  { id: "sounds", label: "Notification Sounds",  path: null,            icon: Music2,       type: "sound" },
];

const tooltipClassName = "absolute left-full ml-2 px-2 py-1 rounded-md text-sm whitespace-nowrap z-50 pointer-events-none shadow-lg border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";
const SIDEBAR_DRAG_THRESHOLD = 56;

// ─── Ringtone Quick Panel ─────────────────────────────────────────────────────
// Appears alongside the sidebar when the 🎵 icon is clicked.
// Fully self-contained — reads from and writes to NotificationContext.
const RingtoneQuickPanel = ({ isOpen, onClose, isMobile, isCollapsed }) => {
  const {
    notificationSettings,
    updateNotificationSettings,
    previewRingtone,
    stopRingtone,
    ringtoneList,
  } = useNotifications();

  const [previewing, setPreviewing] = useState(null);
  const previewTimerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Stop any preview when panel closes
  useEffect(() => {
    if (!isOpen) {
      stopRingtone();
      setPreviewing(null);
      clearTimeout(previewTimerRef.current);
    }
  }, [isOpen, stopRingtone]);

  const handleSelectRingtone = (name) => {
    updateNotificationSettings({ defaultSound: name });
    ringtoneManager.select(name);
  };

  const handlePreview = (name) => {
    clearTimeout(previewTimerRef.current);
    if (previewing === name) {
      stopRingtone();
      setPreviewing(null);
      return;
    }
    stopRingtone();
    previewRingtone(name);
    setPreviewing(name);
    previewTimerRef.current = setTimeout(() => setPreviewing(null), 4000);
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    updateNotificationSettings({ ringtoneVolume: vol });
    ringtoneManager.setVolume(vol);
  };

  const handleToggleCustomRingtones = () => {
    updateNotificationSettings({
      customRingtones: !notificationSettings.customRingtones,
    });
  };

  if (!isOpen) return null;

  const panelClassName = isMobile
    ? "fixed left-4 right-4 top-20 z-50 max-w-sm mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
    : `fixed top-14 z-50 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden ${
        isCollapsed ? "left-24" : "left-64"
      }`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={panelClassName}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-[#3D9B9B]">
          <div className="flex items-center gap-2">
            <Music2 size={16} className="text-white" />
            <h3 className="text-sm font-semibold text-white">Notification Sound</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sound panel"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Custom ringtones toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Custom Ringtones
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Use MP3 files for richer sound
              </p>
            </div>
            <button
              onClick={handleToggleCustomRingtones}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                notificationSettings.customRingtones ? "bg-[#3D9B9B]" : "bg-gray-300 dark:bg-gray-600"
              }`}
              aria-label="Toggle custom ringtones"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  notificationSettings.customRingtones ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Volume slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Volume</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round((notificationSettings.ringtoneVolume ?? 0.8) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={notificationSettings.ringtoneVolume ?? 0.8}
              onChange={handleVolumeChange}
              className="w-full accent-[#3D9B9B]"
            />
          </div>

          {/* Ringtone list — only shown when custom ringtones is ON */}
          {notificationSettings.customRingtones && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Choose Ringtone
              </p>
              <div className="space-y-1.5">
                {ringtoneList.map(({ name, label, selected }) => (
                  <div
                    key={name}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                      selected
                        ? "border-[#3D9B9B] bg-[#3D9B9B]/5 dark:bg-[#3D9B9B]/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {/* Select */}
                    <button
                      onClick={() => handleSelectRingtone(name)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected
                            ? "border-[#3D9B9B] bg-[#3D9B9B]"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {selected && (
                          <span className="w-1 h-1 rounded-full bg-white block" />
                        )}
                      </span>
                      <span
                        className={`text-sm ${
                          selected
                            ? "text-[#3D9B9B] font-semibold"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {label}
                      </span>
                    </button>

                    {/* Preview */}
                    <button
                      onClick={() => handlePreview(name)}
                      className={`ml-2 p-1.5 rounded-lg border transition-colors ${
                        previewing === name
                          ? "border-[#3D9B9B] text-[#3D9B9B] bg-[#3D9B9B]/10"
                          : "border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      }`}
                      aria-label={`Preview ${label}`}
                    >
                      {previewing === name ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer link to full settings */}
          <Link
            to="/notifications"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm text-[#3D9B9B] dark:text-[#4fb3b3] hover:underline font-medium"
          >
            <FiBell size={14} />
            All Notification Settings
          </Link>
        </div>
      </div>
    </>
  );
};

// ─── CalendarPopup (unchanged) ────────────────────────────────────────────────
const CalendarPopup = ({ isOpen, onClose, reminders, onOpenCalendarPage }) => {
  const [activeDate, setActiveDate] = useState(new Date());

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event) => { if (event.key === "Escape") onClose(); };
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

  const monthLabel = activeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const calendarCells = [];
  for (let i = 0; i < firstDay; i += 1) calendarCells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) calendarCells.push(day);

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
              <button type="button" onClick={() => goMonth(-1)} className="px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Prev</button>
              <p className="font-medium text-gray-900 dark:text-gray-100">{monthLabel}</p>
              <button type="button" onClick={() => goMonth(1)} className="px-2 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Next</button>
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
                      isSelected ? "bg-[#3D9B9B] text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {day}
                    {dayReminders.length > 0 && (
                      <span className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[10px] leading-4 ${
                        isSelected ? "bg-white text-[#3D9B9B]" : "bg-[#3D9B9B] text-white"
                      }`}>
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
                <div key={reminder.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-3">
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

// ─── ToolsDropdown (unchanged) ────────────────────────────────────────────────
const ToolsDropdown = ({
  isCollapsed,
  isOpen,
  onToggle,
  pathname,
  onToolNavigate,
  onCalendarClick,
  isCalendarPopupOpen,
  isSoundPanelOpen,
  activeToolId,
  hoveredToolId,
  onToolHover,
  onToolLeave,
  onToolActivate,
  onSoundClick,
}) => (
  <div className="mb-4 relative">
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-2xl w-full transition-all duration-300 ${
        isOpen ? "bg-[#3D9B9B] text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      <Wrench size={20} className={isOpen ? "text-white" : "text-[#3D9B9B] dark:text-[#4fb3b3]"} />
      {!isCollapsed && <span className="flex-1 text-left font-medium">Tools</span>}
      {!isCollapsed && <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />}
    </button>

    {isOpen && !isCollapsed && (
      <div className="mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {SIDEBAR_TOOLS.map((tool, index) => {
          const ToolIcon = tool.icon;
          const matchesRoute = tool.path ? pathname === tool.path : false;
          const matchesState =
            (tool.id === "lists" && isCalendarPopupOpen) ||
            (tool.id === "sounds" && isSoundPanelOpen);
          const isActive =
            hoveredToolId === tool.id ||
            matchesRoute ||
            matchesState ||
            activeToolId === tool.id;
          const borderClass = index === SIDEBAR_TOOLS.length - 1 ? "" : "border-b border-gray-100 dark:border-gray-700";
          return (
            <button
              key={tool.id}
              type="button"
              onMouseEnter={() => onToolHover(tool.id)}
              onMouseLeave={onToolLeave}
              onFocus={() => onToolHover(tool.id)}
              onBlur={onToolLeave}
              onClick={() => {
                onToolActivate(tool.id);
                if (tool.type === "calendar") onCalendarClick();
                else if (tool.type === "sound") onSoundClick();
                else onToolNavigate(tool.path);
              }}
              className={`w-full p-3 flex items-center gap-3 text-left transition-colors ${
                isActive ? "bg-[#3D9B9B] text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
              } ${borderClass}`}
            >
              <ToolIcon size={18} className={isActive ? "text-white" : "text-[#3D9B9B] dark:text-[#4fb3b3]"} />
              <span className="font-medium">{tool.label}</span>
            </button>
          );
        })}
      </div>
    )}

    {isCollapsed && isOpen && (
      <div className={tooltipClassName}>
        Tools
      </div>
    )}
  </div>
);

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
const Sidebar = ({ onToggle, isMobile, isOpen = false }) => {
  const menuItems = [
    { id: "account",       icon: <FiUser className="text-xl" />,                  label: "Account",       path: "/account"       },
    { id: "notifications", icon: <FiBell className="text-xl" />,                  label: "Notifications", path: "/notifications"  },
    { id: "appearance",    icon: <IoColorPaletteOutline className="text-xl" />,    label: "Appearance",    path: null             },
    { id: "data-privacy",  icon: <MdOutlineShield className="text-xl" />,          label: "Settings",      path: "/data-privacy"  },
    { id: "help",          icon: <IoIosHelpCircleOutline className="text-xl" />,   label: "Help & Support",path: "/help-support"  },
  ];

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [fabPosition, setFabPosition] = useState({ x: window.innerWidth - 72, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [showRingtonePanel, setShowRingtonePanel] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [hoveredMenuId, setHoveredMenuId] = useState(null);
  const [activeToolId, setActiveToolId] = useState(null);
  const [hoveredToolId, setHoveredToolId] = useState(null);
  const fabRef = useRef(null);
  const dragGestureRef = useRef({ startX: null });
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { reminders } = useTasks();

  const isCollapsed = isMobile ? true : !isOpen;

  useEffect(() => {
    const matchedMenu = menuItems.find((item) => item.path && item.path === location.pathname);
    if (matchedMenu) setActiveMenuId(matchedMenu.id);

    const matchedTool = SIDEBAR_TOOLS.find((tool) => tool.path && tool.path === location.pathname);
    if (matchedTool) setActiveToolId(matchedTool.id);
  }, [location.pathname]);

  useEffect(() => {
    if (showRingtonePanel) setActiveToolId("sounds");
    else if (showCalendarPopup) setActiveToolId("lists");
  }, [showCalendarPopup, showRingtonePanel]);

  useEffect(() => {
    const updateFabPosition = () => {
      if (isMobile) setFabPosition({ x: window.innerWidth - 72, y: 80 });
    };
    updateFabPosition();
    window.addEventListener("resize", updateFabPosition);
    return () => window.removeEventListener("resize", updateFabPosition);
  }, [isMobile]);

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: touch.clientX - fabPosition.x, y: touch.clientY - fabPosition.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !isMobile) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    if (Math.abs(newX - fabPosition.x) > 5 || Math.abs(newY - fabPosition.y) > 5) setHasMoved(true);
    setFabPosition({ x: Math.max(0, Math.min(newX, window.innerWidth - 56)), y: Math.max(0, Math.min(newY, window.innerHeight - 56)) });
  };

  const handleTouchEnd = () => { if (isMobile) setIsDragging(false); };

  const handleMouseDown = (e) => {
    if (!isMobile) return;
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: e.clientX - fabPosition.x, y: e.clientY - fabPosition.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !isMobile) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    if (Math.abs(newX - fabPosition.x) > 5 || Math.abs(newY - fabPosition.y) > 5) setHasMoved(true);
    setFabPosition({ x: Math.max(0, Math.min(newX, window.innerWidth - 56)), y: Math.max(0, Math.min(newY, window.innerHeight - 56)) });
  }, [isDragging, isMobile, dragStart, fabPosition]);

  const handleMouseUp = useCallback(() => { if (isMobile) setIsDragging(false); }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isMobile, handleMouseMove, handleMouseUp]);

  const handleFabClick = () => { if (!hasMoved) toggleSidebar(); };

  const startSidebarDrag = useCallback((clientX) => {
    dragGestureRef.current.startX = clientX;
  }, []);

  const finishSidebarDrag = useCallback((clientX) => {
    const startX = dragGestureRef.current.startX;
    dragGestureRef.current.startX = null;
    if (typeof startX !== "number") return;

    const deltaX = clientX - startX;
    if (deltaX > SIDEBAR_DRAG_THRESHOLD && (isMobile ? !isOpen : isCollapsed)) {
      toggleSidebar();
    }
    if (deltaX < -SIDEBAR_DRAG_THRESHOLD && (isMobile ? isOpen : !isCollapsed)) {
      toggleSidebar();
    }
  }, [isCollapsed, isMobile, isOpen]);

  const toggleSidebar = () => {
    if (isMobile) { if (onToggle) onToggle(!isOpen); }
    else          { if (onToggle) onToggle(isCollapsed); }
  };

  const isActive = (path) => location.pathname === path;

  const handleLinkClick = (itemId) => {
    setActiveMenuId(itemId);
    if (isMobile && onToggle) onToggle(false);
  };

  const handleHomeClick = () => {
    navigate("/dashboard");
    if (isMobile && onToggle) onToggle(false);
  };

  const handleToolNavigate = (path) => {
    setShowCalendarPopup(false);
    navigate(path);
    if (isMobile && onToggle) onToggle(false);
  };

  const handleCalendarToolClick = () => {
    setShowToolsDropdown(false);
    setShowCalendarPopup(true);
    setActiveToolId("lists");
  };

  const handleOpenCalendarPage = () => {
    setShowCalendarPopup(false);
    navigate("/calendar");
    if (isMobile && onToggle) onToggle(false);
  };

  const handleAppearanceClick = () => {
    setActiveMenuId("appearance");
    setShowThemeModal(true);
  };

  const handleSoundToolClick = () => {
    setShowToolsDropdown(false);
    setShowRingtonePanel((prev) => !prev);
    setActiveToolId("sounds");
  };

  // ── Render a single menu item, with the 🎵 button on Notifications ────────
  const renderMenuItem = (item, collapsed) => {
    const active = hoveredMenuId === item.id || activeMenuId === item.id || isActive(item.path);

    if (item.id === "appearance") {
      return (
        <Button
          key={item.id}
          onClick={handleAppearanceClick}
          variant="secondaryPro"
          className={`group flex items-center hover:text-white hover:bg-[#3D9B9B] gap-4 w-full rounded-2xl mb-2 relative ${
            collapsed ? "justify-center px-0" : ""
          } ${active ? "bg-[#3D9B9B] text-white dark:bg-[#2d7b7b]" : "dark:hover:bg-[#2d7b7b]"}`}
          onMouseEnter={() => setHoveredMenuId(item.id)}
          onMouseLeave={() => setHoveredMenuId(null)}
        >
          <span className={active ? "text-white" : "text-[#3D9B9B] group-hover:text-white dark:text-[#4fb3b3] dark:group-hover:text-white"}>
            {item.icon}
          </span>
          {collapsed && (
            <span className={`${tooltipClassName} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
              Appearance
            </span>
          )}
          {!collapsed && (
            <p className={`${active ? "text-white" : "group-hover:text-white dark:text-gray-200"} text-sm md:text-base lg:text-lg font-medium whitespace-nowrap`}>
              Appearance
            </p>
          )}
        </Button>
      );
    }

    return (
      <div key={item.id} className="relative mb-2 flex items-center gap-1">
        <Link
          to={item.path}
          onClick={() => handleLinkClick(item.id)}
          className="flex-1"
        >
          <Button
            variant={active ? "primary" : "secondaryPro"}
            className={`group flex items-center hover:text-white hover:bg-[#3D9B9B] gap-4 w-full rounded-2xl ${
              active ? "bg-[#3D9B9B] text-white dark:bg-[#2d7b7b]" : "dark:hover:bg-[#2d7b7b]"
            } ${collapsed ? "justify-center px-0 relative" : ""}`}
            onMouseEnter={() => setHoveredMenuId(item.id)}
            onMouseLeave={() => setHoveredMenuId(null)}
          >
            <span className={active ? "text-white" : "text-[#3D9B9B] group-hover:text-white dark:text-[#4fb3b3] dark:group-hover:text-white"}>
              {item.icon}
            </span>
            {collapsed && (
              <span className={`${tooltipClassName} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                {item.label}
              </span>
            )}
            {!collapsed && (
              <p className={`${active ? "text-white" : "group-hover:text-white dark:text-gray-200"} text-sm md:text-base lg:text-lg font-medium whitespace-nowrap`}>
                {item.label}
              </p>
            )}
          </Button>
        </Link>
      </div>
    );
  };

  // ── Mobile FAB ────────────────────────────────────────────────────────────
  if (isMobile && !isOpen) {
    return (
      <>
        <div
          className="fixed left-0 top-14 bottom-0 w-5 z-40 md:hidden"
          onTouchStart={(e) => startSidebarDrag(e.touches[0].clientX)}
          onTouchEnd={(e) => finishSidebarDrag(e.changedTouches[0].clientX)}
          onMouseDown={(e) => startSidebarDrag(e.clientX)}
          onMouseUp={(e) => finishSidebarDrag(e.clientX)}
        />
        <div
          ref={fabRef}
          className="fixed z-50 cursor-move touch-none"
          style={{ left: `${fabPosition.x}px`, top: `${fabPosition.y}px`, transition: isDragging ? "none" : "all 0.3s ease" }}
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

  // ── Mobile sidebar ────────────────────────────────────────────────────────
  if (isMobile && isOpen) {
    return (
      <>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => onToggle(false)} />
        <div className={`fixed left-0 top-0 h-full w-64 bg-[#f2f5f7] dark:bg-gray-800 shadow-xl rounded-2xl z-50 p-4 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div
            className="absolute right-0 top-0 h-full w-5 cursor-ew-resize"
            onTouchStart={(e) => startSidebarDrag(e.touches[0].clientX)}
            onTouchEnd={(e) => finishSidebarDrag(e.changedTouches[0].clientX)}
            onMouseDown={(e) => startSidebarDrag(e.clientX)}
            onMouseUp={(e) => finishSidebarDrag(e.clientX)}
          />
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => onToggle(false)} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <PanelRightOpen className="text-sm text-[#3D9B9B] dark:text-[#4fb3b3]" />
            </button>
            <button onClick={handleHomeClick} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <FiHome className="text-2xl text-[#3D9B9B] hover:text-[#2d7b7b] dark:text-[#4fb3b3]" />
            </button>
          </div>

          <div className="mt-2">
            {menuItems.map((item) => renderMenuItem(item, false))}
          </div>

          <ToolsDropdown
            isCollapsed={false}
            isOpen={showToolsDropdown}
            onToggle={() => setShowToolsDropdown((prev) => !prev)}
            pathname={location.pathname}
            onToolNavigate={handleToolNavigate}
            onCalendarClick={handleCalendarToolClick}
            isCalendarPopupOpen={showCalendarPopup}
            isSoundPanelOpen={showRingtonePanel}
            activeToolId={activeToolId}
            hoveredToolId={hoveredToolId}
            onToolHover={setHoveredToolId}
            onToolLeave={() => setHoveredToolId(null)}
            onToolActivate={setActiveToolId}
            onSoundClick={handleSoundToolClick}
          />

          <div className="mb-4 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">Dark Mode</span>
            <button onClick={toggleDarkMode} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? "bg-[#3D9B9B]" : "bg-gray-400"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        <ThemeModal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />
        <CalendarPopup isOpen={showCalendarPopup} onClose={() => setShowCalendarPopup(false)} reminders={reminders} onOpenCalendarPage={handleOpenCalendarPage} />
        <RingtoneQuickPanel
          isOpen={showRingtonePanel}
          onClose={() => setShowRingtonePanel(false)}
          isMobile
          isCollapsed={false}
        />
      </>
    );
  }

  // ── Desktop sidebar ───────────────────────────────────────────────────────
  return (
    <>
      <div className={`${isCollapsed ? "w-20" : "w-64"} h-[calc(100vh-3.5rem)] bg-[#f2f5f7] dark:bg-gray-800 p-4 transition-all duration-300 fixed left-0 top-14 z-30`}>
        <div
          className={`absolute top-0 h-full cursor-ew-resize ${isCollapsed ? "-right-2 w-4" : "right-0 w-4"}`}
          onTouchStart={(e) => startSidebarDrag(e.touches[0].clientX)}
          onTouchEnd={(e) => finishSidebarDrag(e.changedTouches[0].clientX)}
          onMouseDown={(e) => startSidebarDrag(e.clientX)}
          onMouseUp={(e) => finishSidebarDrag(e.clientX)}
        />

        <div className={`${isCollapsed ? "flex flex-wrap justify-center gap-2" : "flex items-center justify-between"} mb-4`}>
          {!isCollapsed && (
            <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <PanelRightOpen className="text-sm text-[#3D9B9B] dark:text-[#4fb3b3]" />
            </button>
          )}
          {isCollapsed && (
            <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <PanelLeftOpen className="text-sm text-[#3D9B9B] dark:text-[#4fb3b3]" />
            </button>
          )}
          <button onClick={handleHomeClick} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 relative group">
            <FiHome className="text-2xl text-[#3D9B9B] group-hover:text-[#2d7b7b] dark:text-[#4fb3b3]" />
            {isCollapsed && (
              <span className={`${tooltipClassName} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                Home
              </span>
            )}
          </button>
        </div>

        <div className="mt-2">
          {menuItems.map((item) => renderMenuItem(item, isCollapsed))}
        </div>

        {!isCollapsed && (
          <ToolsDropdown
            isCollapsed={false}
            isOpen={showToolsDropdown}
            onToggle={() => setShowToolsDropdown((prev) => !prev)}
            pathname={location.pathname}
            onToolNavigate={handleToolNavigate}
            onCalendarClick={handleCalendarToolClick}
            isCalendarPopupOpen={showCalendarPopup}
            isSoundPanelOpen={showRingtonePanel}
            activeToolId={activeToolId}
            hoveredToolId={hoveredToolId}
            onToolHover={setHoveredToolId}
            onToolLeave={() => setHoveredToolId(null)}
            onToolActivate={setActiveToolId}
            onSoundClick={handleSoundToolClick}
          />
        )}

        {isCollapsed && (
          <div className="flex flex-col items-center gap-2 mb-4">
            {SIDEBAR_TOOLS.map((tool) => {
              const ToolIcon = tool.icon;
              const isActiveTool =
                hoveredToolId === tool.id ||
                activeToolId === tool.id ||
                (tool.path && location.pathname === tool.path) ||
                (tool.id === "lists" && showCalendarPopup) ||
                (tool.id === "sounds" && showRingtonePanel);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onMouseEnter={() => setHoveredToolId(tool.id)}
                  onMouseLeave={() => setHoveredToolId(null)}
                  onClick={() => {
                    setActiveToolId(tool.id);
                    if (tool.type === "calendar") handleCalendarToolClick();
                    else if (tool.type === "sound") handleSoundToolClick();
                    else handleToolNavigate(tool.path);
                  }}
                  className={`group relative p-2 rounded-lg transition-colors ${isActiveTool ? "bg-[#3D9B9B]" : "hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  <ToolIcon size={20} className={isActiveTool ? "text-white" : "text-[#3D9B9B] dark:text-[#4fb3b3]"} />
                  <span className={`${tooltipClassName} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                    {tool.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {!isCollapsed && (
          <div className="mb-4 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">Dark Mode</span>
            <button onClick={toggleDarkMode} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? "bg-[#3D9B9B]" : "bg-gray-400"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        )}

        {isCollapsed && (
          <div className="flex justify-center mb-4">
            <button onClick={toggleDarkMode} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? "bg-[#3D9B9B]" : "bg-gray-400"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        )}
      </div>

      <ThemeModal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />
      <CalendarPopup isOpen={showCalendarPopup} onClose={() => setShowCalendarPopup(false)} reminders={reminders} onOpenCalendarPage={handleOpenCalendarPage} />

      {/* Ringtone quick panel — sits outside the sidebar div so it overlays content */}
      <RingtoneQuickPanel
        isOpen={showRingtonePanel}
        onClose={() => setShowRingtonePanel(false)}
        isMobile={false}
        isCollapsed={isCollapsed}
      />
    </>
  );
};

export default Sidebar;
