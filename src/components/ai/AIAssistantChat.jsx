// src/components/ai/AIAssistantChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  FiMessageSquare,
  FiSend,
  FiX,
  FiMinimize2,
  FiMaximize2,
  FiCopy,
  FiCheck
} from 'react-icons/fi';
import Button from '../Button';
import AiService from '../../services/AiService';
import { useTasks } from '../../context/TaskContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationTracking } from '../../hooks/useNotificationTracking';
import { createGoal, completeGoalByTitle, getGoals } from '../../services/goalStorage';

/**
 * AI Assistant Chat Component
 * Floating chat interface for AI interactions
 */
const AIAssistantChat = ({
  goals = [],
  tasks = [],
  userContext = {},
  showFab = true,
  openSignal = 0,
  closeSignal = 0
}) => {
  const {
    tasks: contextTasks,
    addTask,
    updateTask,
    addReminder
  } = useTasks();
  const { addNotification } = useNotifications();
  const { trackNotification, trackCompletion } = useNotificationTracking();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Noxa, your AI productivity assistant. I can help you draft emails, prepare agendas, summarize your week, or provide insights about your goals and tasks. What would you like help with?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll only the internal chat message pane
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // External open trigger (e.g., AI Crier "Chat Now")
  useEffect(() => {
    if (openSignal === 0) return;
    if (!showFab) return;
    setIsOpen(true);
    setIsMinimized(false);
  }, [openSignal, showFab]);

  // External close trigger (e.g., AI Crier switch off)
  useEffect(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, [closeSignal]);

  const normalizePriority = (priority) => {
    const value = String(priority || '').toLowerCase();
    if (value === 'high' || value === 'medium' || value === 'low') return value;
    return 'medium';
  };

  const normalizeNotificationMethod = (method) => {
    const value = String(method || '').toLowerCase();
    if (value === 'app' || value === 'email' || value === 'both') return value;
    return 'app';
  };

  const toIsoDate = (input, fallbackDate) => {
    const date = input ? new Date(input) : fallbackDate;
    if (Number.isNaN(date?.getTime?.())) {
      return fallbackDate.toISOString();
    }
    return date.toISOString();
  };

  const executeActions = async (actions, liveTasks) => {
    if (!Array.isArray(actions) || actions.length === 0) return [];

    const created = [];
    let taskSnapshot = [...liveTasks];

    for (const action of actions) {
      const type = action?.type;
      const payload = action?.payload || {};

      if (type === 'create_task') {
        const createdTask = addTask({
          title: payload.title || 'New Task',
          description: payload.description || '',
          dueDate: toIsoDate(payload.dueDate, new Date(Date.now() + 24 * 60 * 60 * 1000)),
          priority: normalizePriority(payload.priority),
          category: (payload.category || 'personal').toLowerCase(),
          completed: false,
          status: payload.status || 'pending',
          overdue: false
        });
        taskSnapshot = [createdTask, ...taskSnapshot];
        addNotification('task_created', createdTask);
        trackNotification(createdTask.id, 'task', 'sent', 'task_created');
        created.push(`Task created: ${createdTask.title}`);
        continue;
      }

      if (type === 'create_goal') {
        const goal = createGoal({
          title: payload.title || 'New Goal',
          category: payload.category || 'Personal',
          targetDate: payload.targetDate || 'Ongoing',
          description: payload.description || '',
          priority: normalizePriority(payload.priority),
          milestone: payload.milestone || '',
          nextCheckin: payload.nextCheckin || '',
          targetValue: payload.targetValue ?? 100,
          currentValue: payload.currentValue ?? 0,
          unit: payload.unit || '',
          completed: false,
          progress: 0
        });
        addNotification('goal_created', goal);
        trackNotification(goal.id, 'goal', 'sent', 'goal_created');
        created.push(`Goal created: ${goal.title}`);
        continue;
      }

      if (type === 'create_reminder') {
        const linkedTask = payload.taskId
          ? taskSnapshot.find((task) => task.id === payload.taskId)
          : taskSnapshot.find(
              (task) => task.title?.trim().toLowerCase() === String(payload.taskTitle || '').trim().toLowerCase()
            );
        const dueDate = toIsoDate(payload.dueDate, new Date(Date.now() + 24 * 60 * 60 * 1000));
        const reminderTime = toIsoDate(payload.reminderTime, new Date(Date.now() + 60 * 60 * 1000));

        const reminder = addReminder({
          taskId: linkedTask?.id || payload.taskId || null,
          title: payload.title || `Reminder: ${linkedTask?.title || 'Task'}`,
          dueDate,
          reminderTime,
          status: 'upcoming',
          category: (payload.category || linkedTask?.category || 'general').toLowerCase(),
          priority: normalizePriority(payload.priority || linkedTask?.priority),
          frequency: payload.frequency || 'once',
          notificationMethod: normalizeNotificationMethod(payload.notificationMethod),
          taskCompleted: Boolean(linkedTask?.completed),
          note: payload.note || ''
        });
        addNotification('reminder_created', reminder);
        trackNotification(reminder.id, 'reminder', 'sent', 'reminder_created');
        created.push(`Reminder set: ${reminder.title}`);
        continue;
      }

      if (type === 'complete_task') {
        const task = payload.taskId
          ? taskSnapshot.find((item) => item.id === payload.taskId)
          : taskSnapshot.find(
              (item) => item.title?.trim().toLowerCase() === String(payload.title || '').trim().toLowerCase()
            );
        if (task) {
          updateTask(task.id, { completed: true, status: 'completed' });
          addNotification('task_completed', task);
          trackCompletion(task.id, 'task');
          trackNotification(task.id, 'task', 'sent', 'task_completed');
          created.push(`Task completed: ${task.title}`);
        }
        continue;
      }

      if (type === 'complete_goal') {
        const goal = completeGoalByTitle(payload.title);
        if (goal) {
          addNotification('goal_completed', goal);
          trackCompletion(goal.id, 'goal');
          trackNotification(goal.id, 'goal', 'sent', 'goal_completed');
          created.push(`Goal completed: ${goal.title}`);
        }
      }
    }

    return created;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const liveGoals = goals.length > 0 ? goals : getGoals();
      const liveTasks = tasks.length > 0 ? tasks : contextTasks;

      // Prepare context for AI
      const context = {
        goals: liveGoals,
        tasks: liveTasks,
        ...userContext,
        previousMessages: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      };

      const response = await AiService.chatWithActions(inputValue, context);
      const actionResults = await executeActions(response.actions, liveTasks);
      const actionSummary = actionResults.length > 0
        ? `\n\nActions completed:\n- ${actionResults.join('\n- ')}`
        : '';

      const assistantMessage = {
        role: 'assistant',
        content: `${response.message}${actionSummary}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);

      const isProxyUnavailable =
        error instanceof TypeError ||
        /Failed to fetch|NetworkError|ERR_CONNECTION_REFUSED/i.test(error?.message || '');
      
      const errorMessage = {
        role: 'assistant',
        content: isProxyUnavailable
          ? "I can't reach the AI proxy server right now. Start your backend proxy (usually on http://localhost:3001) and try again."
          : "I'm sorry, I encountered an error processing your request.",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickActions = [
    { label: '📧 Draft Email', prompt: 'Help me draft an email' },
    { label: '📋 Create Agenda', prompt: 'Prepare an agenda for my upcoming meeting' },
    { label: '📊 Weekly Summary', prompt: 'Summarize my productivity this week' },
    { label: '💡 Suggest Tasks', prompt: 'Suggest tasks for my current goals' }
  ];

  const handleQuickAction = (prompt) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  if (!showFab) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-[#3D9B9B] to-[#4AB3B3] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Open AI Assistant"
      >
        <FiMessageSquare className="text-2xl" />
      </button>
    );
  }

  return (
   <div
  className={`fixed z-50 flex flex-col transition-all duration-300 
    ${isMinimized 
      ? 'bottom-6 right-6 w-80 h-16' 
      : 'bottom-0 right-0 md:bottom-6 md:right-6 w-full h-full md:w-96 md:h-[600px] md:rounded-2xl'
    } 
    bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden
    ${!isMinimized && 'rounded-t-2xl md:rounded-2xl'}
  `}
>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-[#3d9c9c] dark:bg-gray-900 rounded-t-2xl">
        <div className="flex items-center  gap-3">
          <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
            <FiMessageSquare className="text-[#3d9c9c] dark:text-[#3d9c9c]" />
          </div>
          <div className="min-h-[2.5rem]">
            <h3 className="font-bold text-gray-100">Noxa Assistant</h3>
            <p className="text-xs text-gray-300 h-4">{isTyping ? 'Typing...' : '\u00A0'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white hover:bg-opacity-60 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <FiMaximize2 className="text-gray-600 dark:text-gray-300" />
            ) : (
              <FiMinimize2 className="text-gray-600 dark:text-gray-300" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white hover:bg-opacity-60 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {/* Messages */}
            <div className="p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.isError
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.role === 'assistant' && !message.isError && (
                        <button
                          onClick={() => handleCopy(message.content, index)}
                          className="ml-2 p-1 hover:bg-white hover:bg-opacity-20 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          {copiedIndex === index ? (
                            <FiCheck className="text-xs" />
                          ) : (
                            <FiCopy className="text-xs" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="text-xs p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-left"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 resize-none"
                rows="2"
              />
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="rounded-xl px-2"
              >
                <FiSend />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantChat;
