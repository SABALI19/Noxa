import backendService from "./backendService";
import { getAuthTokens } from "./authService";

const STORAGE_KEY = "noxa_goals";
const GOAL_UPDATE_EVENT = "noxa_goals_updated";

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
const PRIORITY_VALUES = ["low", "medium", "high"];

const defaultGoals = [];

const toApiCategory = (value) => {
  const category = String(value || "").toLowerCase();
  if (category === "work" || category === "career") return "career";
  if (category === "financial" || category === "finance") return "finance";
  if (category === "health") return "health";
  if (category === "fitness") return "fitness";
  if (category === "education") return "education";
  if (category === "personal") return "personal";
  return "other";
};

const toUiCategory = (value) => {
  const category = String(value || "").toLowerCase();
  if (category === "career") return "Work";
  if (category === "finance") return "Financial";
  if (category === "health") return "Health";
  if (category === "fitness") return "Health";
  if (category === "education") return "Education";
  if (category === "personal") return "Personal";
  return "Other";
};

const normalizePriority = (value) => {
  const normalized = String(value || "").toLowerCase();
  return PRIORITY_VALUES.includes(normalized) ? normalized : "medium";
};

const toDateInputString = (value) => {
  if (!value) return "Ongoing";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ongoing";
  return date.toISOString().split("T")[0];
};

const toIsoDateOrUndefined = (value) => {
  if (!value || value === "Ongoing") return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const normalizeMilestones = (milestones = []) => {
  if (!Array.isArray(milestones)) return [];
  return milestones
    .filter((milestone) => milestone && typeof milestone === "object")
    .map((milestone, index) => ({
      id: milestone.id || `milestone-${Date.now()}-${index}`,
      title: milestone.title || "Untitled milestone",
      completed: Boolean(milestone.completed),
      date: toDateInputString(milestone.date || milestone.targetDate),
    }));
};

const normalizeGoal = (goal = {}) => ({
  id: goal.id || goal._id || `goal-${Date.now()}`,
  title: goal.title || "Untitled goal",
  category: goal.category ? toUiCategory(goal.category) : "Personal",
  targetDate: goal.targetDate ? toDateInputString(goal.targetDate) : "Ongoing",
  progress: Number(goal.progress ?? 0),
  milestone: goal.milestone || "",
  nextCheckin: goal.nextCheckin ? toDateInputString(goal.nextCheckin) : "",
  completed: Boolean(goal.completed),
  targetValue: Number(goal.targetValue ?? 100),
  currentValue: Number(goal.currentValue ?? 0),
  unit: goal.unit || "",
  description: goal.description || "",
  priority: normalizePriority(goal.priority),
  milestones: normalizeMilestones(goal.milestones),
  notes: Array.isArray(goal.notes)
    ? goal.notes.map((note, index) => ({
        id: note.id || `note-${Date.now()}-${index}`,
        date: note.date || toDateInputString(note.createdAt),
        content: note.content || "",
      }))
    : [],
  trackingHistory: Array.isArray(goal.trackingHistory)
    ? goal.trackingHistory.map((entry, index) => ({
        id: entry.id || `track-${Date.now()}-${index}`,
        date: entry.date || toDateInputString(entry.createdAt),
        progress: Number(entry.progress ?? 0),
        value: Number(entry.value ?? 0),
        notes: entry.notes || "",
      }))
    : [],
  createdAt: goal.createdAt ? toDateInputString(goal.createdAt) : toDateInputString(new Date()),
  completedDate: goal.completedDate || "",
});

const toApiGoal = (goal = {}) => ({
  title: goal.title || "Untitled goal",
  category: toApiCategory(goal.category),
  targetDate: toIsoDateOrUndefined(goal.targetDate),
  progress: Number(goal.progress ?? 0),
  completed: Boolean(goal.completed),
  targetValue: Number(goal.targetValue ?? 0),
  currentValue: Number(goal.currentValue ?? 0),
  unit: goal.unit || "",
  description: goal.description || "",
  milestones: Array.isArray(goal.milestones)
    ? goal.milestones
        .filter((milestone) => milestone?.title)
        .map((milestone) => ({
          title: milestone.title,
          targetDate: toIsoDateOrUndefined(milestone.date || milestone.targetDate),
          completed: Boolean(milestone.completed),
        }))
    : [],
});

const parseStoredGoals = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...defaultGoals];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...defaultGoals];
    return parsed.map((goal) => normalizeGoal(goal));
  } catch {
    return [...defaultGoals];
  }
};

let goalsCache = parseStoredGoals();

const emitGoalUpdate = () => {
  window.dispatchEvent(new CustomEvent(GOAL_UPDATE_EVENT, { detail: goalsCache }));
};

const persistGoals = (goals) => {
  goalsCache = goals.map((goal) => normalizeGoal(goal));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goalsCache));
  emitGoalUpdate();
};

const hasAuthToken = () => Boolean(getAuthTokens()?.accessToken);
const isObjectId = (value) => OBJECT_ID_RE.test(String(value ?? ""));

const hasGoalChanged = (before, after) =>
  JSON.stringify({
    ...before,
    id: undefined,
  }) !==
  JSON.stringify({
    ...after,
    id: undefined,
  });

const syncGoalChanges = async (previousGoals, nextGoals) => {
  if (!hasAuthToken()) return;

  const previousById = new Map(previousGoals.map((goal) => [String(goal.id), goal]));
  const nextById = new Map(nextGoals.map((goal) => [String(goal.id), goal]));

  const deletions = previousGoals.filter(
    (goal) => isObjectId(goal.id) && !nextById.has(String(goal.id))
  );

  const creations = nextGoals.filter((goal) => !isObjectId(goal.id));
  const updates = nextGoals.filter((goal) => {
    if (!isObjectId(goal.id)) return false;
    const prev = previousById.get(String(goal.id));
    return prev && hasGoalChanged(prev, goal);
  });

  await Promise.all(
    deletions.map((goal) =>
      backendService.deleteGoal(goal.id).catch((error) => {
        console.error("Failed to delete goal:", error);
      })
    )
  );

  await Promise.all(
    updates.map((goal) =>
      backendService
        .updateGoal(goal.id, toApiGoal(goal))
        .then((updated) => {
          const normalized = {
            ...normalizeGoal(updated),
            priority: goal.priority || "medium",
          };
          goalsCache = goalsCache.map((entry) =>
            String(entry.id) === String(goal.id) ? normalized : entry
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(goalsCache));
          emitGoalUpdate();
        })
        .catch((error) => {
          console.error("Failed to update goal:", error);
        })
    )
  );

  await Promise.all(
    creations.map((goal) =>
      backendService
        .createGoal(toApiGoal(goal))
        .then((created) => {
          const normalized = {
            ...normalizeGoal(created),
            priority: goal.priority || "medium",
          };
          goalsCache = goalsCache.map((entry) =>
            String(entry.id) === String(goal.id) ? normalized : entry
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(goalsCache));
          emitGoalUpdate();
        })
        .catch((error) => {
          console.error("Failed to create goal:", error);
        })
    )
  );
};

export const getDefaultGoals = () => defaultGoals;

export const getGoals = () => goalsCache;

export const saveGoals = (goals) => {
  const previousGoals = [...goalsCache];
  persistGoals(goals);
  void syncGoalChanges(previousGoals, goalsCache);
};

export const hydrateGoalsFromBackend = async () => {
  if (!hasAuthToken()) return goalsCache;

  try {
    const payload = await backendService.getGoals();
    const normalized = Array.isArray(payload) ? payload.map((goal) => normalizeGoal(goal)) : [];
    persistGoals(normalized);
    return normalized;
  } catch (error) {
    console.error("Failed to hydrate goals from backend:", error);
    return goalsCache;
  }
};

export const createGoal = (goalData) => {
  const goal = normalizeGoal({
    ...goalData,
    id: goalData.id || `tmp-goal-${Date.now()}`,
  });

  const updatedGoals = [goal, ...goalsCache];
  saveGoals(updatedGoals);
  return goal;
};

export const updateGoal = (goalId, updates) => {
  const updatedGoals = goalsCache.map((goal) =>
    String(goal.id) === String(goalId) ? normalizeGoal({ ...goal, ...updates, id: goal.id }) : goal
  );
  saveGoals(updatedGoals);
  return updatedGoals.find((goal) => String(goal.id) === String(goalId)) || null;
};

export const deleteGoal = (goalId) => {
  const updatedGoals = goalsCache.filter((goal) => String(goal.id) !== String(goalId));
  saveGoals(updatedGoals);
};

export const findGoalByTitle = (title) => {
  if (!title) return null;
  const normalized = title.trim().toLowerCase();
  return goalsCache.find((goal) => goal.title?.trim().toLowerCase() === normalized) || null;
};

export const completeGoalByTitle = (title) => {
  const existing = findGoalByTitle(title);
  if (!existing) return null;
  return updateGoal(existing.id, { completed: true, progress: 100 });
};

export const goalEvents = {
  updated: GOAL_UPDATE_EVENT,
};
