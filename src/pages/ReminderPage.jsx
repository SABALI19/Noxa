// src/pages/ReminderPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiBell, FiCalendar, FiClock, FiCheckCircle, 
  FiAlertCircle, FiFilter, FiX, FiArrowLeft,
  FiChevronRight, FiRepeat, FiMail, FiSmartphone, 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiSave, FiXCircle,
  FiBarChart2, FiZap
} from 'react-icons/fi';
import Button from '../components/Button';
import { useNotificationTracking } from '../hooks/useNotificationTracking';
import TaskTrackingDetail from '../components/tracking/TaskTrackingDetail';

const ReminderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { trackSnooze, trackView, trackCompletion, getNotificationStats } = useNotificationTracking();
  
  // State for viewing tracking details
  const [showTrackingDetail, setShowTrackingDetail] = useState(false);
  const [selectedTaskTracking, setSelectedTaskTracking] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Determine where to go back to based on referrer or default to dashboard
  const getBackDestination = () => {
    if (location.state?.from) {
      return location.state.from;
    }
    return -1;
  };

  // Enhanced reminders data with tracking integration
  const [reminders, setReminders] = useState([
    {
      id: 1,
      taskId: 1,
      title: 'Review quarterly budget report',
      dueDate: '2024-01-20T20:00:00',
      reminderTime: '2024-01-20T18:00:00',
      status: 'upcoming',
      category: 'work',
      priority: 'high',
      frequency: 'once',
      notificationMethod: 'app',
      taskCompleted: false,
      note: 'Reminder: 2 hours before due time'
    },
    {
      id: 2,
      taskId: 2,
      title: 'Prepare presentation slides',
      dueDate: '2024-01-22T17:30:00',
      reminderTime: '2024-01-21T17:30:00',
      status: 'upcoming',
      category: 'work',
      priority: 'medium',
      frequency: 'once',
      notificationMethod: 'both',
      taskCompleted: false,
      note: 'Daily reminder until completed'
    },
    {
      id: 3,
      taskId: 3,
      title: 'Schedule dentist appointment',
      dueDate: '2024-01-23T10:00:00',
      reminderTime: '2024-01-22T10:00:00',
      status: 'today',
      category: 'personal',
      priority: 'low',
      frequency: 'daily',
      notificationMethod: 'email',
      taskCompleted: false,
      note: 'Reminder set for 1 day before'
    },
    {
      id: 4,
      taskId: 4,
      title: 'Morning workout routine',
      dueDate: '2024-01-22T08:00:00',
      reminderTime: '2024-01-22T07:30:00',
      status: 'completed',
      category: 'health',
      priority: 'medium',
      frequency: 'daily',
      notificationMethod: 'app',
      taskCompleted: true,
      note: 'Completed task - reminder dismissed'
    },
    {
      id: 5,
      taskId: 5,
      title: 'Buy groceries for the week',
      dueDate: '2024-01-26T21:00:00',
      reminderTime: '2024-01-25T21:00:00',
      status: 'upcoming',
      category: 'personal',
      priority: 'low',
      frequency: 'multiple',
      notificationMethod: 'both',
      taskCompleted: false,
      note: 'Multiple reminders set'
    }
  ]);

  const [filter, setFilter] = useState('all');
  const [activeReminder, setActiveReminder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingReminder, setEditingReminder] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Calculate stats
  const stats = {
    total: reminders.length,
    today: reminders.filter(r => r.status === 'today').length,
    upcoming: reminders.filter(r => r.status === 'upcoming').length,
    completed: reminders.filter(r => r.status === 'completed').length,
    missed: reminders.filter(r => r.status === 'missed').length
  };

  // Filter reminders based on selected filter and search query
  const filteredReminders = reminders.filter(reminder => {
    // Apply status filter
    if (filter === 'all') {
      // For 'all', show everything except completed unless specifically filtered
    } else if (filter === 'today') {
      if (reminder.status !== 'today') return false;
    } else if (filter === 'upcoming') {
      if (reminder.status !== 'upcoming') return false;
    } else if (filter === 'completed') {
      if (reminder.status !== 'completed') return false;
    } else if (filter === 'missed') {
      if (reminder.status !== 'missed') return false;
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        reminder.title.toLowerCase().includes(query) ||
        reminder.note?.toLowerCase().includes(query) ||
        reminder.category.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Sort reminders by reminder time (soonest first)
  const sortedReminders = [...filteredReminders].sort((a, b) => 
    new Date(a.reminderTime) - new Date(b.reminderTime)
  );

  // Format date for display
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const reminderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (reminderDate.getTime() === today.getTime()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (reminderDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Format relative time (e.g., "in 2 hours", "1 day ago")
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMs < 0) {
      const absHours = Math.abs(diffHours);
      const absDays = Math.abs(diffDays);
      if (absHours < 24) return `${absHours} hour${absHours !== 1 ? 's' : ''} ago`;
      return `${absDays} day${absDays !== 1 ? 's' : ''} ago`;
    }
    
    if (diffHours < 24) return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'today': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'missed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  // Get notification method icon
  const getNotificationIcon = (method) => {
    switch (method) {
      case 'app': return <FiSmartphone className="w-4 h-4 text-blue-500" />;
      case 'email': return <FiMail className="w-4 h-4 text-purple-500" />;
      case 'both': return (
        <div className="flex gap-1">
          <FiSmartphone className="w-3 h-3 text-blue-500" />
          <FiMail className="w-3 h-3 text-purple-500" />
        </div>
      );
      default: return <FiBell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Handle reminder click with tracking
  const handleReminderClick = (reminder) => {
    setActiveReminder(reminder);
    setEditingReminder(null);
    
    // Track view of the reminder's task
    trackView(reminder.taskId, 'task');
  };

  // Handle edit click
  const handleEditClick = (reminder, e) => {
    e.stopPropagation();
    setEditingReminder(reminder);
    setEditForm({
      title: reminder.title,
      description: reminder.note || '',
      dueDate: reminder.dueDate.split('T')[0],
      reminderTime: reminder.reminderTime.split('T')[0],
      priority: reminder.priority,
      category: reminder.category,
      frequency: reminder.frequency,
      notificationMethod: reminder.notificationMethod,
      status: reminder.status
    });
  };

  // Handle save edit
  const handleSaveEdit = (reminderId, e) => {
    e?.stopPropagation();
    if (!editingReminder) return;
    
    setReminders(prev => prev.map(r => 
      r.id === reminderId 
        ? { 
            ...r, 
            title: editForm.title,
            note: editForm.description,
            dueDate: `${editForm.dueDate}T${new Date(r.dueDate).toTimeString().split('T')[0] || '12:00:00'}`,
            reminderTime: `${editForm.reminderTime}T${new Date(r.reminderTime).toTimeString().split('T')[0] || '12:00:00'}`,
            priority: editForm.priority,
            category: editForm.category,
            frequency: editForm.frequency,
            notificationMethod: editForm.notificationMethod,
            status: editForm.status
          }
        : r
    ));
    
    setEditingReminder(null);
    setEditForm({});
    
    if (activeReminder?.id === reminderId) {
      setActiveReminder(prev => ({
        ...prev,
        title: editForm.title,
        note: editForm.description,
        priority: editForm.priority,
        category: editForm.category,
        frequency: editForm.frequency,
        notificationMethod: editForm.notificationMethod,
        status: editForm.status
      }));
    }
  };

  // Handle cancel edit
  const handleCancelEdit = (e) => {
    e?.stopPropagation();
    setEditingReminder(null);
    setEditForm({});
  };

  // Handle snooze with tracking
  const handleSnooze = (reminderId, e) => {
    e?.stopPropagation();
    const reminder = reminders.find(r => r.id === reminderId);
    
    setReminders(prev => prev.map(r => 
      r.id === reminderId 
        ? { 
            ...r, 
            reminderTime: new Date(new Date().getTime() + 30 * 60000).toISOString(),
            status: 'upcoming'
          }
        : r
    ));
    
    if (activeReminder?.id === reminderId) {
      setActiveReminder(prev => ({
        ...prev,
        reminderTime: new Date(new Date().getTime() + 30 * 60000).toISOString(),
        status: 'upcoming'
      }));
    }
    
    // Track snooze
    if (reminder) {
      trackSnooze(reminder.taskId, 'task', 30);
    }
  };

  // Handle dismiss
  const handleDismiss = (reminderId, e) => {
    e?.stopPropagation();
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    
    if (activeReminder?.id === reminderId) {
      setActiveReminder(null);
    }
  };

  // Clear all completed
  const handleClearCompleted = () => {
    setReminders(prev => prev.filter(r => r.status !== 'completed'));
    if (activeReminder?.status === 'completed') {
      setActiveReminder(null);
    }
  };

  // Handle create task with reminders
  const handleCreateTaskWithReminders = () => {
    navigate('/tasks');
  };

  // Toggle reminder status
  const handleToggleReminder = (reminderId, e) => {
    e?.stopPropagation();
    const reminder = reminders.find(r => r.id === reminderId);
    const isCompleting = reminders.find(r => r.id === reminderId)?.status !== 'completed';
    
    setReminders(prev => prev.map(r => 
      r.id === reminderId 
        ? { 
            ...r, 
            status: r.status === 'completed' ? 'upcoming' : 'completed',
            taskCompleted: r.status === 'completed' ? false : true
          }
        : r
    ));
    
    if (activeReminder?.id === reminderId) {
      setActiveReminder(prev => ({
        ...prev,
        status: prev.status === 'completed' ? 'upcoming' : 'completed',
        taskCompleted: prev.status === 'completed' ? false : true
      }));
    }
    
    // Track completion if completing
    if (isCompleting && reminder) {
      trackCompletion(reminder.taskId, 'task');
    }
  };

  // Handle view task tracking - Open tracking detail modal
  const handleViewTaskTracking = (reminder, e) => {
    e?.stopPropagation();
    
    // Create a task object for the tracking detail view
    const taskForTracking = {
      id: reminder.taskId,
      title: reminder.title,
      description: reminder.note,
      dueDate: reminder.dueDate,
      priority: reminder.priority,
      category: reminder.category,
      completed: reminder.taskCompleted,
      status: reminder.status
    };
    
    const trackingStats = getNotificationStats(reminder.taskId, 'task');
    
    setSelectedTask(taskForTracking);
    setSelectedTaskTracking(trackingStats);
    setShowTrackingDetail(true);
    
    // Track this view action
    trackView(reminder.taskId, 'task');
  };

  // Check for due reminders periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach(reminder => {
        if (reminder.status === 'upcoming' || reminder.status === 'today') {
          const reminderTime = new Date(reminder.reminderTime);
          // If reminder is within the next minute
          if (reminderTime > now && reminderTime - now < 60000) {
            // Update status to today
            setReminders(prev => prev.map(r => 
              r.id === reminder.id ? { ...r, status: 'today' } : r
            ));
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [reminders]);

  // Get tracking stats for active reminder
  const getActiveReminderTracking = () => {
    if (!activeReminder) return null;
    return getNotificationStats(activeReminder.taskId, 'task');
  };

  const activeReminderTracking = getActiveReminderTracking();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigate(getBackDestination())}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">
                {location.state?.from === '/tasks' ? 'Back to Tasks' : 'Back'}
              </span>
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-teal-100">
                <FiBell className="text-2xl text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Task Reminders
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Automated reminders with tracking analytics
                </p>
              </div>
            </div>
            
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateTaskWithReminders}
              className="flex items-center gap-2 px-4 py-3 mt-4 sm:mt-0 w-full sm:w-auto"
            >
              <FiPlus className="text-lg" />
              <span>Create Task with Reminders</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-400 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Reminders</p>
                <p className="text-2xl font-bold text-teal-600">{stats.total}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Due Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
              </div>
              <FiBell className="text-blue-500" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-400 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold text-purple-600">{stats.upcoming}</p>
              </div>
              <FiCalendar className="text-purple-500" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-yellow-400 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.completed}</p>
              </div>
              <FiCheckCircle className="text-yellow-500" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-green-400 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Tasks</p>
                <p className="text-2xl font-bold text-green-600">{stats.total - stats.completed}</p>
              </div>
              <FiAlertCircle className="text-green-500" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-red-400 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Missed</p>
                <p className="text-2xl font-bold text-red-600">{stats.missed}</p>
              </div>
              <FiAlertCircle className="text-red-500" />
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-[280px] w-full">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reminders..."
                  className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <FiFilter className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', 'today', 'upcoming', 'completed', 'missed'].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      filter === filterType
                        ? 'bg-teal-400 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    {filterType !== 'all' && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                        {stats[filterType]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Reminders List */}
          <div className="lg:col-span-2">
            {/* Reminders List */}
            <div className="overflow-hidden">
              {sortedReminders.length > 0 ? (
                <div>
                  {sortedReminders.map((reminder) => {
                    const trackingStats = getNotificationStats(reminder.taskId, 'task');
                    
                    return (
                      <div 
                        key={reminder.id}
                        className={`bg-white border border-gray-200 rounded-xl p-4 mb-4 hover:border-teal-400 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${
                          activeReminder?.id === reminder.id ? 'border-teal-400 shadow-md bg-teal-50/30' : ''
                        }`}
                        onClick={() => handleReminderClick(reminder)}
                      >
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            {/* Left side: Content */}
                            <div className="flex-1">
                              <div className="flex items-start gap-3 mb-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleReminder(reminder.id, e);
                                  }}
                                  className={`mt-1 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                    reminder.status === 'completed' 
                                      ? 'bg-green-500 border-green-500' 
                                      : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                                  }`}
                                >
                                  {reminder.status === 'completed' && (
                                    <FiCheckCircle className="text-white text-sm" />
                                  )}
                                </button>
                                
                                <div className="flex-1">
                                  {editingReminder?.id === reminder.id ? (
                                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                                        placeholder="Title"
                                      />
                                      <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                                        placeholder="Description"
                                        rows="2"
                                      />
                                      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                                        <select
                                          value={editForm.priority}
                                          onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent flex-1"
                                        >
                                          <option value="high">High</option>
                                          <option value="medium">Medium</option>
                                          <option value="low">Low</option>
                                        </select>
                                        <select
                                          value={editForm.status}
                                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent flex-1"
                                        >
                                          <option value="today">Today</option>
                                          <option value="upcoming">Upcoming</option>
                                          <option value="completed">Completed</option>
                                        </select>
                                      </div>
                                      <div className="flex flex-wrap justify-end gap-2">
                                        <button
                                          onClick={(e) => handleSaveEdit(reminder.id, e)}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-teal-400 hover:bg-teal-500 text-white text-sm rounded-lg transition-colors"
                                        >
                                          <FiSave className="w-3 h-3" /> Save
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-colors"
                                        >
                                          <FiXCircle className="w-3 h-3" /> Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                          <h3 className={`font-medium ${
                                            reminder.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                                          }`}>
                                            {reminder.title}
                                          </h3>
                                          <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(reminder.status)} self-start sm:self-auto`}>
                                            {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                                        {/* Time */}
                                        <div className="flex items-center gap-1.5">
                                          <FiClock className="text-gray-400" size={14} />
                                          <span>{formatDateTime(reminder.reminderTime)}</span>
                                          <span className="text-xs text-gray-500">({formatRelativeTime(reminder.reminderTime)})</span>
                                        </div>
                                        
                                        {/* Frequency */}
                                        {reminder.frequency !== 'once' && (
                                          <div className="flex items-center gap-1.5">
                                            <FiRepeat className="text-gray-400" size={14} />
                                            <span className="capitalize">{reminder.frequency}</span>
                                          </div>
                                        )}
                                        
                                        {/* Priority */}
                                        <div className="flex items-center gap-1.5">
                                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(reminder.priority)}`}></div>
                                          <span className="capitalize">{reminder.priority}</span>
                                        </div>
                                        
                                        {/* Notification Method */}
                                        <div className="flex items-center gap-1.5">
                                          {getNotificationIcon(reminder.notificationMethod)}
                                        </div>
                                        
                                        {/* Tracking Stats */}
                                        {trackingStats && trackingStats.totalNotifications > 0 && (
                                          <>
                                            <div className="flex items-center gap-1.5">
                                              <FiBell className="text-blue-400" size={14} />
                                              <span className="text-blue-600">
                                                {trackingStats.totalNotifications} notifs
                                              </span>
                                            </div>
                                            {trackingStats.snoozedCount > 0 && (
                                              <div className="flex items-center gap-1.5">
                                                <FiZap className="text-amber-400" size={14} />
                                                <span className="text-amber-600">
                                                  {trackingStats.snoozedCount} snoozes
                                                </span>
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                      
                                      <p className="text-sm text-gray-500 mt-2">{reminder.note}</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Right side: Actions */}
                            <div className="flex items-start gap-2 shrink-0 self-start">
                              {editingReminder?.id !== reminder.id && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  {/* View Tracking Button - Shows tracking details in modal */}
                                  <button
                                    onClick={(e) => handleViewTaskTracking(reminder, e)}
                                    className="px-3 py-1 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
                                  >
                                    <FiBarChart2 className="text-purple-600" size={14} />
                                    View Task
                                  </button>
                                  
                                  {reminder.status === 'today' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSnooze(reminder.id, e);
                                      }}
                                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                                    >
                                      Snooze
                                    </button>
                                  )}
                                  
                                  <div className="flex gap-1">
                                    <button
                                      onClick={(e) => handleEditClick(reminder, e)}
                                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                      <FiEdit2 className="text-lg" />
                                    </button>
                                    
                                    <button
                                      onClick={(e) => handleDismiss(reminder.id, e)}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <FiTrash2 className="text-lg" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                  <FiBell className="text-4xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reminders found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery 
                      ? `No reminders match "${searchQuery}"`
                      : filter === 'all' 
                        ? "You don't have any reminders set up yet. Create tasks with automated reminders to get started." 
                        : `No ${filter} reminders found.`}
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleCreateTaskWithReminders}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <FiPlus className="text-lg" />
                    Create Task with Reminders
                  </Button>
                </div>
              )}
            </div>
            
            {/* Clear Completed Button */}
            {stats.completed > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleClearCompleted}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear completed reminders
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Reminder Details & Info */}
          <div className="space-y-6">
            {/* Selected Reminder Details */}
            {activeReminder ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Reminder Details</h3>
                  <button
                    onClick={() => setActiveReminder(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiX className="text-lg" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg mb-2">{activeReminder.title}</h4>
                    <p className="text-gray-600">{activeReminder.note}</p>
                  </div>
                  
                  {/* Tracking Stats */}
                  {activeReminderTracking && activeReminderTracking.totalNotifications > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <FiBarChart2 className="text-blue-500" />
                        Task Tracking Stats
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Total Notifications</p>
                          <p className="text-xl font-bold text-blue-600">
                            {activeReminderTracking.totalNotifications || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Snoozes</p>
                          <p className="text-xl font-bold text-amber-600">
                            {activeReminderTracking.snoozedCount || 0}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Last Viewed</p>
                          <p className="text-sm font-medium text-gray-900">
                            {activeReminderTracking.viewedAt ? 
                              new Date(activeReminderTracking.viewedAt).toLocaleDateString() : 
                              'Never'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="text-sm font-medium text-gray-900">
                            {activeReminderTracking.completedAt ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTaskTracking(activeReminder, e);
                          }}
                          className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <FiBarChart2 size={14} />
                          View Full Tracking Details
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Due Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(activeReminder.dueDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Reminder Time</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(activeReminder.reminderTime)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Priority</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(activeReminder.priority)}`}></div>
                        <span className="font-medium text-gray-900 capitalize">
                          {activeReminder.priority} Priority
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Category</p>
                      <span className="font-medium text-gray-900 capitalize">
                        {activeReminder.category}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Frequency</p>
                    <div className="flex items-center gap-2">
                      <FiRepeat className="text-gray-400" />
                      <span className="font-medium text-gray-900 capitalize">
                        {activeReminder.frequency === 'once' ? 'One-time reminder' : `${activeReminder.frequency} reminders`}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Notification Method</p>
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(activeReminder.notificationMethod)}
                      <span className="font-medium text-gray-900">
                        {activeReminder.notificationMethod === 'app' && 'App Notification'}
                        {activeReminder.notificationMethod === 'email' && 'Email'}
                        {activeReminder.notificationMethod === 'both' && 'App & Email'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="primary"
                        onClick={() => handleToggleReminder(activeReminder.id)}
                        className="flex-1"
                      >
                        {activeReminder.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                      </Button>
                      {activeReminder.status === 'today' && (
                        <Button
                          variant="outline"
                          onClick={() => handleSnooze(activeReminder.id)}
                          className="flex-1"
                        >
                          Snooze 30min
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-center p-4">
                  <FiBell className="text-3xl text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reminder selected</h3>
                  <p className="text-gray-600 mb-4">
                    Click on a reminder from the list to view its details here
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/tasks')}
                  className="w-full flex items-center justify-between p-3 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg group-hover:scale-110 transition-transform">
                      <FiPlus className="text-teal-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Create New Task</p>
                      <p className="text-sm text-gray-600">Add a new task with reminders</p>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-400" />
                </button>
                
                <button
                  onClick={() => navigate('/tasks')}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                      <FiBell className="text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Manage Tasks</p>
                      <p className="text-sm text-gray-600">View and edit all your tasks</p>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-400" />
                </button>
                
                <button
                  onClick={() => navigate('/analytics')}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:scale-110 transition-transform">
                      <FiBarChart2 className="text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">View Analytics</p>
                      <p className="text-sm text-gray-600">See tracking statistics</p>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Reminder Settings */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive app notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-400"></div>
                  </label>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive email reminders</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-400"></div>
                  </label>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">Track Views</p>
                    <p className="text-sm text-gray-500">Monitor when users view tasks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-400/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-400"></div>
                  </label>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">Default Snooze Time</p>
                    <p className="text-sm text-gray-500">When you snooze a reminder</p>
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none w-full sm:w-auto">
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="1440">1 day</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How Automated Reminders Work Section - ADDED HERE */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Automated Reminders Work</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#3D9B9B] text-white flex items-center justify-center text-sm font-medium">
                1
              </div>
              <p className="text-sm text-gray-600">
                Create tasks with "Automate Reminders" enabled in the Task Manager
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#3D9B9B] text-white flex items-center justify-center text-sm font-medium">
                2
              </div>
              <p className="text-sm text-gray-600">
                Reminders will appear here based on your frequency and timing settings
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#3D9B9B] text-white flex items-center justify-center text-sm font-medium">
                3
              </div>
              <p className="text-sm text-gray-600">
                Manage reminders: snooze, complete, or view the associated task
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Back Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-center">
            <button 
              onClick={() => navigate(getBackDestination())}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">
                {location.state?.from === '/tasks' ? 'Back to Tasks' : 'Back to Dashboard'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tracking Detail Modal */}
      {showTrackingDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TaskTrackingDetail
              task={selectedTask}
              trackingData={selectedTaskTracking}
              onClose={() => {
                setShowTrackingDetail(false);
                setSelectedTask(null);
                setSelectedTaskTracking(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderPage;