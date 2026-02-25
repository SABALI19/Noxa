// src/contexts/TaskContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import backendService from '../services/backendService';
import { useAuth } from '../hooks/UseAuth.jsx';

const TaskContext = createContext();

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
const PRIORITY_VALUES = ['low', 'medium', 'high'];
const CATEGORY_VALUES = ['work', 'personal', 'health', 'finance', 'education', 'other'];
const TASK_STATUS_VALUES = ['pending', 'in_progress', 'completed', 'cancelled'];
const REMINDER_FREQ_VALUES = ['once', 'daily', 'weekly', 'monthly'];

const isObjectId = (value) => OBJECT_ID_RE.test(String(value ?? ''));
const normalizePriority = (value) => {
  const candidate = String(value || '').toLowerCase();
  return PRIORITY_VALUES.includes(candidate) ? candidate : 'medium';
};

const normalizeCategory = (value) => {
  const candidate = String(value || '').toLowerCase();
  return CATEGORY_VALUES.includes(candidate) ? candidate : 'other';
};

const normalizeTaskStatus = (value, completed = false) => {
  if (completed) return 'completed';
  const candidate = String(value || '').toLowerCase();
  return TASK_STATUS_VALUES.includes(candidate) ? candidate : 'pending';
};

const toIso = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const toUiReminderMethod = (method) => (String(method || '').toLowerCase() === 'email' ? 'email' : 'app');
const toApiReminderMethod = (method) => (String(method || '').toLowerCase() === 'email' ? 'email' : 'in_app');

const toUiReminderStatus = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'sent') return 'today';
  if (value === 'dismissed') return 'completed';
  if (value === 'snoozed' || value === 'pending') return 'upcoming';
  if (['today', 'upcoming', 'completed', 'missed'].includes(value)) return value;
  return 'upcoming';
};

const toApiReminderStatus = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'today') return 'sent';
  if (value === 'completed') return 'dismissed';
  if (value === 'missed') return 'sent';
  if (['pending', 'sent', 'dismissed', 'snoozed'].includes(value)) return value;
  return 'pending';
};

const normalizeReminderFrequency = (value) => {
  const candidate = String(value || '').toLowerCase();
  return REMINDER_FREQ_VALUES.includes(candidate) ? candidate : 'once';
};

const normalizeTaskFromApi = (task = {}) => {
  const completed = Boolean(task.completed || task.status === 'completed');
  return {
    id: String(task._id || task.id),
    title: task.title || 'Untitled task',
    description: task.description || '',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    priority: normalizePriority(task.priority),
    category: normalizeCategory(task.category),
    completed,
    overdue: false,
    status: normalizeTaskStatus(task.status, completed),
    createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
  };
};

const normalizeReminderFromApi = (reminder = {}, tasks = []) => {
  const taskId = reminder.taskId?._id || reminder.taskId || null;
  const normalizedTaskId = taskId ? String(taskId) : null;
  const linkedTask = normalizedTaskId
    ? tasks.find((task) => String(task.id) === normalizedTaskId)
    : null;

  return {
    id: String(reminder._id || reminder.id),
    taskId: normalizedTaskId,
    title: reminder.title || 'Reminder',
    dueDate: reminder.dueDate ? new Date(reminder.dueDate).toISOString() : new Date().toISOString(),
    reminderTime: reminder.reminderTime
      ? new Date(reminder.reminderTime).toISOString()
      : new Date().toISOString(),
    status: toUiReminderStatus(reminder.status),
    category: normalizeCategory(reminder.category),
    priority: normalizePriority(reminder.priority),
    frequency: normalizeReminderFrequency(reminder.frequency),
    notificationMethod: toUiReminderMethod(reminder.notificationMethod),
    taskCompleted: Boolean(linkedTask?.completed),
    note: reminder.note || '',
  };
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Initial filters state
  const [filters, setFilters] = useState(() => {
    const defaultFilters = {
      activeView: 'all',
      activeCategory: null,
      activePriority: null,
      statusFilter: null,
      searchTerm: '',
      sortBy: 'dueDate'
    };

    const savedFilters = localStorage.getItem('noxa_filters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        return { ...defaultFilters, ...(parsed || {}) };
      } catch (e) {
        console.error('Error parsing saved filters:', e);
      }
    }
    
    // Default filters
    return defaultFilters;
  });

  // Initial tasks data
  const [tasks, setTasks] = useState(() => {
    // Try to load from localStorage
    const savedTasks = localStorage.getItem('noxa_tasks');
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed)) {
          return parsed.map((task) => normalizeTaskFromApi(task));
        }
      } catch (e) {
        console.error('Error parsing saved tasks:', e);
      }
    }
    
    // Default tasks
    return [];
  });

  // Initial reminders data (linked to tasks)
  const [reminders, setReminders] = useState(() => {
    const savedReminders = localStorage.getItem('noxa_reminders');
    if (savedReminders) {
      try {
        const parsed = JSON.parse(savedReminders);
        if (Array.isArray(parsed)) {
          return parsed.map((reminder) => normalizeReminderFromApi(reminder));
        }
      } catch (e) {
        console.error('Error parsing saved reminders:', e);
      }
    }
    
    return [];
  });

  // Save to localStorage whenever tasks or reminders change
  useEffect(() => {
    localStorage.setItem('noxa_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('noxa_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('noxa_filters', JSON.stringify(filters));
  }, [filters]);

  const refreshFromBackend = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const [taskPayload, reminderPayload] = await Promise.all([
        backendService.getTasks(),
        backendService.getReminders(),
      ]);

      const normalizedTasks = Array.isArray(taskPayload)
        ? taskPayload.map((task) => normalizeTaskFromApi(task))
        : [];

      const normalizedReminders = Array.isArray(reminderPayload)
        ? reminderPayload.map((reminder) => normalizeReminderFromApi(reminder, normalizedTasks))
        : [];

      setTasks(normalizedTasks);
      setReminders(normalizedReminders);
    } catch (error) {
      console.error('Failed to load task/reminder data from backend:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setTasks([]);
      setReminders([]);
      return;
    }

    refreshFromBackend();
  }, [authLoading, isAuthenticated, refreshFromBackend]);

  // Filter functions
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      activeView: 'all',
      activeCategory: null,
      activePriority: null,
      statusFilter: null,
      searchTerm: '',
      sortBy: 'dueDate'
    });
  }, []);

  // Get today's tasks
  const getTodayTasks = useCallback(() => {
    const today = new Date().toDateString();
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toDateString();
      return taskDate === today;
    });
  }, [tasks]);

  // Get overdue tasks
  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const d = new Date(task.dueDate);
      return !task.completed && d < now;
    });
  }, [tasks]);

  // Get week tasks (for the sidebar count)
  const getWeekTasks = useCallback(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return tasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= now && dueDate <= nextWeek;
    });
  }, [tasks]);

  // Get filtered tasks based on current filters
  const getFilteredTasks = useCallback(() => {
    let filtered = [...tasks];
    
    // Apply view filter
    if (filters.activeView && filters.activeView !== 'all') {
      switch (filters.activeView) {
        case 'today':
          filtered = getTodayTasks();
          break;
        case 'week':
          const now = new Date();
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          filtered = filtered.filter(task => {
            if (!task.dueDate || task.completed) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= now && dueDate <= nextWeek;
          });
          break;
        case 'overdue':
          filtered = getOverdueTasks();
          break;
        case 'completed':
          filtered = filtered.filter(task => task.completed);
          break;
        // 'all' view shows all tasks
      }
    }
    
    // Apply category filter
    if (filters.activeCategory) {
      filtered = filtered.filter(task => task.category === filters.activeCategory);
    }
    
    // Apply priority filter
    if (filters.activePriority) {
      filtered = filtered.filter(task => task.priority === filters.activePriority);
    }

    // Apply status filter (used by header search)
    if (filters.statusFilter) {
      if (filters.statusFilter === 'completed') {
        filtered = filtered.filter((task) => task.completed);
      } else if (filters.statusFilter === 'pending') {
        filtered = filtered.filter((task) => !task.completed);
      } else if (filters.statusFilter === 'overdue') {
        const now = new Date();
        filtered = filtered.filter((task) => task.dueDate && !task.completed && new Date(task.dueDate) < now);
      } else {
        filtered = filtered.filter((task) => task.status === filters.statusFilter);
      }
    }

    // Apply text search filter (used by header search)
    if (filters.searchTerm && String(filters.searchTerm).trim()) {
      const query = String(filters.searchTerm).trim().toLowerCase();
      filtered = filtered.filter(
        (task) =>
          String(task.title || '').toLowerCase().includes(query) ||
          String(task.description || '').toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
            
          case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
            
          case 'category':
            return a.category.localeCompare(b.category);
            
          case 'created':
            return new Date(a.createdAt) - new Date(b.createdAt);
            
          default:
            return 0;
        }
      });
    }
    
    return filtered;
  }, [tasks, filters, getTodayTasks, getOverdueTasks, getWeekTasks]);

  // Task operations
  const addTask = useCallback(
    (newTask) => {
      const optimisticId = `tmp-task-${Date.now()}`;
      const taskWithId = {
        ...newTask,
        id: optimisticId,
        createdAt: new Date().toISOString(),
        priority: normalizePriority(newTask.priority),
        category: normalizeCategory(newTask.category),
        status: normalizeTaskStatus(newTask.status, Boolean(newTask.completed)),
        overdue: false,
      };

      setTasks((prev) => [...prev, taskWithId]);

      if (isAuthenticated) {
        const payload = {
          title: newTask.title || 'Untitled task',
          description: newTask.description || '',
          dueDate: toIso(newTask.dueDate),
          priority: normalizePriority(newTask.priority),
          category: normalizeCategory(newTask.category),
          completed: Boolean(newTask.completed),
          status: normalizeTaskStatus(newTask.status, Boolean(newTask.completed)),
          recurrence: ['none', 'daily', 'weekly', 'monthly', 'yearly'].includes(
            String(newTask.recurrence || '').toLowerCase()
          )
            ? String(newTask.recurrence).toLowerCase()
            : 'none',
        };

        void backendService
          .createTask(payload)
          .then((created) => {
            const normalized = normalizeTaskFromApi(created);
            setTasks((prev) =>
              prev.map((task) => (String(task.id) === optimisticId ? normalized : task))
            );
          })
          .catch((error) => {
            console.error('Failed to create task:', error);
            setTasks((prev) => prev.filter((task) => String(task.id) !== optimisticId));
          });
      }

      return taskWithId;
    },
    [isAuthenticated]
  );

  const updateTask = useCallback(
    (taskId, updates) => {
      const normalizedId = String(taskId);
      const existingTask = tasks.find((task) => String(task.id) === normalizedId);
      if (!existingTask) return;

      setTasks((prev) =>
        prev.map((task) => (String(task.id) === normalizedId ? { ...task, ...updates } : task))
      );

      if (updates.completed !== undefined) {
        setReminders((prev) =>
          prev.map((reminder) =>
            String(reminder.taskId) === normalizedId
              ? {
                  ...reminder,
                  taskCompleted: Boolean(updates.completed),
                  status: updates.completed
                    ? 'completed'
                    : reminder.status === 'completed'
                    ? 'upcoming'
                    : reminder.status,
                }
              : reminder
          )
        );
      }

      if (isAuthenticated && isObjectId(normalizedId)) {
        const merged = { ...existingTask, ...updates };
        const payload = {
          title: merged.title,
          description: merged.description || '',
          dueDate: toIso(merged.dueDate),
          priority: normalizePriority(merged.priority),
          category: normalizeCategory(merged.category),
          completed: Boolean(merged.completed),
          status: normalizeTaskStatus(merged.status, Boolean(merged.completed)),
          recurrence: ['none', 'daily', 'weekly', 'monthly', 'yearly'].includes(
            String(merged.recurrence || '').toLowerCase()
          )
            ? String(merged.recurrence).toLowerCase()
            : 'none',
        };

        void backendService
          .updateTask(normalizedId, payload)
          .then((updated) => {
            const normalized = normalizeTaskFromApi(updated);
            setTasks((prev) =>
              prev.map((task) => (String(task.id) === normalizedId ? normalized : task))
            );
          })
          .catch((error) => {
            console.error('Failed to update task:', error);
          });
      }
    },
    [isAuthenticated, tasks]
  );

  const deleteTask = useCallback(
    (taskId) => {
      const normalizedId = String(taskId);
      const taskSnapshot = tasks.find((task) => String(task.id) === normalizedId);
      const reminderSnapshot = reminders.filter((reminder) => String(reminder.taskId) === normalizedId);

      setTasks((prev) => prev.filter((task) => String(task.id) !== normalizedId));
      setReminders((prev) => prev.filter((reminder) => String(reminder.taskId) !== normalizedId));

      if (isAuthenticated && isObjectId(normalizedId)) {
        void backendService.deleteTask(normalizedId).catch((error) => {
          console.error('Failed to delete task:', error);
          if (taskSnapshot) setTasks((prev) => [taskSnapshot, ...prev]);
          if (reminderSnapshot.length > 0) setReminders((prev) => [...prev, ...reminderSnapshot]);
        });
      }
    },
    [isAuthenticated, reminders, tasks]
  );

  const toggleTaskCompletion = useCallback(
    (taskId) => {
      const task = tasks.find((entry) => String(entry.id) === String(taskId));
      if (!task) return;
      updateTask(taskId, {
        completed: !task.completed,
        status: !task.completed ? 'completed' : 'pending',
      });
    },
    [tasks, updateTask]
  );

  // Reminder operations
  const addReminder = useCallback(
    (newReminder) => {
      const optimisticId = `tmp-reminder-${Date.now()}`;
      const reminderWithId = {
        ...newReminder,
        id: optimisticId,
        status: toUiReminderStatus(newReminder.status),
        notificationMethod: toUiReminderMethod(newReminder.notificationMethod),
        frequency: normalizeReminderFrequency(newReminder.frequency),
        category: normalizeCategory(newReminder.category),
        priority: normalizePriority(newReminder.priority),
      };

      setReminders((prev) => [...prev, reminderWithId]);

      if (isAuthenticated) {
        const payload = {
          title: newReminder.title || 'Reminder',
          dueDate: toIso(newReminder.dueDate) || new Date().toISOString(),
          reminderTime: toIso(newReminder.reminderTime) || new Date().toISOString(),
          status: toApiReminderStatus(newReminder.status),
          priority: normalizePriority(newReminder.priority),
          category: normalizeCategory(newReminder.category),
          frequency: normalizeReminderFrequency(newReminder.frequency),
          notificationMethod: toApiReminderMethod(newReminder.notificationMethod),
          note: newReminder.note || '',
        };

        if (newReminder.taskId && isObjectId(newReminder.taskId)) {
          payload.taskId = String(newReminder.taskId);
        }

        void backendService
          .createReminder(payload)
          .then((created) => {
            const normalized = normalizeReminderFromApi(created, tasks);
            setReminders((prev) =>
              prev.map((reminder) => (String(reminder.id) === optimisticId ? normalized : reminder))
            );
          })
          .catch((error) => {
            console.error('Failed to create reminder:', error);
            setReminders((prev) => prev.filter((reminder) => String(reminder.id) !== optimisticId));
          });
      }

      return reminderWithId;
    },
    [isAuthenticated, tasks]
  );

  const updateReminder = useCallback(
    (reminderId, updates) => {
      const normalizedId = String(reminderId);
      const existingReminder = reminders.find((reminder) => String(reminder.id) === normalizedId);
      if (!existingReminder) return;

      setReminders((prev) =>
        prev.map((reminder) =>
          String(reminder.id) === normalizedId ? { ...reminder, ...updates } : reminder
        )
      );

      if (isAuthenticated && isObjectId(normalizedId)) {
        const merged = { ...existingReminder, ...updates };
        const payload = {
          title: merged.title || 'Reminder',
          dueDate: toIso(merged.dueDate) || new Date().toISOString(),
          reminderTime: toIso(merged.reminderTime) || new Date().toISOString(),
          status: toApiReminderStatus(merged.status),
          priority: normalizePriority(merged.priority),
          category: normalizeCategory(merged.category),
          frequency: normalizeReminderFrequency(merged.frequency),
          notificationMethod: toApiReminderMethod(merged.notificationMethod),
          note: merged.note || '',
        };

        if (merged.taskId && isObjectId(merged.taskId)) {
          payload.taskId = String(merged.taskId);
        }

        void backendService
          .updateReminder(normalizedId, payload)
          .then((updated) => {
            const normalized = normalizeReminderFromApi(updated, tasks);
            setReminders((prev) =>
              prev.map((reminder) => (String(reminder.id) === normalizedId ? normalized : reminder))
            );
          })
          .catch((error) => {
            console.error('Failed to update reminder:', error);
          });
      }
    },
    [isAuthenticated, reminders, tasks]
  );

  const deleteReminder = useCallback(
    (reminderId) => {
      const normalizedId = String(reminderId);
      const reminderSnapshot = reminders.find((reminder) => String(reminder.id) === normalizedId);
      setReminders((prev) => prev.filter((reminder) => String(reminder.id) !== normalizedId));

      if (isAuthenticated && isObjectId(normalizedId)) {
        void backendService.deleteReminder(normalizedId).catch((error) => {
          console.error('Failed to delete reminder:', error);
          if (reminderSnapshot) setReminders((prev) => [reminderSnapshot, ...prev]);
        });
      }
    },
    [isAuthenticated, reminders]
  );

  // Calculate task statistics
  const getTaskStats = useCallback(() => {
    const now = new Date();
    const isTaskOverdue = (task) => {
      if (!task.dueDate) return false;
      const d = new Date(task.dueDate);
      return !task.completed && d < now;
    };

    const overdue = tasks.filter(t => isTaskOverdue(t)).length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.filter(t => !t.completed && !isTaskOverdue(t)).length;
    const inProgress = tasks.filter(t => t.status === 'in_progress' && !t.completed).length;

    return { 
      pending, 
      completed, 
      overdue, 
      inProgress, 
      total: tasks.length 
    };
  }, [tasks]);

  // Calculate reminder statistics
  const getReminderStats = useCallback(() => {
    const now = new Date();
    const total = reminders.length;
    const today = reminders.filter(r => r.status === 'today').length;
    const upcoming = reminders.filter(r => r.status === 'upcoming').length;
    const completed = reminders.filter(r => r.status === 'completed').length;
    const missed = reminders.filter((reminder) => {
      if (reminder.status === 'missed') return true;
      if (reminder.status === 'completed') return false;
      const reminderTime = new Date(reminder.reminderTime);
      return !Number.isNaN(reminderTime.getTime()) && reminderTime < now && reminder.status !== 'today';
    }).length;

    return { total, today, upcoming, completed, missed };
  }, [reminders]);

  // Get task by ID
  const getTaskById = useCallback((taskId) => {
    return tasks.find(task => String(task.id) === String(taskId));
  }, [tasks]);

  // Get reminders for a task
  const getRemindersForTask = useCallback((taskId) => {
    return reminders.filter(reminder => String(reminder.taskId) === String(taskId));
  }, [reminders]);

  // Get today's reminders
  const getTodayReminders = useCallback(() => {
    const today = new Date().toDateString();
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminderTime).toDateString();
      return reminderDate === today && reminder.status !== 'completed';
    });
  }, [reminders]);

  const value = {
    // State
    tasks,
    reminders,
    filters,
    
    // Task operations
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    
    // Reminder operations
    addReminder,
    updateReminder,
    deleteReminder,
    
    // Filter operations
    updateFilters,
    resetFilters,
    getFilteredTasks,
    getWeekTasks,
    
    // Statistics
    getTaskStats,
    getReminderStats,
    
    // Getter functions
    getTaskById,
    getRemindersForTask,
    getOverdueTasks,
    getTodayTasks,
    getTodayReminders,
    reloadData: refreshFromBackend,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
