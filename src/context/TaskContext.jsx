// src/contexts/TaskContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const TaskContext = createContext();

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  // Initial tasks data
  const [tasks, setTasks] = useState(() => {
    // Try to load from localStorage
    const savedTasks = localStorage.getItem('noxa_tasks');
    if (savedTasks) {
      try {
        return JSON.parse(savedTasks);
      } catch (e) {
        console.error('Error parsing saved tasks:', e);
      }
    }
    
    // Default tasks
    return [
      {
        id: 1,
        title: 'Review quarterly budget report',
        description: '',
        dueDate: '2024-01-20T20:00:00',
        priority: 'high',
        category: 'work',
        completed: false,
        overdue: true,
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00'
      },
      {
        id: 2,
        title: 'Prepare presentation slides',
        description: '',
        dueDate: '2024-01-22T17:30:00',
        priority: 'medium',
        category: 'work',
        completed: false,
        overdue: false,
        status: 'in_progress',
        createdAt: '2024-01-16T14:30:00'
      },
      {
        id: 3,
        title: 'Schedule dentist appointment',
        description: '',
        dueDate: '2024-01-23T10:00:00',
        priority: 'low',
        category: 'personal',
        completed: false,
        overdue: false,
        status: 'pending',
        createdAt: '2024-01-17T09:15:00'
      },
      {
        id: 4,
        title: 'Morning workout routine',
        description: '',
        dueDate: '2024-01-22T08:00:00',
        priority: 'medium',
        category: 'health',
        completed: true,
        overdue: false,
        status: 'completed',
        createdAt: '2024-01-18T07:00:00'
      },
      {
        id: 5,
        title: 'Buy groceries for the week',
        description: '',
        dueDate: '2024-01-26T21:00:00',
        priority: 'low',
        category: 'personal',
        completed: false,
        overdue: false,
        status: 'pending',
        createdAt: '2024-01-19T18:45:00'
      }
    ];
  });

  // Initial reminders data (linked to tasks)
  const [reminders, setReminders] = useState(() => {
    const savedReminders = localStorage.getItem('noxa_reminders');
    if (savedReminders) {
      try {
        return JSON.parse(savedReminders);
      } catch (e) {
        console.error('Error parsing saved reminders:', e);
      }
    }
    
    return [
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
    ];
  });

  // Save to localStorage whenever tasks or reminders change
  useEffect(() => {
    localStorage.setItem('noxa_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('noxa_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Task operations
  const addTask = useCallback((newTask) => {
    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    const taskWithId = {
      ...newTask,
      id: newId,
      createdAt: new Date().toISOString(),
      overdue: false // Will be calculated dynamically
    };
    
    setTasks(prev => [...prev, taskWithId]);
    return taskWithId;
  }, [tasks]);

  const updateTask = useCallback((taskId, updates) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
    
    // If task is marked as completed, update corresponding reminders
    if (updates.completed !== undefined) {
      setReminders(prev => prev.map(reminder => 
        reminder.taskId === taskId 
          ? { ...reminder, taskCompleted: updates.completed, status: updates.completed ? 'completed' : reminder.status }
          : reminder
      ));
    }
  }, []);

  const deleteTask = useCallback((taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    // Also delete related reminders
    setReminders(prev => prev.filter(reminder => reminder.taskId !== taskId));
  }, []);

  // Reminder operations
  const addReminder = useCallback((newReminder) => {
    const newId = reminders.length > 0 ? Math.max(...reminders.map(r => r.id)) + 1 : 1;
    const reminderWithId = { ...newReminder, id: newId };
    setReminders(prev => [...prev, reminderWithId]);
    return reminderWithId;
  }, [reminders]);

  const updateReminder = useCallback((reminderId, updates) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === reminderId ? { ...reminder, ...updates } : reminder
    ));
  }, []);

  const deleteReminder = useCallback((reminderId) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
  }, []);

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
    const total = reminders.length;
    const today = reminders.filter(r => r.status === 'today').length;
    const upcoming = reminders.filter(r => r.status === 'upcoming').length;
    const completed = reminders.filter(r => r.status === 'completed').length;
    const missed = reminders.filter(r => r.status === 'missed').length;

    return { total, today, upcoming, completed, missed };
  }, [reminders]);

  // Get task by ID
  const getTaskById = useCallback((taskId) => {
    return tasks.find(task => task.id === taskId);
  }, [tasks]);

  // Get reminders for a task
  const getRemindersForTask = useCallback((taskId) => {
    return reminders.filter(reminder => reminder.taskId === taskId);
  }, [reminders]);

  // Get overdue tasks
  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const d = new Date(task.dueDate);
      return !task.completed && d < now;
    });
  }, [tasks]);

  // Get today's tasks
  const getTodayTasks = useCallback(() => {
    const today = new Date().toDateString();
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate).toDateString();
      return taskDate === today;
    });
  }, [tasks]);

  // Get today's reminders
  const getTodayReminders = useCallback(() => {
    const today = new Date().toDateString();
    return reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminderTime).toDateString();
      return reminderDate === today && reminder.status !== 'completed';
    });
  }, [reminders]);

  const value = {
    tasks,
    reminders,
    addTask,
    updateTask,
    deleteTask,
    addReminder,
    updateReminder,
    deleteReminder,
    getTaskStats,
    getReminderStats,
    getTaskById,
    getRemindersForTask,
    getOverdueTasks,
    getTodayTasks,
    getTodayReminders
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};