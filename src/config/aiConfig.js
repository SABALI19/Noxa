// src/config/aiConfig.js

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const AI_PATH = import.meta.env.VITE_AI_PATH || "/api/ai";

export const AI_CONFIG = {
  apiEndpoint: `${API_BASE}${AI_PATH}`,
  model: "claude-sonnet-4-20250514",
  maxTokens: 1000,

  features: {
    predictiveInsights: true,
    smartAutomation: true,
    aiAssistant: true,
    smartReminders: true,
    taskSuggestions: true,
    weeklyReports: true,
  },

  ui: {
    showInsightsOnDashboard: true,
    showInsightsOnGoalsPage: true,
    showAutomationOnGoalsPage: true,
    chatButtonPosition: "bottom-right",
    insightsRefreshInterval: 300000,
  },

  performance: {
    cacheResults: true,
    cacheDuration: 300000,
    maxConcurrentRequests: 3,
    requestTimeout: 30000,
  },

  privacy: {
    sendAnonymousUsageData: false,
    includeGoalTitles: true,
    includeDescriptions: true,
    includeNotes: false,
  },
};

export const validateAIConfig = () => {
  const issues = [];

  if (!AI_CONFIG.apiEndpoint) {
    issues.push("AI endpoint is not configured.");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};

export const isAIAvailable = () => true;

export const sanitizeDataForAI = (data) => {
  const { privacy } = AI_CONFIG;
  if (!data) return data;

  const sanitized = JSON.parse(JSON.stringify(data));

  if (!privacy.includeNotes && sanitized.notes) {
    delete sanitized.notes;
  }

  if (!privacy.includeDescriptions && sanitized.description) {
    sanitized.description = "[Description hidden for privacy]";
  }

  if (!privacy.includeGoalTitles && sanitized.title) {
    sanitized.title = `Goal ${sanitized.id || "X"}`;
  }

  return sanitized;
};

export default AI_CONFIG;
