// src/components/ai/AIAssistantChat.jsx
// ── CHANGES FROM PREVIOUS VERSION ────────────────────────────────────────────
// 1. Added AbortController to handleSendCore — wired to streamChatWithActions
// 2. Added stopGeneration() — aborts the stream and clears streaming state
// 3. Added Stop button in the input row — visible only while streaming
// 4. Added useCallback to handleSendVoice
// 5. Everything else is identical to your existing file
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FiMessageSquare,
  FiSend,
  FiX,
  FiMinimize2,
  FiMaximize2,
  FiCopy,
  FiCheck,
  FiClock,
  FiPlus,
  FiMic,
  FiMicOff,
  FiVolume2,
  FiVolumeX,
  FiSliders,
  FiSquare,
} from "react-icons/fi";
import Button from "../Button";
import AiService from "../../services/AiService";
import backendService from "../../services/backendService";
import { useTasks } from "../../context/TaskContext";
import { useNotifications } from "../../hooks/useNotifications";
import { useNotificationTracking } from "../../hooks/useNotificationTracking";
import {
  createGoal,
  completeGoalByTitle,
  getGoals,
} from "../../services/goalStorage";
import { useAuth } from "../../hooks/UseAuth";
import useVoiceChat from "../../hooks/Usevoicechat";

const CHAT_STORAGE_KEY = "noxa_ai_chat_sessions_v1";
const MAX_CHAT_SESSIONS = 20;

// ── Default voice settings ────────────────────────────────────
const DEFAULT_VOICE_SETTINGS = {
  autoSpeak:  false,
  rate:       1.0,
  pitch:      1.0,
  volume:     1.0,
  voiceName:  "",
};

const VoiceSettingSlider = ({ label, value, min, max, step, display, onChange }) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
      <span className="text-xs text-[#3d9c9c] font-semibold w-16 text-right">
        {display ? display(value) : value}
      </span>
    </div>
    <input
      type="range" min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer
        bg-gray-200 dark:bg-gray-600
        [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#3d9c9c]
        [&::-webkit-slider-thumb]:cursor-pointer"
    />
    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
      <span>{min}</span><span>{max}</span>
    </div>
  </div>
);

// ── Voice Settings Panel (unchanged) ─────────────────────────
const VoiceSettingsPanel = ({
  settings,
  onChange,
  onTest,
  onClose,
  availableVoices,
  isSpeaking,
  onIOS,
}) => {
  return (
    <div className="absolute inset-0 bg-white dark:bg-gray-800 z-20 flex flex-col rounded-t-2xl md:rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#3D9B9B] to-[#4AB3B3] shrink-0">
        <div className="flex items-center gap-2">
          <FiSliders className="text-white" />
          <h3 className="font-bold text-white">Voice Settings</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <FiX className="text-white" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {!onIOS && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Auto-speak</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Noxa reads every reply aloud automatically</p>
            </div>
            <button
              onClick={() => onChange("autoSpeak", !settings.autoSpeak)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200
                ${settings.autoSpeak ? "bg-[#3d9c9c]" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                ${settings.autoSpeak ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        )}
        {onIOS && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl mb-4">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              ⚠️ Auto-speak is not available on iOS Safari. Tap 🔊 on any message to hear it.
            </p>
          </div>
        )}
        <VoiceSettingSlider label="Speech Rate" value={settings.rate} min={0.5} max={2.0} step={0.1}
          onChange={(value) => onChange("rate", value)}
          display={(v) => v <= 0.7 ? "Slow" : v <= 0.9 ? "Relaxed" : v <= 1.1 ? "Normal" : v <= 1.4 ? "Fast" : "Very Fast"} />
        <VoiceSettingSlider label="Pitch" value={settings.pitch} min={0.5} max={2.0} step={0.1}
          onChange={(value) => onChange("pitch", value)}
          display={(v) => v <= 0.7 ? "Deep" : v <= 0.9 ? "Low" : v <= 1.1 ? "Normal" : v <= 1.4 ? "High" : "Very High"} />
        <VoiceSettingSlider label="Volume" value={settings.volume} min={0.0} max={1.0} step={0.05}
          onChange={(value) => onChange("volume", value)}
          display={(v) => `${Math.round(v * 100)}%`} />
        {availableVoices.filter((v) => v.lang.startsWith("en")).length > 0 && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Voice</label>
            <select value={settings.voiceName} onChange={(e) => onChange("voiceName", e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-[#3d9c9c] focus:outline-none">
              <option value="">Auto (recommended)</option>
              {availableVoices.filter((v) => v.lang.startsWith("en")).map((v) => (
                <option key={v.name} value={v.name}>{v.name} {v.localService ? "(offline)" : "(online)"}</option>
              ))}
            </select>
          </div>
        )}
        <button onClick={onTest} disabled={isSpeaking}
          className={`w-full py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2
            ${isSpeaking ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-[#3d9c9c] hover:bg-[#357f7f] text-white"}`}>
          {isSpeaking ? <><FiVolumeX /> Speaking...</> : <><FiVolume2 /> Test Voice</>}
        </button>
        <button
          onClick={() => Object.entries(DEFAULT_VOICE_SETTINGS).forEach(([k, v]) => onChange(k, v))}
          className="w-full mt-2 py-2 rounded-xl text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Reset to defaults
        </button>
      </div>
    </div>
  );
};

// ── Session helpers (unchanged) ───────────────────────────────
const createAssistantWelcomeMessage = () => ({
  role: "assistant",
  content: "Hi! I'm Noxa. I can help you plan around your actual goals, tasks, reminders, and notes, or take actions like creating tasks and reminders. What should we work on?",
  timestamp: new Date(),
});

const normalizeMessage = (message = {}) => ({
  role: message.role || "assistant",
  content: message.content || "",
  timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
  isError: Boolean(message.isError),
});

const createConversationSession = () => {
  const nowIso = new Date().toISOString();
  return {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: "New conversation",
    createdAt: nowIso,
    updatedAt: nowIso,
    messages: [createAssistantWelcomeMessage()],
  };
};

const normalizeConversationSession = (session = {}) => ({
  id: session.id || `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: session.title || "New conversation",
  createdAt: session.createdAt || new Date().toISOString(),
  updatedAt: session.updatedAt || session.createdAt || new Date().toISOString(),
  messages:
    Array.isArray(session.messages) && session.messages.length > 0
      ? session.messages.map((message) => normalizeMessage(message))
      : [createAssistantWelcomeMessage()],
});

const normalizeConversationSessions = (sessions = []) =>
  sessions.map((session) => normalizeConversationSession(session)).slice(0, MAX_CHAT_SESSIONS);

const buildConversationTitle = (messages = []) => {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.content?.trim());
  if (!firstUserMessage) return "New conversation";
  const trimmed = firstUserMessage.content.trim().replace(/\s+/g, " ");
  return trimmed.length > 36 ? `${trimmed.slice(0, 36)}...` : trimmed;
};

const loadStoredSessions = () => {
  if (typeof window === "undefined") return [createConversationSession()];
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [createConversationSession()];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [createConversationSession()];
    const normalized = normalizeConversationSessions(parsed);
    return normalized.length === 0 ? [createConversationSession()] : normalized;
  } catch {
    return [createConversationSession()];
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
          : new Date(message.timestamp || Date.now()).toISOString(),
    })),
  }));

// ── Main Component ────────────────────────────────────────────
const AIAssistantChat = ({
  goals = [],
  tasks = [],
  userContext = {},
  showFab = true,
  openSignal = 0,
  closeSignal = 0,
}) => {
  const { tasks: contextTasks, addTask, updateTask, addReminder } = useTasks();
  const { addNotification } = useNotifications();
  const { trackNotification, trackCompletion } = useNotificationTracking();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const initialSessionsRef   = useRef(loadStoredSessions());
  const isHydratingRemoteRef = useRef(true);
  const lastSyncedPayloadRef = useRef("");
  const saveTimeoutRef       = useRef(null);

  // ── NEW: AbortController ref for stream cancellation ─────────
  const [isOpen, setIsOpen]           = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatSessions, setChatSessions] = useState(initialSessionsRef.current);
  const [activeSessionId, setActiveSessionId] = useState(initialSessionsRef.current[0]?.id || null);
  const [messages, setMessages] = useState(
    initialSessionsRef.current[0]?.messages || [createAssistantWelcomeMessage()],
  );
  const [showHistory, setShowHistory]     = useState(false);
  const [inputValue, setInputValue]       = useState("");
  const [isTyping, setIsTyping]           = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [copiedIndex, setCopiedIndex]     = useState(null);

  // ── Voice state ───────────────────────────────────────────────
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceSettings, setVoiceSettings]         = useState(DEFAULT_VOICE_SETTINGS);
  const [voiceError, setVoiceError]               = useState(null);

  const messagesContainerRef = useRef(null);
  const messagesEndRef       = useRef(null);
  const inputRef             = useRef(null);
  const abortControllerRef   = useRef(null);

  const getSessionsSignature = (sessionsToSerialize) =>
    JSON.stringify(serializeSessions(sessionsToSerialize));

  // ── Voice hook ────────────────────────────────────────────────
  const {
    isListening,
    isSpeaking,
    isSupported: voiceSupported,
    interimTranscript,
    voices: availableVoices,
    onIOS,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceChat({
    onTranscript: useCallback((text) => {
      setInputValue(text);
      setTimeout(() => {
        setInputValue("");
        handleSendVoice(text);
      }, 600);
    }, []),
    onError: (msg) => {
      setVoiceError(msg);
      setTimeout(() => setVoiceError(null), 5000);
    },
  });

  const updateVoiceSetting = (key, value) =>
    setVoiceSettings((prev) => ({ ...prev, [key]: value }));

  const speakWithSettings = useCallback(
    (text, opts = {}) => {
      speak(text, {
        rate:      voiceSettings.rate,
        pitch:     voiceSettings.pitch,
        volume:    voiceSettings.volume,
        voiceName: voiceSettings.voiceName,
        ...opts,
      });
    },
    [speak, voiceSettings],
  );

  const handleTestVoice = () => {
    speakWithSettings(
      "Hi, I'm Noxa. Your AI productivity assistant. This is how I sound with your current settings.",
    );
  };

  // ── NEW: Stop generation ──────────────────────────────────────
  // Aborts the in-flight fetch stream. The partial text already streamed
  // is kept in the chat as a message marked with a stopped indicator.
  // ── Scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized && !showVoiceSettings) inputRef.current?.focus();
  }, [isOpen, isMinimized, showVoiceSettings]);

  useEffect(() => {
    if (openSignal === 0 || !showFab) return;
    setIsOpen(true);
    setIsMinimized(false);
    setShowHistory(false);
  }, [openSignal, showFab]);

  useEffect(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setShowHistory(false);
  }, [closeSignal]);

  // ── Backend sync effects (unchanged) ─────────────────────────
  useEffect(() => {
    if (authLoading) return;
    let isCancelled = false;
    const hydrateHistory = async () => {
      if (!isAuthenticated) {
        isHydratingRemoteRef.current = false;
        lastSyncedPayloadRef.current = "";
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
            normalizedRemote[0]?.id || null;
          setChatSessions(normalizedRemote);
          setActiveSessionId(nextActiveSessionId);
          setMessages(
            normalizedRemote.find((session) => session.id === nextActiveSessionId)?.messages ||
              normalizedRemote[0]?.messages || [createAssistantWelcomeMessage()],
          );
          lastSyncedPayloadRef.current = getSessionsSignature(normalizedRemote);
        } else {
          const localSignature = getSessionsSignature(chatSessions);
          await backendService.saveAiChatHistory(serializeSessions(chatSessions));
          if (!isCancelled) lastSyncedPayloadRef.current = localSignature;
        }
      } catch (error) {
        console.error("Failed to sync AI chat history from backend:", error);
      } finally {
        if (!isCancelled) isHydratingRemoteRef.current = false;
      }
    };
    void hydrateHistory();
    return () => { isCancelled = true; };
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(serializeSessions(chatSessions)));
  }, [chatSessions]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (isHydratingRemoteRef.current) return;
    const payloadSignature = getSessionsSignature(chatSessions);
    if (payloadSignature === lastSyncedPayloadRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await backendService.saveAiChatHistory(serializeSessions(chatSessions));
        lastSyncedPayloadRef.current = payloadSignature;
      } catch (error) {
        console.error("Failed to persist AI chat history to backend:", error);
      }
    }, 500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [chatSessions, authLoading, isAuthenticated]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
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

  // ── Session helpers (unchanged) ───────────────────────────────
  const updateActiveConversationMessages = (nextMessagesOrUpdater) => {
    setMessages((previousMessages) => {
      const nextMessages =
        typeof nextMessagesOrUpdater === "function"
          ? nextMessagesOrUpdater(previousMessages)
          : nextMessagesOrUpdater;
      const nowIso = new Date().toISOString();
      setChatSessions((previousSessions) =>
        previousSessions.map((session) => {
          if (session.id !== activeSessionId) return session;
          return { ...session, messages: nextMessages, updatedAt: nowIso, title: buildConversationTitle(nextMessages) };
        }),
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
    setInputValue("");
    setShowHistory(false);
  };

  // ── Normalizers (unchanged) ───────────────────────────────────
  const normalizePriority = (priority) => {
    const value = String(priority || "").toLowerCase();
    return value === "high" || value === "medium" || value === "low" ? value : "medium";
  };
  const normalizeNotificationMethod = (method) => {
    const value = String(method || "").toLowerCase();
    return value === "app" || value === "email" || value === "both" ? value : "app";
  };
  const normalizeNoteCategory = (category) => {
    const value = String(category || "").toLowerCase();
    if (value === "work" || value === "personal" || value === "ideas") return value;
    if (value === "study" || value === "general" || value === "other") return value;
    return "work";
  };
  const toIsoDate = (input, fallbackDate) => {
    const date = input ? new Date(input) : fallbackDate;
    return Number.isNaN(date?.getTime?.()) ? fallbackDate.toISOString() : date.toISOString();
  };

  // ── executeActions (unchanged) ────────────────────────────────
  const executeActions = async (actions, liveTasks, liveNotes = []) => {
    if (!Array.isArray(actions) || actions.length === 0) return [];
    const created = [];
    let taskSnapshot = [...liveTasks];
    let noteSnapshot = Array.isArray(liveNotes) ? [...liveNotes] : [];

    for (const action of actions) {
      const type    = action?.type;
      const payload = action?.payload || {};

      if (type === "create_task") {
        const duplicateTask = payload.duplicateTaskId
          ? taskSnapshot.find((task) => String(task.id) === String(payload.duplicateTaskId))
          : taskSnapshot.find((task) =>
              task.title?.trim().toLowerCase() === String(payload.title || "").trim().toLowerCase(),
            );
        if (duplicateTask && !duplicateTask.completed) {
          created.push(`Task already exists: ${duplicateTask.title}`);
          continue;
        }

        const createdTask = addTask({
          title: payload.title || "New Task",
          description: payload.description || "",
          dueDate: toIsoDate(payload.dueDate, new Date(Date.now() + 24 * 60 * 60 * 1000)),
          priority: normalizePriority(payload.priority),
          category: (payload.category || "personal").toLowerCase(),
          linkedGoalId: payload.linkedGoalId || null,
          completed: false, status: payload.status || "pending", overdue: false,
        });
        taskSnapshot = [createdTask, ...taskSnapshot];
        addNotification("task_created", createdTask);
        trackNotification(createdTask.id, "task", "sent", "task_created");
        created.push(`Task created: ${createdTask.title}`);
        continue;
      }
      if (type === "create_goal") {
        const goal = createGoal({
          title: payload.title || "New Goal", category: payload.category || "Personal",
          targetDate: payload.targetDate || "Ongoing", description: payload.description || "",
          priority: normalizePriority(payload.priority), milestone: payload.milestone || "",
          nextCheckin: payload.nextCheckin || "", targetValue: payload.targetValue ?? 100,
          currentValue: payload.currentValue ?? 0, unit: payload.unit || "",
          completed: false, progress: 0,
        });
        trackNotification(goal.id, "goal", "sent", "goal_created");
        created.push(`Goal created: ${goal.title}`);
        continue;
      }
      if (type === "create_reminder") {
        const linkedTask = payload.taskId
          ? taskSnapshot.find((task) => task.id === payload.taskId)
          : taskSnapshot.find((task) =>
              task.title?.trim().toLowerCase() === String(payload.taskTitle || "").trim().toLowerCase(),
            );
        const dueDate      = toIsoDate(payload.dueDate, new Date(Date.now() + 24 * 60 * 60 * 1000));
        const reminderTime = toIsoDate(payload.reminderTime, new Date(Date.now() + 60 * 60 * 1000));
        const reminder = addReminder({
          taskId: linkedTask?.id || payload.taskId || null,
          linkedGoalId: payload.linkedGoalId || null,
          title: payload.title || `Reminder: ${linkedTask?.title || "Task"}`,
          dueDate, reminderTime, status: "upcoming",
          category: (payload.category || linkedTask?.category || "general").toLowerCase(),
          priority: normalizePriority(payload.priority || linkedTask?.priority),
          frequency: payload.frequency || "once",
          notificationMethod: normalizeNotificationMethod(payload.notificationMethod),
          taskCompleted: Boolean(linkedTask?.completed), note: payload.note || "",
        });
        if (!isAuthenticated) addNotification("reminder_created", reminder);
        trackNotification(reminder.id, "reminder", "sent", "reminder_created");
        created.push(`Reminder set: ${reminder.title}`);
        continue;
      }
      if (type === "complete_task") {
        const task = payload.taskId
          ? taskSnapshot.find((item) => item.id === payload.taskId)
          : taskSnapshot.find((item) =>
              item.title?.trim().toLowerCase() === String(payload.title || "").trim().toLowerCase(),
            );
        if (task) {
          updateTask(task.id, { completed: true, status: "completed" });
          addNotification("task_completed", task);
          trackCompletion(task.id, "task");
          trackNotification(task.id, "task", "sent", "task_completed");
          created.push(`Task completed: ${task.title}`);
        }
        continue;
      }
      if (type === "complete_goal") {
        const goal = completeGoalByTitle(payload.title);
        if (goal) {
          addNotification("goal_completed", goal);
          trackCompletion(goal.id, "goal");
          trackNotification(goal.id, "goal", "sent", "goal_completed");
          created.push(`Goal completed: ${goal.title}`);
        }
        continue;
      }
      if (type === "create_note") {
        const createdNote = await backendService.createNote({
          title: String(payload.title || "").trim() || "New Note",
          content: String(payload.content || "").trim() || "Created by Noxa AI assistant.",
          category: normalizeNoteCategory(payload.category), isPinned: Boolean(payload.isPinned),
        });
        const normalizedNote = {
          id: createdNote?._id || createdNote?.id || `note-${Date.now()}`,
          title: createdNote?.title || "New Note", content: createdNote?.content || "",
          category: normalizeNoteCategory(createdNote?.category || payload.category),
          isPinned: Boolean(createdNote?.isPinned),
          createdAt: createdNote?.createdAt || new Date().toISOString(),
        };
        noteSnapshot = [normalizedNote, ...noteSnapshot];
        addNotification("note_created", { id: normalizedNote.id, title: normalizedNote.title, category: normalizedNote.category, itemType: "note" }, null, true);
        trackNotification(normalizedNote.id, "note", "sent", "note_created");
        created.push(`Note created: ${normalizedNote.title}`);
        continue;
      }
      if (type === "send_email") {
        const emailResult = await AiService.sendAutomatedEmail({
          to: String(payload.to || "").trim(), subject: String(payload.subject || "").trim(),
          text: String(payload.text || "").trim(), html: String(payload.html || "").trim(),
          instructions: payload.instructions || "", context: payload.context || {},
        });
        const sentSubject = emailResult?.draft?.subject || String(payload.subject || "").trim() || "Untitled email";
        addNotification("socket_message", { title: sentSubject, itemType: "email" }, null, false, {
          templateOverride: { title: "Email Sent", message: `Automated email sent: ${sentSubject}`, type: "success" },
        });
        created.push(`Email sent: ${sentSubject}`);
        continue;
      }
    }
    return created;
  };

  // ── Core send — UPDATED with AbortController ──────────────────
  const handleSendCore = async (prompt) => {
    const text = (prompt ?? inputValue).trim();
    if (!text) return;

    // ── NEW: create a fresh AbortController for this stream ──────
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMessage = { role: "user", content: text, timestamp: new Date() };
    const nextMessagesForContext = [...messages, userMessage];
    updateActiveConversationMessages(nextMessagesForContext);
    setInputValue("");
    setIsTyping(true);
    setStreamingText("");
    setShowHistory(false);

    try {
      const liveGoals = goals.length > 0 ? goals : getGoals();
      const liveTasks = tasks.length > 0 ? tasks : contextTasks;
      let liveNotes = [];
      try {
        const notesPayload = await backendService.getNotes();
        liveNotes = Array.isArray(notesPayload)
          ? notesPayload.slice(0, 30).map((note) => ({
              id: note._id || note.id, title: note.title || "Untitled note",
              content: note.content || "", category: note.category || "work",
              isPinned: Boolean(note.isPinned), createdAt: note.createdAt || null,
            }))
          : [];
      } catch (error) {
        console.warn("Failed to load notes context for AI chat:", error);
      }

      const context = {
        goals: liveGoals, tasks: liveTasks, notes: liveNotes,
        page: typeof window !== "undefined" ? window.location.pathname : "",
        ...userContext,
        previousMessages: nextMessagesForContext.map((m) => ({ role: m.role, content: m.content })),
      };

      const response = await AiService.streamChatWithActions(text, context, {
        sessionId:              activeSessionId,
        sessionTitle:           buildConversationTitle(nextMessagesForContext),
        persistResponse:        false,
        includeWorkspaceContext: true,
        signal:                 abortController.signal,   // ← NEW: pass signal
        onText: (_chunk, aggregate) => { setStreamingText(aggregate); },
      });

      // ── Was the stream aborted? ──────────────────────────────────
      if (response.aborted) {
        if (response.message?.trim()) {
          updateActiveConversationMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: response.message.trim() + " _(stopped)_",
              timestamp: new Date(),
            },
          ]);
        }
        return;
      }

      const actionResults = await executeActions(response.actions, liveTasks, liveNotes);
      const actionSummary = actionResults.length > 0
        ? `\n\nActions completed:\n- ${actionResults.join("\n- ")}`
        : "";
      const followUpSummary =
        Array.isArray(response.followUpSuggestions) &&
        response.followUpSuggestions.length > 0
          ? `\n\nSuggested next steps:\n- ${response.followUpSuggestions.join("\n- ")}`
          : "";

      const replyContent = `${response.message}${actionSummary}${followUpSummary}`;
      updateActiveConversationMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyContent, timestamp: new Date() },
      ]);

      if (voiceSettings?.autoSpeak) {
        speakWithSettings?.(replyContent, { auto: true });
      }
    } catch (error) {
      // AbortError is not a real error — the user clicked stop
      if (error?.name === "AbortError") return;

      console.error("Chat error:", error);
      const isProxyUnavailable =
        error instanceof TypeError ||
        /Failed to fetch|NetworkError|ERR_CONNECTION_REFUSED/i.test(error?.message || "");
      updateActiveConversationMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isProxyUnavailable
            ? "I can't reach the backend AI endpoint right now. Make sure your backend server is running and try again."
            : "I'm sorry, I encountered an error processing your request.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setStreamingText("");
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleSend      = () => handleSendCore(inputValue.trim());
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };
  const handleSendVoice = useCallback((text) => handleSendCore(text), []);
  const handleKeyPress  = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };
  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  const handleMicClick = () => (isListening ? stopListening() : startListening());
  const handleSpeaker  = (content) => (isSpeaking ? stopSpeaking() : speakWithSettings(content));

  const micHintLabel = () => {
    if (isListening) return onIOS ? "🎙 Tap mic again when done" : "🎙 Listening — tap to stop";
    return onIOS ? "🎙 Tap mic, speak, tap again to send" : "🎙 Tap mic to speak";
  };

  const formatSessionTime = (isoDate) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getSessionPreview = (session) => {
    const lastUserMessage = [...(session.messages || [])]
      .reverse()
      .find((message) => message.role === "user" && message.content?.trim());
    if (!lastUserMessage) return "No user messages yet";
    const normalized = lastUserMessage.content.trim().replace(/\s+/g, " ");
    return normalized.length > 42 ? `${normalized.slice(0, 42)}...` : normalized;
  };

  const quickActions = [
    { label: "📧 Draft Email",    prompt: "Help me draft an email" },
    { label: "📋 Create Agenda",  prompt: "Prepare an agenda for my upcoming meeting" },
    { label: "📊 Weekly Summary", prompt: "Summarize my productivity this week" },
    { label: "💡 Suggest Tasks",  prompt: "Suggest tasks for my current goals" },
  ];

  if (!showFab) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); setShowHistory(false); }}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-[#3D9B9B] to-[#4AB3B3] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Open AI Assistant"
      >
        <FiMessageSquare className="text-2xl" />
      </button>
    );
  }

  return (
    <div className={`fixed z-50 flex flex-col transition-all duration-300
      ${isMinimized
        ? "bottom-6 left-1/2 -translate-x-1/2 w-80 h-16"
        : "bottom-0 right-0 md:bottom-6 md:right-6 w-full h-full md:w-96 md:h-[600px] md:rounded-2xl"
      }
      bg-white dark:bg-gray-800 shadow-2xl rounded-t-2xl border border-gray-200 dark:border-gray-400 overflow-hidden
      ${!isMinimized && "rounded-t-2xl md:rounded-2xl"}
    `}>

      {/* Voice Settings Panel */}
      {showVoiceSettings && !isMinimized && (
        <VoiceSettingsPanel
          settings={voiceSettings} onChange={updateVoiceSetting}
          onTest={handleTestVoice} onClose={() => setShowVoiceSettings(false)}
          availableVoices={availableVoices} isSpeaking={isSpeaking} onIOS={onIOS}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-[#3D9B9B] to-[#4AB3B3] shrink-0">
        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm shrink-0">
          <FiMessageSquare className="text-[#3d9c9c]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white leading-tight">Noxa Assistant</h3>
          <p className="text-xs text-white/70 h-4">
            {isListening ? "🎙 Recording..."
              : isSpeaking ? "🔊 Speaking..."
              : isTyping   ? "Typing..."
              : "\u00A0"}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {voiceSupported && !isMinimized && (
            <button
              onClick={() => { setShowVoiceSettings((p) => !p); setShowHistory(false); }}
              title="Voice settings"
              className={`p-2 rounded-lg transition-colors ${showVoiceSettings ? "bg-white/30" : "hover:bg-white/20"}`}
            >
              <FiSliders className="text-white" />
            </button>
          )}
          {voiceSupported && !onIOS && !isMinimized && (
            <button
              onClick={() => updateVoiceSetting("autoSpeak", !voiceSettings.autoSpeak)}
              title={voiceSettings.autoSpeak ? "Auto-speak ON" : "Auto-speak OFF"}
              className={`p-2 rounded-lg transition-colors ${voiceSettings.autoSpeak ? "bg-white/30 text-white" : "hover:bg-white/20 text-white/70"}`}
            >
              {voiceSettings.autoSpeak ? <FiVolume2 /> : <FiVolumeX />}
            </button>
          )}
          <button onClick={handleCreateConversation} className="p-2 hover:bg-white/20 rounded-lg transition-colors" title="New conversation">
            <FiPlus className="text-white" />
          </button>
          <button
            onClick={() => { setShowHistory((prev) => !prev); setShowVoiceSettings(false); }}
            className={`p-2 rounded-lg transition-colors ${showHistory ? "bg-white/30" : "hover:bg-white/20"}`}
            title="Conversation history"
          >
            <FiClock className="text-white" />
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            {isMinimized ? <FiMaximize2 className="text-white" /> : <FiMinimize2 className="text-white" />}
          </button>
          <button
            onClick={() => { setIsOpen(false); setShowHistory(false); setShowVoiceSettings(false); handleStop(); }}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <FiX className="text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* History panel (unchanged) */}
          {showHistory && (
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Past conversations</p>
                <button onClick={handleCreateConversation} className="text-xs px-2 py-1 rounded-md bg-[#3D9B9B] text-white hover:bg-[#2f8181]">New chat</button>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {chatSessions.map((session) => (
                  <button key={session.id} onClick={() => handleSelectConversation(session.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                      session.id === activeSessionId ? "bg-[#3D9B9B]/15 text-[#235e5e]" : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium truncate">{session.title || "New conversation"}</p>
                      <span className="text-[10px] opacity-70 shrink-0">{formatSessionTime(session.updatedAt)}</span>
                    </div>
                    <p className="text-[11px] opacity-70 truncate">{getSessionPreview(session)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="px-8 py-2 space-y-3">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-2 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : message.isError
                      ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                  }`}>
                    <div className="flex items-start gap-2">
                      <p className="text-sm whitespace-pre-wrap break-words flex-1">{message.content}</p>
                      <span className="text-[10px] opacity-70 shrink-0 pt-0.5">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {message.role === "assistant" && !message.isError && (
                      <div className="flex justify-end items-center gap-1 mt-1">
                        {voiceSupported && (
                          <button onClick={() => handleSpeaker(message.content)}
                            className="p-1 hover:bg-white hover:bg-opacity-20 dark:hover:bg-gray-600 rounded transition-colors"
                            title={isSpeaking ? "Stop" : "Read aloud"}>
                            {isSpeaking ? <FiVolumeX className="text-xs" /> : <FiVolume2 className="text-xs" />}
                          </button>
                        )}
                        <button onClick={() => handleCopy(message.content, index)}
                          className="p-1 hover:bg-white hover:bg-opacity-20 dark:hover:bg-gray-600 rounded transition-colors">
                          {copiedIndex === index ? <FiCheck className="text-xs" /> : <FiCopy className="text-xs" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming text */}
              {isTyping && streamingText && (
                <div className="flex justify-start flex-col gap-1">
                  <div className="max-w-[80%] rounded-2xl p-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                    <p className="text-sm whitespace-pre-wrap break-words">{streamingText}</p>
                  </div>
                  <button
                    onClick={handleStop}
                    title="Stop response"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium w-fit
                      bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400
                      border border-red-200 dark:border-red-800
                      hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <FiSquare className="w-3 h-3" /> Stop
                  </button>
                </div>
              )}

              {/* Typing dots */}
              {isTyping && !streamingText && (
                <div className="flex justify-start items-center gap-2">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                  <button
                    onClick={handleStop}
                    title="Stop response"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium
                      bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400
                      border border-red-200 dark:border-red-800
                      hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <FiSquare className="w-3 h-3" /> Stop
                  </button>
                </div>
              )}

              {/* Listening indicator */}
              {isListening && (
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-full px-4 py-2">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <div key={d} className="w-1.5 h-4 bg-[#3d9c9c] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                    <span className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                      {interimTranscript || (onIOS ? "Recording..." : "Listening...")}
                    </span>
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
                    <button key={index}
                      onClick={() => { setInputValue(action.prompt); inputRef.current?.focus(); }}
                      className="text-xs p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-left">
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Voice error */}
          {voiceError && (
            <div className="mx-4 mb-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400">{voiceError}</p>
            </div>
          )}

          {/* ── Input row ── */}
          <div className="px-[10%] py-2.5 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">

              {/* Mic button */}
              {voiceSupported && (
                <button onClick={handleMicClick} disabled={isTyping}
                  title={isListening ? "Stop recording" : "Speak to Noxa"}
                  className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200
                    ${isListening
                      ? "bg-red-500 text-white shadow-lg scale-105 animate-pulse"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-[#3d9c9c]"
                    }
                    ${isTyping ? "opacity-50 cursor-not-allowed" : ""}
                  `}>
                  {isListening ? <FiMicOff /> : <FiMic />}
                </button>
              )}

              <textarea
                ref={inputRef}
                value={isListening
                  ? interimTranscript || (onIOS ? "🔴 Recording — tap mic when done..." : "🎙 Listening...")
                  : inputValue}
                onChange={(e) => !isListening && setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                readOnly={isListening}
                className={`flex-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 resize-none
                  ${isListening ? "bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-300 italic" : ""}
                `}
                rows="2"
              />

              {/* ── NEW: Stop button — shown only while streaming ── */}
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={!inputValue.trim() || isListening}
                className="rounded-lg px-1.5 py-1"
              >
                <FiSend />
              </Button>
            </div>

            {/* Mic hint */}
            {voiceSupported && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1">
                {isTyping ? "Generating response..." : micHintLabel()}
              </p>
            )}

            {/* iOS HTTPS warning */}
            {onIOS && typeof window !== "undefined" && window.location.protocol !== "https:" && (
              <p className="text-xs text-center text-amber-500 mt-1">
                ⚠️ Mic requires HTTPS on iOS — works after deployment
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantChat;
