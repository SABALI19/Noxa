// src/config/aiConfig.js
/**
 * AI Configuration for Noxa
 * 
 * IMPORTANT SETUP INSTRUCTIONS:
 * 
 * 1. Get your Anthropic API key from: https://console.anthropic.com/
 * 2. Create a .env file in your project root
 * 3. Add: REACT_APP_ANTHROPIC_API_KEY=your_api_key_here
 * 4. Restart your development server
 * 
 * For production, set the environment variable in your hosting platform:
 * - Vercel: Project Settings > Environment Variables
 * - Netlify: Site Settings > Build & Deploy > Environment
 * - AWS: Systems Manager > Parameter Store
 */

export const AI_CONFIG = {
  // API Configuration
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY, // Load from environment variable,
  apiEndpoint: 'https://api.anthropic.com/v1/messages',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 1000,
  
  // Feature Flags - Enable/Disable AI features
  features: {
    predictiveInsights: true,      // Show AI predictions about goals/tasks
    smartAutomation: true,          // Show automation suggestions
    aiAssistant: true,              // Enable chat assistant
    smartReminders: true,           // Generate AI-powered reminders
    taskSuggestions: true,          // Suggest tasks for goals
    weeklyReports: true,            // Generate weekly summaries
  },
  
  // UI Configuration
  ui: {
    showInsightsOnDashboard: true,
    showInsightsOnGoalsPage: true,
    showAutomationOnGoalsPage: true,
    chatButtonPosition: 'bottom-right', // 'bottom-right' | 'bottom-left'
    insightsRefreshInterval: 300000,    // 5 minutes in milliseconds
  },
  
  // Performance Settings
  performance: {
    cacheResults: true,
    cacheDuration: 300000,          // 5 minutes
    maxConcurrentRequests: 3,
    requestTimeout: 30000,          // 30 seconds
  },
  
  // Privacy Settings
  privacy: {
    sendAnonymousUsageData: false,
    includeGoalTitles: true,        // Include actual goal/task titles in AI requests
    includeDescriptions: true,      // Include descriptions
    includeNotes: false,            // Don't include private notes by default
  }
};

/**
 * Validate AI configuration on app startup
 */
export const validateAIConfig = () => {
  const issues = [];
  
  if (!AI_CONFIG.apiKey) {
    issues.push('ANTHROPIC_API_KEY is not set. AI features will be disabled.');
    issues.push('To enable AI: Add REACT_APP_ANTHROPIC_API_KEY to your .env file');
  }
  
  if (AI_CONFIG.apiKey && !AI_CONFIG.apiKey.startsWith('sk-')) {
    issues.push('Invalid API key format. Anthropic API keys start with "sk-"');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Check if AI features are available
 */
export const isAIAvailable = () => {
  return !!AI_CONFIG.apiKey && AI_CONFIG.apiKey.startsWith('sk-');
};

/**
 * Get sanitized data for AI requests (respects privacy settings)
 */
export const sanitizeDataForAI = (data) => {
  const { privacy } = AI_CONFIG;
  
  if (!data) return data;
  
  // Clone data to avoid mutating original
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Remove private notes if privacy setting is off
  if (!privacy.includeNotes && sanitized.notes) {
    delete sanitized.notes;
  }
  
  // Remove descriptions if privacy setting is off
  if (!privacy.includeDescriptions && sanitized.description) {
    sanitized.description = '[Description hidden for privacy]';
  }
  
  // Anonymize titles if privacy setting is off
  if (!privacy.includeGoalTitles && sanitized.title) {
    sanitized.title = `Goal ${sanitized.id || 'X'}`;
  }
  
  return sanitized;
};

export default AI_CONFIG;