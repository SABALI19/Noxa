// src/components/ai/AIAssistantChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  FiMessageSquare,
  FiSend,
  FiX,
  FiMinimize2,
  FiMaximize2,
  FiCopy,
  FiCheck,
  FiClock,
  FiPlus
} from 'react-icons/fi';
import Button from '../Button';
import AiService from '../../services/AiService';
import backendService from '../../services/backendService';
import { useTasks } from '../../context/TaskContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationTracking } from '../../hooks/useNotificationTracking';
import { createGoal, completeGoalByTitle, getGoals } from '../../services/goalStorage';
import { useAuth } from '../../hooks/UseAuth';

const CHAT_STORAGE_KEY = 'noxa_ai_chat_sessions_v1';
const MAX_CHAT_SESSIONS = 20;

const createAssistantWelcomeMessage = () => ({
  role: 'assistant',
  content:
    "Hi! I'm Noxa, your AI productivity assistant. I can help you draft emails, prepare agendas, summarize your week, or manage your goals, tasks, reminders, and notes. What would you like help with?",
  timestamp: new Date()
});

const normalizeMessage = (message = {}) => ({
  role: message.role || 'assistant',
  content: message.content || '',
  timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
  isError: Boolean(message.isError)
});

const createConversationSession = () => {
  const nowIso = new Date().toISOString();
  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'New conversation',
    createdAt: nowIso,
    updatedAt: nowIso,
    messages: [createAssistantWelcomeMessage()]
  };
};

const normalizeConversationSession = (session = {}) => ({
  id: session.id || `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: session.title || 'New conversation',
  createdAt: session.createdAt || new Date().toISOString(),
  updatedAt: session.updatedAt || session.createdAt || new Date().toISOString(),
  messages:
    Array.isArray(session.messages) && session.messages.length > 0
      ? session.messages.map((message) => normalizeMessage(message))
      : [createAssistantWelcomeMessage()]
});

const normalizeConversationSessions = (sessions = []) =>
  sessions.map((session) => normalizeConversationSession(session)).slice(0, MAX_CHAT_SESSIONS);

const buildConversationTitle = (messages = []) => {
  const firstUserMessage = messages.find((message) => message.role === 'user' && message.content?.trim());
  if (!firstUserMessage) {
    return 'New conversation';
  }

  const trimmed = firstUserMessage.content.trim().replace(/\s+/g, ' ');
  return trimmed.length > 36 ? `${trimmed.slice(0, 36)}...` : trimmed;
};

const loadStoredSessions = () => {
  if (typeof window === 'undefined') {
    const fallback = createConversationSession();
    return [fallback];
  }

  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) {
      const fallback = createConversationSession();
      return [fallback];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const fallback = createConversationSession();
      return [fallback];
    }

    const normalized = normalizeConversationSessions(parsed);

    if (normalized.length === 0) {
      const fallback = createConversationSession();
      return [fallback];
    }

    return normalized;
  } catch {
    const fallback = createConversationSession();
    return [fallback];
  }
};

const serializeSessions = (sessions = []) =>
  sessions.map((session) => ({
    ...session,
    messages: (session.messages || []).map((message) => ({
      ...message,
      timestamp:
        message.timestamp instanceof Date
          ? message.timestamp.toISOString()
          : new Date(message.timestamp || Date.now()).toISOString()
    }))
  }));

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
  const { isAuthenticated, loading: authLoading } = useAuth();
  const initialSessionsRef = useRef(loadStoredSessions());
  const isHydratingRemoteRef = useRef(true);
  const lastSyncedPayloadRef = useRef('');
  const saveTimeoutRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatSessions, setChatSessions] = useState(initialSessionsRef.current);
  const [activeSessionId, setActiveSessionId] = useState(initialSessionsRef.current[0]?.id || null);
  const [messages, setMessages] = useState(initialSessionsRef.current[0]?.messages || [createAssistantWelcomeMessage()]);
  const [showHistory, setShowHistory] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const getSessionsSignature = (sessionsToSerialize) =>
    JSON.stringify(serializeSessions(sessionsToSerialize));

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
    setShowHistory(false);
  }, [openSignal, showFab]);

  // External close trigger (e.g., AI Crier switch off)
  useEffect(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setShowHistory(false);
  }, [closeSignal]);

  useEffect(() => {
    if (authLoading) return;

    let isCancelled = false;

    const hydrateHistory = async () => {
      if (!isAuthenticated) {
        isHydratingRemoteRef.current = false;
        lastSyncedPayloadRef.current = '';
        return;
      }

      isHydratingRemoteRef.current = true;
      try {
        const remoteSessions = await backendService.getAiChatHistory();
        if (isCancelled) return;

        if (Array.isArray(remoteSessions) && remoteSessions.length > 0) {
          const normalizedRemote = normalizeConversationSessions(remoteSessions);
          const nextActiveSessionId =
            normalizedRemote.find((session) => session.id === activeSessionId)?.id ||
            normalizedRemote[0]?.id ||
            null;

          setChatSessions(normalizedRemote);
          setActiveSessionId(nextActiveSessionId);
          setMessages(
            normalizedRemote.find((session) => session.id === nextActiveSessionId)?.messages ||
              normalizedRemote[0]?.messages ||
              [createAssistantWelcomeMessage()]
          );
          lastSyncedPayloadRef.current = getSessionsSignature(normalizedRemote);
        } else {
          const localSignature = getSessionsSignature(chatSessions);
          await backendService.saveAiChatHistory(serializeSessions(chatSessions));
          if (!isCancelled) {
            lastSyncedPayloadRef.current = localSignature;
          }
        }
      } catch (error) {
        console.error('Failed to sync AI chat history from backend:', error);
      } finally {
        if (!isCancelled) {
          isHydratingRemoteRef.current = false;
        }
      }
    };

    void hydrateHistory();

    return () => {
      isCancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(serializeSessions(chatSessions)));
  }, [chatSessions]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (isHydratingRemoteRef.current) return;

    const payloadSignature = getSessionsSignature(chatSessions);
    if (payloadSignature === lastSyncedPayloadRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await backendService.saveAiChatHistory(serializeSessions(chatSessions));
        lastSyncedPayloadRef.current = payloadSignature;
      } catch (error) {
        console.error('Failed to persist AI chat history to backend:', error);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [chatSessions, authLoading, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (chatSessions.length === 0) {
      const freshSession = createConversationSession();
      setChatSessions([freshSession]);
      setActiveSessionId(freshSession.id);
      setMessages(freshSession.messages);
      return;
    }

    const activeSession = chatSessions.find((session) => session.id === activeSessionId);
    if (!activeSession) {
      setActiveSessionId(chatSessions[0].id);
      setMessages(chatSessions[0].messages);
    }
  }, [chatSessions, activeSessionId]);

  const updateActiveConversationMessages = (nextMessagesOrUpdater) => {
    setMessages((previousMessages) => {
      const nextMessages =
        typeof nextMessagesOrUpdater === 'function'
          ? nextMessagesOrUpdater(previousMessages)
          : nextMessagesOrUpdater;

      const nowIso = new Date().toISOString();
      setChatSessions((previousSessions) =>
        previousSessions.map((session) => {
          if (session.id !== activeSessionId) return session;
          return {
            ...session,
            messages: nextMessages,
            updatedAt: nowIso,
            title: buildConversationTitle(nextMessages)
          };
        })
      );

      return nextMessages;
    });
  };

  const handleSelectConversation = (sessionId) => {
    const selected = chatSessions.find((session) => session.id === sessionId);
    if (!selected) return;
    setActiveSessionId(selected.id);
    setMessages(selected.messages);
    setShowHistory(false);
  };

  const handleCreateConversation = () => {
    const newSession = createConversationSession();
    setChatSessions((previousSessions) => [newSession, ...previousSessions].slice(0, MAX_CHAT_SESSIONS));
    setActiveSessionId(newSession.id);
    setMessages(newSession.messages);
    setInputValue('');
    setShowHistory(false);
  };

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

  const normalizeNoteCategory = (category) => {
    const value = String(category || '').toLowerCase();
    if (value === 'work' || value === 'personal' || value === 'ideas') return value;
    if (value === 'study') return 'study';
    if (value === 'general' || value === 'other') return value;
    return 'work';
  };

  const toIsoDate = (input, fallbackDate) => {
    const date = input ? new Date(input) : fallbackDate;
    if (Number.isNaN(date?.getTime?.())) {
      return fallbackDate.toISOString();
    }
    return date.toISOString();
  };

  const executeActions = async (actions, liveTasks, liveNotes = []) => {
    if (!Array.isArray(actions) || actions.length === 0) return [];

    const created = [];
    let taskSnapshot = [...liveTasks];
    let noteSnapshot = Array.isArray(liveNotes) ? [...liveNotes] : [];

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
        if (!isAuthenticated) {
          addNotification('reminder_created', reminder);
        }
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
        continue;
      }

      if (type === 'create_note') {
        const createdNote = await backendService.createNote({
          title: String(payload.title || '').trim() || 'New Note',
          content: String(payload.content || '').trim() || 'Created by Noxa AI assistant.',
          category: normalizeNoteCategory(payload.category),
          isPinned: Boolean(payload.isPinned)
        });

        const normalizedNote = {
          id: createdNote?._id || createdNote?.id || `note-${Date.now()}`,
          title: createdNote?.title || 'New Note',
          content: createdNote?.content || '',
          category: normalizeNoteCategory(createdNote?.category || payload.category),
          isPinned: Boolean(createdNote?.isPinned),
          createdAt: createdNote?.createdAt || new Date().toISOString()
        };

        noteSnapshot = [normalizedNote, ...noteSnapshot];
        addNotification(
          'note_created',
          {
            id: normalizedNote.id,
            title: normalizedNote.title,
            category: normalizedNote.category,
            itemType: 'note'
          },
          null,
          true
        );
        trackNotification(normalizedNote.id, 'note', 'sent', 'note_created');
        created.push(`Note created: ${normalizedNote.title}`);
      }
    }

    return created;
  };

  const handleSend = async () => {
    const prompt = inputValue.trim();
    if (!prompt) return;

    const userMessage = {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    const nextMessagesForContext = [...messages, userMessage];
    updateActiveConversationMessages(nextMessagesForContext);
    setInputValue('');
    setIsTyping(true);
    setShowHistory(false);

    try {
      const liveGoals = goals.length > 0 ? goals : getGoals();
      const liveTasks = tasks.length > 0 ? tasks : contextTasks;
      let liveNotes = [];

      try {
        const notesPayload = await backendService.getNotes();
        liveNotes = Array.isArray(notesPayload)
          ? notesPayload.slice(0, 30).map((note) => ({
              id: note._id || note.id,
              title: note.title || 'Untitled note',
              content: note.content || '',
              category: note.category || 'work',
              isPinned: Boolean(note.isPinned),
              createdAt: note.createdAt || null
            }))
          : [];
      } catch (error) {
        console.warn('Failed to load notes context for AI chat:', error);
      }

      // Prepare context for AI
      const context = {
        goals: liveGoals,
        tasks: liveTasks,
        notes: liveNotes,
        ...userContext,
        previousMessages: nextMessagesForContext.map(m => ({
          role: m.role,
          content: m.content
        }))
      };

      const response = await AiService.chatWithActions(prompt, context);
      const actionResults = await executeActions(response.actions, liveTasks, liveNotes);
      const actionSummary = actionResults.length > 0
        ? `\n\nActions completed:\n- ${actionResults.join('\n- ')}`
        : '';

      const assistantMessage = {
        role: 'assistant',
        content: `${response.message}${actionSummary}`,
        timestamp: new Date()
      };

      updateActiveConversationMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);

      const isProxyUnavailable =
        error instanceof TypeError ||
        /Failed to fetch|NetworkError|ERR_CONNECTION_REFUSED/i.test(error?.message || '');
      
      const errorMessage = {
        role: 'assistant',
        content: isProxyUnavailable
          ? "I can't reach the backend AI endpoint right now. Make sure your backend server is running and try again."
          : "I'm sorry, I encountered an error processing your request.",
        timestamp: new Date(),
        isError: true
      };

      updateActiveConversationMessages((prev) => [...prev, errorMessage]);
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

  const formatSessionTime = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getSessionPreview = (session) => {
    const lastUserMessage = [...(session.messages || [])]
      .reverse()
      .find((message) => message.role === 'user' && message.content?.trim());
    if (!lastUserMessage) {
      return 'No user messages yet';
    }

    const normalized = lastUserMessage.content.trim().replace(/\s+/g, ' ');
    return normalized.length > 42 ? `${normalized.slice(0, 42)}...` : normalized;
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
        onClick={() => {
          setIsOpen(true);
          setShowHistory(false);
        }}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-[#3D9B9B] to-[#4AB3B3] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Open AI Assistant"
      >
        <FiMessageSquare className="text-2xl" />
      </button>
    );
  }

  return (
    //minimized header noxa assistance
   <div
  className={`fixed z-50 flex flex-col transition-all duration-300 
    ${isMinimized 
      ? 'bottom-6 right-6 w-80 h-16' 
      : 'bottom-0 right-0 md:bottom-6 md:right-6 w-full h-full md:w-96 md:h-[600px] md:rounded-2xl'
    } 
    bg-white dark:bg-gray-800 shadow-2xl rounded-t-2xl border border-gray-200 dark:border-gray-400 overflow-hidden
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
            onClick={handleCreateConversation}
            className="p-2 hover:bg-white hover:bg-opacity-60 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="New conversation"
          >
            <FiPlus className="text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className={`p-2 rounded-lg transition-colors ${
              showHistory
                ? 'bg-white bg-opacity-70 dark:bg-gray-700'
                : 'hover:bg-white hover:bg-opacity-60 dark:hover:bg-gray-700'
            }`}
            title="Conversation history"
          >
            <FiClock className="text-gray-600 dark:text-gray-300" />
          </button>
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
            onClick={() => {
              setIsOpen(false);
              setShowHistory(false);
            }}
            className="p-2 hover:bg-white hover:bg-opacity-60 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiX className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 min-h-0 flex flex-col">
          {showHistory && (
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Past conversations
                </p>
                <button
                  onClick={handleCreateConversation}
                  className="text-xs px-2 py-1 rounded-md bg-[#3D9B9B] text-white hover:bg-[#2f8181]"
                >
                  New chat
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {chatSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSelectConversation(session.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                      session.id === activeSessionId
                        ? 'bg-[#3D9B9B]/15 text-[#235e5e]'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium truncate">{session.title || 'New conversation'}</p>
                      <span className="text-[10px] opacity-70 shrink-0">{formatSessionTime(session.updatedAt)}</span>
                    </div>
                    <p className="text-[11px] opacity-70 truncate">{getSessionPreview(session)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {/* Messages */}
            <div className="px-8 py-2 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-2 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.isError
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <p className="text-sm whitespace-pre-wrap break-words flex-1">{message.content}</p>
                      <span className="text-[10px] opacity-70 shrink-0 pt-0.5">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {message.role === 'assistant' && !message.isError && (
                      <div className="flex justify-end mt-1">
                        <button
                          onClick={() => handleCopy(message.content, index)}
                          className="p-1 hover:bg-white hover:bg-opacity-20 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          {copiedIndex === index ? (
                            <FiCheck className="text-xs" />
                          ) : (
                            <FiCopy className="text-xs" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-2">
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
              <div className="px-[10%] pb-2">
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
          <div className="px-[10%] py-2.5 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 resize-none"
                rows="2"
              />
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="rounded-lg px-1.5 py-1"
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
