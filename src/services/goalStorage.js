const STORAGE_KEY = 'noxa_goals';
const GOAL_UPDATE_EVENT = 'noxa_goals_updated';

const defaultGoals = [
  {
    id: 1,
    title: "Read 24 books this year",
    category: "Personal",
    targetDate: "Dec 31, 2024",
    progress: 75,
    milestone: "18/24 books",
    nextCheckin: "Dec 20",
    completed: false,
    targetValue: 24,
    currentValue: 18,
    unit: "books",
    description: "Reading 2 books per month to improve knowledge and relax",
    priority: "medium",
  },
  {
    id: 2,
    title: "Exercise 3x per week",
    category: "Health",
    targetDate: "Ongoing",
    progress: 67,
    milestone: "27 workouts this week",
    nextCheckin: "Dec 16",
    completed: false,
    targetValue: 36,
    currentValue: 27,
    unit: "workouts",
    description: "Maintain consistent exercise routine for better health",
    priority: "high",
  },
  {
    id: 3,
    title: "Learn Spanish Conversation",
    category: "Education",
    targetDate: "Mar 15, 2024",
    progress: 75,
    milestone: "Intermediate level",
    nextCheckin: "Dec 20",
    completed: false,
    targetValue: 100,
    currentValue: 75,
    unit: "proficiency",
    description: "Achieve conversational fluency in Spanish",
    priority: "medium",
  },
  {
    id: 4,
    title: "Complete project documentation",
    category: "Work",
    targetDate: "Dec 12, 2024",
    progress: 100,
    completed: true,
    targetValue: 100,
    currentValue: 100,
    unit: "pages",
    description: "Document all project processes and outcomes",
    priority: "low",
  },
  {
    id: 5,
    title: "Save $5000",
    category: "Financial",
    targetDate: "Dec 31, 2024",
    progress: 30,
    milestone: "$1500 saved",
    nextCheckin: "Jan 15, 2025",
    completed: false,
    targetValue: 5000,
    currentValue: 1500,
    unit: "dollars",
    description: "Build emergency fund savings",
    priority: "high",
  },
  {
    id: 6,
    title: "Write a new book",
    category: "Personal",
    targetDate: "Jun 30, 2025",
    progress: 46,
    milestone: "Chapter 1 completed",
    nextCheckin: "Feb 1, 2025",
    completed: false,
    targetValue: 100,
    currentValue: 46,
    unit: "chapters",
    description: "Complete first draft of new novel",
    priority: "medium",
  },
];

export const getDefaultGoals = () => defaultGoals;

export const getGoals = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultGoals;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return defaultGoals;
  } catch (error) {
    console.error('Failed to parse stored goals:', error);
    return defaultGoals;
  }
};

export const saveGoals = (goals) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  window.dispatchEvent(new CustomEvent(GOAL_UPDATE_EVENT, { detail: goals }));
};

export const createGoal = (goalData) => {
  const goals = getGoals();
  const nextId = goals.length > 0 ? Math.max(...goals.map((goal) => goal.id || 0)) + 1 : 1;

  const goal = {
    id: nextId,
    title: goalData.title || 'Untitled goal',
    category: goalData.category || 'Personal',
    targetDate: goalData.targetDate || 'Ongoing',
    progress: goalData.progress ?? 0,
    milestone: goalData.milestone || '',
    nextCheckin: goalData.nextCheckin || '',
    completed: Boolean(goalData.completed),
    targetValue: goalData.targetValue ?? 100,
    currentValue: goalData.currentValue ?? 0,
    unit: goalData.unit || '',
    description: goalData.description || '',
    priority: goalData.priority || 'medium',
    milestones: goalData.milestones || [],
  };

  const updatedGoals = [goal, ...goals];
  saveGoals(updatedGoals);
  return goal;
};

export const updateGoal = (goalId, updates) => {
  const goals = getGoals();
  const updatedGoals = goals.map((goal) =>
    goal.id === goalId ? { ...goal, ...updates } : goal
  );
  saveGoals(updatedGoals);
  return updatedGoals.find((goal) => goal.id === goalId) || null;
};

export const findGoalByTitle = (title) => {
  if (!title) return null;
  const normalized = title.trim().toLowerCase();
  return getGoals().find((goal) => goal.title?.trim().toLowerCase() === normalized) || null;
};

export const completeGoalByTitle = (title) => {
  const existing = findGoalByTitle(title);
  if (!existing) return null;
  return updateGoal(existing.id, { completed: true, progress: 100 });
};

export const goalEvents = {
  updated: GOAL_UPDATE_EVENT,
};
