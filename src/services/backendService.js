import { authFetch } from "./authService";

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const extractMessage = (payload, fallback) => {
  if (!payload || typeof payload !== "object") return fallback;
  return payload.message || payload.error?.message || payload.error || fallback;
};

const requestJson = async (path, { method = "GET", body } = {}) => {
  const response = await authFetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(extractMessage(payload, `Request failed: ${response.status}`));
  }

  if (payload && typeof payload === "object" && payload.data !== undefined) {
    return payload.data;
  }

  return payload;
};

export const backendService = {
  // Goals
  getGoals: () => requestJson("/api/v1/goals"),
  createGoal: (goal) => requestJson("/api/v1/goals", { method: "POST", body: goal }),
  updateGoal: (goalId, updates) =>
    requestJson(`/api/v1/goals/${goalId}`, { method: "PATCH", body: updates }),
  deleteGoal: (goalId) => requestJson(`/api/v1/goals/${goalId}`, { method: "DELETE" }),

  // Tasks
  getTasks: () => requestJson("/api/v1/tasks"),
  createTask: (task) => requestJson("/api/v1/tasks", { method: "POST", body: task }),
  updateTask: (taskId, updates) =>
    requestJson(`/api/v1/tasks/${taskId}`, { method: "PATCH", body: updates }),
  deleteTask: (taskId) => requestJson(`/api/v1/tasks/${taskId}`, { method: "DELETE" }),

  // Reminders
  getReminders: () => requestJson("/api/v1/reminders"),
  createReminder: (reminder) =>
    requestJson("/api/v1/reminders", { method: "POST", body: reminder }),
  updateReminder: (reminderId, updates) =>
    requestJson(`/api/v1/reminders/${reminderId}`, { method: "PATCH", body: updates }),
  deleteReminder: (reminderId) => requestJson(`/api/v1/reminders/${reminderId}`, { method: "DELETE" }),
  snoozeReminder: (reminderId, snoozeMinutes = 10) =>
    requestJson(`/api/v1/reminders/${reminderId}/snooze`, {
      method: "POST",
      body: { snoozeMinutes },
    }),

  // Notes
  getNotes: () => requestJson("/api/v1/notes"),
  createNote: (note) => requestJson("/api/v1/notes", { method: "POST", body: note }),
  updateNote: (noteId, updates) =>
    requestJson(`/api/v1/notes/${noteId}`, { method: "PATCH", body: updates }),
  deleteNote: (noteId) => requestJson(`/api/v1/notes/${noteId}`, { method: "DELETE" }),

  // Tracking
  createTrackingEvent: (event) =>
    requestJson("/api/v1/tracking/events", { method: "POST", body: event }),
  getTrackingByItem: (itemType, itemId) => requestJson(`/api/v1/tracking/${itemType}/${itemId}`),
};

export default backendService;
