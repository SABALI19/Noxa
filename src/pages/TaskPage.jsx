// src/pages/TaskPage.jsx - UPDATED BACK BUTTON
import { Grid3x3, List } from 'lucide-react';
import React, { useState } from 'react';
import { 
  FiPlus,
  FiCheckSquare,
  FiClock,
  FiAlertCircle,
  FiEdit,
  FiTrash2,
  FiArrowLeft,
  FiCheckCircle,
  FiBarChart2
} from "react-icons/fi";
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import TaskFormModal from '../forms/TaskFormModal.jsx';
import { useNotifications } from '../hooks/useNotifications.jsx';
import { useNotificationTracking } from '../hooks/useNotificationTracking.jsx';
import TaskTrackingDetail from '../components/tracking/TaskTrackingDetail';
import { useTasks } from '../context/TaskContext.jsx';

const TaskPage = () => {
  const navigate = useNavigate();
  const { addTaskNotification } = useNotifications();
  const { trackView, trackCompletion, getNotificationStats } = useNotificationTracking();
  
  // Get tasks and operations from context - including filtered tasks
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask,
    getTaskStats,
    getFilteredTasks,
    filters,
    resetFilters
  } = useTasks(); // Removed unused updateFilters
  
  // Use filtered tasks from context instead of calculating locally
  const filteredTasks = getFilteredTasks();
  
  // State for modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showTrackingDetail, setShowTrackingDetail] = useState(false);
  const [selectedTaskTracking, setSelectedTaskTracking] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);
  
  const [displayMode, setDisplayMode] = useState('list'); // 'list' or 'grid'
  const [expandedSections, setExpandedSections] = useState({
    pending: true,
    completed: true,
    overdue: true,
    in_progress: true
  });

  // Calculate task statistics from filtered tasks
  const now = new Date();
  const isTaskOverdue = (t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return !t.completed && d < now;
  };

  // Get stats from all tasks (not filtered)
  const stats = getTaskStats();
  const pending = stats.pending;
  const completed = stats.completed;
  const overdue = stats.overdue;
  const inProgress = stats.inProgress;

  // Get stats from filtered tasks
  const filteredOverdueTasks = filteredTasks.filter(t => isTaskOverdue(t));
  const filteredCompletedTasks = filteredTasks.filter(t => t.completed);
  const filteredPendingTasks = filteredTasks.filter(t => !t.completed && !isTaskOverdue(t));
  const filteredInProgressTasks = filteredTasks.filter(t => t.status === 'in_progress' && !t.completed);

  // Check if there are any filtered tasks to display
  const hasFilteredTasks = filteredTasks.length > 0;

  // Sort filtered tasks for display
  const sortTaskList = (taskList) => {
    return [...taskList].sort((a, b) => {
      if (filters.sortBy === 'dueDate') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (filters.sortBy === 'priority') {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (filters.sortBy === 'category') {
        return a.category.localeCompare(b.category);
      }
      if (filters.sortBy === 'created') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });
  };

  const sortedPending = sortTaskList(filteredPendingTasks);
  const sortedCompleted = sortTaskList(filteredCompletedTasks);
  const sortedOverdue = sortTaskList(filteredOverdueTasks);
  const sortedInProgress = sortTaskList(filteredInProgressTasks);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (taskDate.getTime() === today.getTime()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (taskDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date < now && !date.toDateString().includes(now.toDateString())) {
      return `Overdue: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Helper function for notification click
  const handleTaskNotificationClick = (taskId) => {
    const taskElement = document.getElementById(`task-${taskId}`);
    if (taskElement) {
      taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add temporary highlight
      taskElement.classList.add('bg-yellow-50');
      setTimeout(() => {
        taskElement.classList.remove('bg-yellow-50');
      }, 2000);
    }
  };

  const toggleTaskCompletion = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const wasCompleted = task.completed;
    const updatedTask = { 
      ...task, 
      completed: !task.completed,
      status: !task.completed ? 'completed' : 'pending'
    };
    
    // Update task in context
    updateTask(taskId, updatedTask);
    
    // Add notification using context
    if (!wasCompleted) {
      addTaskNotification('task_completed', updatedTask, () => 
        handleTaskNotificationClick(taskId)
      );
      // Track completion
      trackCompletion(taskId, 'task');
    } else {
      addTaskNotification('task_updated', updatedTask, () => 
        handleTaskNotificationClick(taskId)
      );
    }
  };

  const deleteTaskFromContext = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const taskToDelete = tasks.find(t => t.id === taskId);
      deleteTask(taskId);
      
      // Add notification for task deletion
      if (taskToDelete) {
        addTaskNotification('task_deleted', taskToDelete);
      }
    }
  };

  // Function to update task status (in progress, pending, etc.)
  const updateTaskStatus = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const oldStatus = task.status;
    const updatedTask = { ...task, status: newStatus };
    
    // Update in context
    updateTask(taskId, { status: newStatus });
    
    // Add notification for status change to in_progress
    if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
      addTaskNotification('task_in_progress', updatedTask, () => 
        handleTaskNotificationClick(taskId)
      );
    } else if (newStatus !== oldStatus) {
      addTaskNotification('task_updated', updatedTask, () => 
        handleTaskNotificationClick(taskId)
      );
    }
  };

  // Function to create a new task
  const handleCreateTask = (newTaskData) => {
    const newTask = addTask({
      ...newTaskData,
      status: 'pending',
      overdue: false
    });
    
    // Add notification for task creation
    addTaskNotification('task_created', newTask, () => 
      handleTaskNotificationClick(newTask.id)
    );
  };

  // Function to update an existing task
  const handleUpdateTask = (updatedTaskData) => {
    if (!taskToEdit) return;
    
    // Preserve the task ID and other essential properties
    const finalUpdatedTask = {
      ...updatedTaskData,
      id: taskToEdit.id,
      // Preserve completion status unless explicitly changed in form
      completed: taskToEdit.completed,
      // Use status from form if provided, otherwise keep existing
      status: updatedTaskData.status || taskToEdit.status
    };
    
    // Update task in context
    updateTask(taskToEdit.id, finalUpdatedTask);
    
    // Add notification for task update
    addTaskNotification('task_updated', finalUpdatedTask, () => 
      handleTaskNotificationClick(taskToEdit.id)
    );
    
    // Close edit modal
    closeEditTaskModal();
  };

  // Modal control functions
  const openCreateTaskModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateTaskModal = () => {
    setIsCreateModalOpen(false);
  };

  const openEditTaskModal = (task) => {
    setTaskToEdit(task);
    setIsEditModalOpen(true);
  };

  const closeEditTaskModal = () => {
    setIsEditModalOpen(false);
    setTaskToEdit(null);
  };

  // Handle view tracking
  const handleViewTracking = (task, e) => {
    e?.stopPropagation();
    setSelectedTask(task);
    setSelectedTaskTracking(getNotificationStats(task.id, 'task'));
    setShowTrackingDetail(true);
    // Track view
    trackView(task.id, 'task');
  };

  // Handle reset filters
  const handleResetFilters = () => {
    resetFilters();
  };

  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === 'list' ? 'grid' : 'list');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'health': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get border color based on category
  const getCategoryBorderColor = (category) => {
    switch (category) {
      case 'work': return 'border-l-blue-500';
      case 'personal': return 'border-l-purple-500';
      case 'health': return 'border-l-green-500';
      default: return 'border-l-gray-400';
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Task Item Component for List View with Category Border
  const TaskItem = ({ task }) => (
    <div 
      id={`task-${task.id}`}
      className={`p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 border-l-4 ${getCategoryBorderColor(task.category)}`}
    >
      <div className="flex items-start">
        {/* Checkbox */}
        <button
          onClick={() => toggleTaskCompletion(task.id)}
          className={`mt-1 shrink-0 w-5 h-5 rounded border flex items-center justify-center mr-4 ${
            task.completed 
              ? 'bg-green-500 border-green-500' 
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {task.completed && (
            <FiCheckSquare className="text-white text-sm" />
          )}
        </button>

        {/* Task Content */}
        <div className="grow">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  {task.title}
                </h3>
                {/* Status Badge */}
                {task.status && (
                  <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {/* Date */}
                <div className={`flex items-center gap-1.5 text-sm ${
                  isTaskOverdue(task) ? 'text-red-600' :
                  task.completed ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {task.completed ? (
                    <FiCheckCircle className="text-green-600" />
                  ) : isTaskOverdue(task) ? (
                    <FiAlertCircle className="text-red-600" />
                  ) : (
                    <FiClock className="text-gray-400" />
                  )}
                  <span>{formatDate(task.dueDate)}</span>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                  <span className="text-sm text-gray-600 capitalize">{task.priority} Priority</span>
                </div>

                {/* Category */}
                <span className={`text-xs px-2.5 py-1 rounded-full ${getCategoryColor(task.category)}`}>
                  {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              {/* Tracking Button */}
              <button
                onClick={(e) => handleViewTracking(task, e)}
                className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50"
                title="View tracking"
              >
                <FiBarChart2 className="text-lg" />
              </button>
              
              {task.status !== 'in_progress' && !task.completed && (
                <button 
                  onClick={() => updateTaskStatus(task.id, 'in_progress')}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                  title="Mark as in progress"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
              {/* Edit Button - Now Functional */}
              <button 
                onClick={() => openEditTaskModal(task)}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                title="Edit task"
              >
                <FiEdit className="text-lg" />
              </button>
              <button 
                onClick={() => deleteTaskFromContext(task.id)}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
              >
                <FiTrash2 className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Task Card Component for Grid View with Category Border
  const TaskCard = ({ task }) => (
    <div 
      id={`task-${task.id}`}
      className={`bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200 border-l-4 ${getCategoryBorderColor(task.category)}`}
    >
      <div className="flex justify-between items-start mb-3">
        <button
          onClick={() => toggleTaskCompletion(task.id)}
          className={`shrink-0 w-2 h-2 rounded border flex items-center justify-center ${
            task.completed 
              ? 'bg-green-500 border-green-500' 
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {task.completed && (
            <FiCheckSquare className="text-white text-xs" />
          )}
        </button>
        <div className="flex gap-2">
          {/* Tracking Button */}
          <button
            onClick={(e) => handleViewTracking(task, e)}
            className="p-1 text-gray-400 hover:text-purple-600 rounded hover:bg-purple-100"
            title="View tracking"
          >
            <FiBarChart2 className="text-sm" />
          </button>
          
          {task.status !== 'in_progress' && !task.completed && (
            <button 
              onClick={() => updateTaskStatus(task.id, 'in_progress')}
              className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-100"
              title="Mark as in progress"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          {/* Edit Button - Now Functional */}
          <button 
            onClick={() => openEditTaskModal(task)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-100"
            title="Edit task"
          >
            <FiEdit className="text-sm" />
          </button>
          <button 
            onClick={() => deleteTaskFromContext(task.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-100"
          >
            <FiTrash2 className="text-sm" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <h3 className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
          {task.title}
        </h3>
        {task.status && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {/* Date */}
        <div className={`flex items-center gap-1.5 text-sm ${
          isTaskOverdue(task) ? 'text-red-600' :
          task.completed ? 'text-green-600' : 'text-gray-600'
        }`}>
          {task.completed ? (
            <FiCheckCircle className="text-green-600" size={14} />
          ) : isTaskOverdue(task) ? (
            <FiAlertCircle className="text-red-600" size={14} />
          ) : (
            <FiClock className="text-gray-400" size={14} />
          )}
          <span className="truncate">{formatDate(task.dueDate)}</span>
        </div>

        <div className="flex items-center justify-between">
          {/* Priority */}
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
            <span className="text-xs text-gray-600 capitalize">{task.priority}</span>
          </div>

          {/* Category */}
          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(task.category)}`}>
            {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button - UPDATED TO MATCH GOALS FORM */}
        <div className="mb-8">
          {/* Back Button - MATCHING GOALS FORM STYLING */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-300">Task Manager</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Stay organized and productive with your tasks</p>
              </div>
              <Button
                variant="icon"
                size="xs"
                onClick={toggleDisplayMode}
                className="mt-1"
              >
                {displayMode === 'list' ? (
                  <Grid3x3 className="text-lg" size={20} />
                ) : (
                  <List className="text-lg" size={20} />
                )}
              </Button>
            </div>
            
            {/* Create Task Button - Responsive */}
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateTaskModal}
              className="flex items-center justify-center rounded-xl sm:rounded-2xl gap-1 sm:gap-2 w-full sm:w-auto"
            >
              <FiPlus className="text-base sm:text-lg" />
              <span className="hidden xs:inline">Create New Task</span>
              <span className="xs:hidden">New Task</span>
            </Button>
          </div>
        </div>

        {/* Task Stats - UPDATED WITH DARK MODE */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{pending}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-500">{inProgress}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-500">{completed}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-500">{overdue}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
          </div>
        </div>

        {/* Show content based on whether there are filtered tasks or not */}
        {hasFilteredTasks ? (
          <div className="space-y-6">
            {/* In Progress Tasks Section - UPDATED WITH DARK MODE */}
            {sortedInProgress.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div 
                  className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 cursor-pointer"
                  onClick={() => toggleSection('in_progress')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300">In Progress</h2>
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                        {sortedInProgress.length} tasks
                      </span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {expandedSections.in_progress ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                
                {expandedSections.in_progress && (
                  <div>
                    {displayMode === 'list' ? (
                      <div>
                        {sortedInProgress.map(task => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedInProgress.map(task => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Overdue Tasks Section - UPDATED WITH DARK MODE */}
            {sortedOverdue.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div 
                  className="p-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 cursor-pointer"
                  onClick={() => toggleSection('overdue')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiAlertCircle className="text-red-600 dark:text-red-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Overdue Tasks</h2>
                      <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                        {sortedOverdue.length} tasks
                      </span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {expandedSections.overdue ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                
                {expandedSections.overdue && (
                  <div>
                    {displayMode === 'list' ? (
                      <div>
                        {sortedOverdue.map(task => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedOverdue.map(task => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pending Tasks Section - UPDATED WITH DARK MODE */}
            {sortedPending.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div 
                  className="p-4 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20 cursor-pointer"
                  onClick={() => toggleSection('pending')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiClock className="text-yellow-600 dark:text-yellow-500" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Pending Tasks</h2>
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">
                        {sortedPending.length} tasks
                      </span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {expandedSections.pending ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                
                {expandedSections.pending && (
                  <div>
                    {displayMode === 'list' ? (
                      <div>
                        {sortedPending.map(task => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedPending.map(task => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Completed Tasks Section - UPDATED WITH DARK MODE */}
            {sortedCompleted.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div 
                  className="p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20 cursor-pointer"
                  onClick={() => toggleSection('completed')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiCheckCircle className="text-green-600 dark:text-green-500" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300">Completed Tasks</h2>
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                        {sortedCompleted.length} tasks
                      </span>
                    </div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {expandedSections.completed ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                
                {expandedSections.completed && (
                  <div>
                    {displayMode === 'list' ? (
                      <div>
                        {sortedCompleted.map(task => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedCompleted.map(task => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty State for filtered results - UPDATED WITH DARK MODE */
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-6">
              <FiAlertCircle className="w-24 h-24 text-gray-300 dark:text-gray-600" />
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-300 mb-3">
              {tasks.length === 0 ? 'No tasks found' : 'No matching tasks found'}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md text-center">
              {tasks.length === 0 
                ? 'Get organized by creating your first task. Start by clicking the "Create New Task" button.'
                : `No tasks match your current filters. Try changing your filters or resetting to see all ${tasks.length} tasks.`
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {tasks.length > 0 && (filters.activeView !== 'all' || filters.activeCategory || filters.activePriority) && (
                <Button
                  variant="secondaryPro"
                  size="lg"
                  onClick={handleResetFilters}
                  className="flex items-center gap-2"
                >
                  Reset Filters
                </Button>
              )}
              <Button
                variant="primary"
                size="lg"
                onClick={openCreateTaskModal}
                className="flex items-center gap-2"
              >
                <FiPlus className="text-lg" />
                Create New Task
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateTaskModal}
        onSubmit={handleCreateTask}
        title="Create New Task"
        submitButtonText="Create Task"
      />

      {/* Edit Task Modal */}
      <TaskFormModal
        isOpen={isEditModalOpen}
        onClose={closeEditTaskModal}
        onSubmit={handleUpdateTask}
        task={taskToEdit}
        title="Edit Task"
        submitButtonText="Update Task"
        isEditMode={true}
      />

      {/* Tracking Detail Modal */}
      {showTrackingDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TaskTrackingDetail
              task={selectedTask}
              trackingData={selectedTaskTracking}
              onClose={() => setShowTrackingDetail(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPage;