// src/services/aiService.js
/**
 * AI Service for Noxa Smart Notification System
 * Integrates with Claude API for intelligent features:
 * 1. Predictive problem prevention
 * 2. Pattern recognition & automation
 * 3. AI assistant capabilities
 */
import { AI_CONFIG } from '../config/aiConfig';
import { authFetch } from './authService';

const NUMBER_WORDS = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  thirty: 30,
  forty: 40,
  fortyfive: 45,
  sixty: 60
};

const RELATIVE_TIME_PATTERN =
  /\b(?:in|after)\s+(an?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|thirty|forty(?:\s+five)?|sixty|\d+)\s+(minute|minutes|min|mins|hour|hours|hr|hrs|day|days|week|weeks)\b/i;
const TODAY_TOMORROW_TIME_PATTERN =
  /\b(today|tomorrow)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
const AT_TIME_DAY_PATTERN =
  /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+(today|tomorrow)\b/i;
const DATE_TIME_PATTERN =
  /\b(?:on\s+)?(\d{4}-\d{2}-\d{2})(?:\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?\b/i;
const REMINDER_COMMAND_PATTERN =
  /^(?:please\s+)?(?:can you\s+|could you\s+|would you\s+)?(?:set\s+(?:me\s+)?a\s+reminder|remind me)\b/i;
const TASK_CREATE_PATTERN =
  /^(?:please\s+)?(?:can you\s+|could you\s+|would you\s+)?(?:add|create|make)\s+(?:a\s+)?task\b/i;
const TASK_COMPLETE_PATTERN =
  /^(?:please\s+)?(?:can you\s+|could you\s+|would you\s+)?(?:(?:mark|set)\s+.+\s+as\s+done|complete)\b/i;

const isIsoDateTime = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(?:\.\d{3})?)?(Z|[+-]\d{2}:\d{2})?$/.test(value.trim());

const toTitleCase = (value = '') =>
  String(value)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const normalizeWhitespace = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const parseNumberToken = (rawValue = '') => {
  const normalized = String(rawValue || '').trim().toLowerCase().replace(/\s+/g, '');
  if (/^\d+$/.test(normalized)) {
    return Number.parseInt(normalized, 10);
  }
  return NUMBER_WORDS[normalized] ?? null;
};

const addDuration = (date, amount, unit) => {
  const next = new Date(date);
  const normalizedUnit = String(unit || '').toLowerCase();
  if (normalizedUnit.startsWith('min')) {
    next.setMinutes(next.getMinutes() + amount);
    return next;
  }
  if (normalizedUnit.startsWith('hour') || normalizedUnit.startsWith('hr')) {
    next.setHours(next.getHours() + amount);
    return next;
  }
  if (normalizedUnit.startsWith('day')) {
    next.setDate(next.getDate() + amount);
    return next;
  }
  if (normalizedUnit.startsWith('week')) {
    next.setDate(next.getDate() + amount * 7);
    return next;
  }
  return null;
};

const setTimeOnDate = (date, hourValue, minuteValue = '0', meridiem = '') => {
  const next = new Date(date);
  let hours = Number.parseInt(hourValue, 10);
  const minutes = Number.parseInt(minuteValue || '0', 10);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  const normalizedMeridiem = String(meridiem || '').toLowerCase();
  if (normalizedMeridiem === 'pm' && hours < 12) {
    hours += 12;
  } else if (normalizedMeridiem === 'am' && hours === 12) {
    hours = 0;
  }

  if (!normalizedMeridiem && (hours < 0 || hours > 23)) return null;
  if (normalizedMeridiem && (hours < 0 || hours > 23)) return null;

  next.setHours(hours, minutes, 0, 0);
  return next;
};

const formatReminderTime = (date) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);

const findTaskByTitle = (tasks = [], rawTitle = '') => {
  const normalizedTitle = normalizeWhitespace(rawTitle).toLowerCase();
  if (!normalizedTitle) return null;
  return tasks.find((task) => normalizeWhitespace(task?.title).toLowerCase() === normalizedTitle) || null;
};

const findGoalByTitle = (goals = [], rawTitle = '') => {
  const normalizedTitle = normalizeWhitespace(rawTitle).toLowerCase();
  if (!normalizedTitle) return null;
  return goals.find((goal) => normalizeWhitespace(goal?.title).toLowerCase() === normalizedTitle) || null;
};

const parseDateTimeExpression = (text, now = new Date()) => {
  const source = String(text || '');
  const relativeMatch = source.match(RELATIVE_TIME_PATTERN);
  if (relativeMatch) {
    const amount = parseNumberToken(relativeMatch[1]);
    if (amount !== null) {
      const resolved = addDuration(now, amount, relativeMatch[2]);
      if (resolved) {
        return { date: resolved, matchedText: relativeMatch[0], kind: 'relative' };
      }
    }
  }

  const todayTomorrowMatch = source.match(TODAY_TOMORROW_TIME_PATTERN);
  if (todayTomorrowMatch) {
    const base = new Date(now);
    base.setHours(0, 0, 0, 0);
    if (todayTomorrowMatch[1].toLowerCase() === 'tomorrow') {
      base.setDate(base.getDate() + 1);
    }
    const resolved = setTimeOnDate(base, todayTomorrowMatch[2], todayTomorrowMatch[3], todayTomorrowMatch[4]);
    if (resolved) {
      return { date: resolved, matchedText: todayTomorrowMatch[0], kind: todayTomorrowMatch[1].toLowerCase() };
    }
  }

  const atTimeDayMatch = source.match(AT_TIME_DAY_PATTERN);
  if (atTimeDayMatch) {
    const base = new Date(now);
    base.setHours(0, 0, 0, 0);
    if (atTimeDayMatch[4].toLowerCase() === 'tomorrow') {
      base.setDate(base.getDate() + 1);
    }
    const resolved = setTimeOnDate(base, atTimeDayMatch[1], atTimeDayMatch[2], atTimeDayMatch[3]);
    if (resolved) {
      return { date: resolved, matchedText: atTimeDayMatch[0], kind: atTimeDayMatch[4].toLowerCase() };
    }
  }

  const explicitDateMatch = source.match(DATE_TIME_PATTERN);
  if (explicitDateMatch) {
    const [year, month, day] = explicitDateMatch[1].split('-').map((part) => Number.parseInt(part, 10));
    const base = new Date(now);
    base.setFullYear(year, month - 1, day);
    base.setHours(9, 0, 0, 0);
    const resolved =
      explicitDateMatch[2] !== undefined
        ? setTimeOnDate(base, explicitDateMatch[2], explicitDateMatch[3], explicitDateMatch[4])
        : base;
    if (resolved) {
      return { date: resolved, matchedText: explicitDateMatch[0], kind: 'absolute' };
    }
  }

  if (isIsoDateTime(source)) {
    const parsed = new Date(source);
    if (!Number.isNaN(parsed.getTime())) {
      return { date: parsed, matchedText: source, kind: 'iso' };
    }
  }

  return null;
};

const stripDateTimePhrase = (text, matchedText) => normalizeWhitespace(String(text || '').replace(matchedText, ' '));

const extractReminderTitle = (message, matchedTimeText = '') => {
  let cleaned = normalizeWhitespace(message)
    .replace(REMINDER_COMMAND_PATTERN, '')
    .replace(/^to\s+/i, '');

  if (matchedTimeText) {
    cleaned = stripDateTimePhrase(cleaned, matchedTimeText);
  }

  cleaned = cleaned
    .replace(/\b(?:please|for me)\b/gi, ' ')
    .replace(/\b(?:time|from now|later)\b/gi, ' ')
    .replace(/^to\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (/^(?:time|from now|later)?$/i.test(cleaned)) {
    return '';
  }

  return cleaned;
};

const extractTaskTitle = (message, matchedTimeText = '') => {
  let cleaned = normalizeWhitespace(message)
    .replace(TASK_CREATE_PATTERN, '')
    .replace(/^to\s+/i, '');

  if (matchedTimeText) {
    cleaned = stripDateTimePhrase(cleaned, matchedTimeText);
  }

  return normalizeWhitespace(cleaned.replace(/^called\s+/i, ''));
};

const buildTimeContext = (now = new Date()) => ({
  currentDateTimeIso: now.toISOString(),
  currentDate: now.toISOString().split('T')[0],
  currentTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
});

const truncateText = (value = '', maxLength = 140) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return '';
  return normalized.length > maxLength
    ? `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`
    : normalized;
};

const formatContextDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
};

const formatConversationTranscript = (messages = []) =>
  (Array.isArray(messages) ? messages : [])
    .slice(-6)
    .map((message) => {
      const role = message?.role === 'assistant' ? 'Assistant' : 'User';
      const content = truncateText(message?.content || '', 280);
      return content ? `${role}: ${content}` : null;
    })
    .filter(Boolean)
    .join('\n');

class AiService {
  constructor() {
    this.apiKey = null; // Kept for backward compatibility
  }

  /**
   * Set the API key (for initialization in App.jsx)
   */
  setApiKey(key) {
    this.apiKey = key;
    console.log('AI Service configured to use backend API');
  }

  /**
   * Make a request to Claude API via backend API route
   */
  async makeRequest(messages, systemPrompt = '') {
    try {
      const requestBody = {
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens,
        messages: messages
      };

      if (systemPrompt) {
        requestBody.system = systemPrompt;
      }

      const response = await authFetch(AI_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let error = null;
        try {
          error = await response.json();
        } catch {
          error = null;
        }

        throw new Error(
          error?.message || error?.error?.message || `API request failed: ${response.status}`
        );
      }

      const data = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  /**
   * Parse Claude API response
   */
  parseResponse(data) {
    if (!data.content || data.content.length === 0) {
      throw new Error('Empty response from AI');
    }

    // Extract text content
    const textBlocks = data.content.filter(block => block.type === 'text');
    const fullText = textBlocks.map(block => block.text).join('\n');

    return {
      text: fullText,
      rawContent: data.content,
      usage: data.usage
    };
  }

  // ==================== UTILITY: DATA CLEANING ====================

  /**
   * Clean goal data to remove circular references and React components
   */
  cleanGoalData(goal) {
    if (!goal) return null;
    
    return {
      id: goal.id,
      title: goal.title,
      category: goal.category,
      targetDate: goal.targetDate,
      progress: goal.progress || 0,
      currentValue: goal.currentValue || 0,
      targetValue: goal.targetValue || 100,
      unit: goal.unit || '',
      completed: goal.completed || false,
      priority: goal.priority || 'medium',
      description: goal.description || '',
      createdAt: goal.createdAt || null,
      // Clean milestones - remove React components
      milestones: (goal.milestones || []).map(m => ({
        id: m.id,
        title: m.title,
        completed: m.completed || false,
        date: m.date || null
      }))
    };
  }

  /**
   * Clean task data to remove circular references
   */
  cleanTaskData(task) {
    if (!task) return null;
    
    return {
      id: task.id,
      title: task.title || '',
      category: task.category || '',
      completed: task.completed || false,
      priority: task.priority || 'medium',
      estimatedTime: task.estimatedTime || null,
      timeSpent: task.timeSpent || null,
      dueDate: task.dueDate || null,
      goalId: task.goalId || null
    };
  }

  cleanNoteData(note) {
    if (!note) return null;

    return {
      id: note.id || note._id || null,
      title: note.title || 'Untitled note',
      category: note.category || 'general',
      isPinned: Boolean(note.isPinned),
      createdAt: note.createdAt || null,
      content: truncateText(note.content || '', 180)
    };
  }

  buildWorkspaceSnapshot(context = {}) {
    const cleanGoals = (context.goals || []).map((goal) => this.cleanGoalData(goal)).filter(Boolean);
    const cleanTasks = (context.tasks || []).map((task) => this.cleanTaskData(task)).filter(Boolean);
    const cleanNotes = (context.notes || []).map((note) => this.cleanNoteData(note)).filter(Boolean);

    const activeGoals = cleanGoals
      .filter((goal) => !goal.completed)
      .slice(0, 5)
      .map((goal) => ({
        title: goal.title,
        progress: goal.progress,
        priority: goal.priority,
        targetDate: formatContextDate(goal.targetDate),
        category: goal.category || 'general',
        description: truncateText(goal.description || '', 120)
      }));

    const pendingTasks = cleanTasks
      .filter((task) => !task.completed)
      .slice(0, 8)
      .map((task) => ({
        title: task.title,
        priority: task.priority,
        dueDate: formatContextDate(task.dueDate),
        category: task.category || 'general',
        estimatedTime: task.estimatedTime || null,
        linkedGoalId: task.goalId || null
      }));

    const completedTasks = cleanTasks
      .filter((task) => task.completed)
      .slice(0, 5)
      .map((task) => ({
        title: task.title,
        completed: true,
        category: task.category || 'general'
      }));

    const notes = cleanNotes.slice(0, 5).map((note) => ({
      title: note.title,
      category: note.category,
      isPinned: note.isPinned,
      createdAt: formatContextDate(note.createdAt),
      content: note.content
    }));

    return {
      page: context.page || context.route || null,
      user: {
        name:
          context.userName ||
          context.user?.fullName ||
          context.user?.name ||
          context.user?.username ||
          null
      },
      counts: {
        totalGoals: cleanGoals.length,
        activeGoals: cleanGoals.filter((goal) => !goal.completed).length,
        completedGoals: cleanGoals.filter((goal) => goal.completed).length,
        pendingTasks: cleanTasks.filter((task) => !task.completed).length,
        completedTasks: cleanTasks.filter((task) => task.completed).length,
        notes: cleanNotes.length
      },
      activeGoals,
      pendingTasks,
      completedTasks,
      recentNotes: notes
    };
  }

  buildChatUserMessage(message, context = {}, now = new Date()) {
    const timeContext = buildTimeContext(now);
    const workspaceSnapshot = this.buildWorkspaceSnapshot(context);
    const conversationTranscript = formatConversationTranscript(context.previousMessages);

    return `Current time context:
${JSON.stringify(timeContext, null, 2)}

Workspace snapshot:
${JSON.stringify(workspaceSnapshot, null, 2)}

Recent conversation:
${conversationTranscript || 'No prior messages in this conversation.'}

Latest user request:
${message}`;
  }

  // ==================== PREDICTIVE INTELLIGENCE ====================

  /**
   * Analyze goal/task patterns and predict potential issues
   */
  async analyzePredictiveIssues(goals, tasks) {
    const systemPrompt = `You are Noxa, an AI productivity assistant that analyzes patterns and prevents problems before they happen. 
    Analyze the user's goals and tasks to identify:
    1. Goals at risk of missing deadlines
    2. Overcommitted time periods
    3. Tasks blocking other tasks
    4. Lack of progress patterns
    
    Provide actionable predictions and preventive suggestions.
    Respond in JSON format with this structure:
    {
      "predictions": [
        {
          "type": "deadline_risk" | "overcommitted" | "blocked" | "stagnant",
          "severity": "high" | "medium" | "low",
          "item": "goal or task title",
          "reason": "why this is predicted to be a problem",
          "suggestion": "specific action to prevent the issue"
        }
      ]
    }`;

    // ========== CLEAN DATA - Remove React components and circular refs ==========
    const cleanGoals = (goals || []).map(g => this.cleanGoalData(g)).filter(Boolean);
    const cleanTasks = (tasks || []).map(t => this.cleanTaskData(t)).filter(Boolean);

    const userMessage = `Current Goals:
${JSON.stringify(cleanGoals, null, 2)}

Current Tasks:
${JSON.stringify(cleanTasks, null, 2)}

Today's date: ${new Date().toISOString().split('T')[0]}

Analyze these and predict any potential problems.`;

    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    try {
      // Try to extract JSON from response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
      
      // Fallback if no JSON found
      return { predictions: [], rawAnalysis: response.text };
    } catch (e) {
      console.warn('Failed to parse AI response as JSON:', e);
      return { predictions: [], rawAnalysis: response.text };
    }
  }

  /**
   * Analyze a specific goal for risks
   */
  async analyzeGoalRisk(goal, relatedTasks = []) {
    const systemPrompt = `You are Noxa's goal analysis module. Analyze this specific goal and identify:
    1. Likelihood of completion based on current progress and deadline
    2. Required weekly progress to stay on track
    3. Potential obstacles or blockers
    4. Recommended actions
    
    Be specific and actionable. Respond in JSON format:
    {
      "riskLevel": "high" | "medium" | "low",
      "completionProbability": 0-100,
      "requiredWeeklyProgress": number,
      "obstacles": ["obstacle1", "obstacle2"],
      "recommendations": ["action1", "action2"]
    }`;

    // ========== CLEAN DATA ==========
    const cleanGoal = this.cleanGoalData(goal);
    const cleanRelatedTasks = (relatedTasks || []).map(t => this.cleanTaskData(t)).filter(Boolean);

    const userMessage = `Goal: ${JSON.stringify(cleanGoal, null, 2)}
Related Tasks: ${JSON.stringify(cleanRelatedTasks, null, 2)}

Today's date: ${new Date().toISOString().split('T')[0]}

Analyze this goal's risk level and provide recommendations.`;

    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { riskLevel: 'medium', rawAnalysis: response.text };
    } catch (e) {
      console.warn('Failed to parse goal risk response:', e);
      return { riskLevel: 'medium', rawAnalysis: response.text };
    }
  }

  // ==================== PATTERN RECOGNITION & AUTOMATION ====================

  /**
   * Discover patterns in user behavior and suggest automations
   */
  async discoverPatterns(userActivity) {
    const systemPrompt = `You are Noxa's pattern recognition engine. Analyze user activity to discover:
    1. Repetitive tasks that could be automated
    2. Time patterns (when user is most productive)
    3. Category patterns (types of goals/tasks user creates)
    4. Completion patterns (what gets done vs abandoned)
    
    Suggest specific automations. Respond in JSON:
    {
      "patterns": [
        {
          "type": "repetitive_task" | "time_pattern" | "category_preference" | "completion_pattern",
          "description": "what pattern was discovered",
          "frequency": "how often this occurs",
          "automation": {
            "suggestion": "what could be automated",
            "trigger": "when to trigger the automation",
            "action": "what action to take"
          }
        }
      ]
    }`;

    const userMessage = `User Activity Data:
${JSON.stringify(userActivity, null, 2)}

Discover patterns and suggest automations.`;

    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { patterns: [], rawAnalysis: response.text };
    } catch (e) {
      console.warn('Failed to parse patterns response:', e);
      return { patterns: [], rawAnalysis: response.text };
    }
  }

  /**
   * Suggest task automation based on detected patterns
   */
  async suggestAutomation(taskHistory) {
    const systemPrompt = `You are Noxa's automation advisor. Based on task history, suggest automations like:
    - Auto-create recurring tasks
    - Auto-schedule based on time preferences
    - Auto-categorize new tasks
    - Auto-set priorities based on patterns
    
    Respond in JSON:
    {
      "automations": [
        {
          "name": "automation name",
          "description": "what it does",
          "trigger": "when it activates",
          "benefit": "time/effort saved",
          "implementation": "step-by-step setup"
        }
      ]
    }`;

    // ========== CLEAN DATA ==========
    const cleanTaskHistory = (taskHistory || []).map(t => this.cleanTaskData(t)).filter(Boolean);

    const userMessage = `Task History:
${JSON.stringify(cleanTaskHistory, null, 2)}

What automations would benefit this user?`;

    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { automations: [], rawAnalysis: response.text };
    } catch (e) {
      console.warn('Failed to parse automation response:', e);
      return { automations: [], rawAnalysis: response.text };
    }
  }

  // ==================== AI ASSISTANT CAPABILITIES ====================

  /**
   * Draft an email based on context
   */
  async draftEmail(context) {
    const systemPrompt = `You are Noxa's email assistant. Draft professional, concise emails based on the user's context.
    Keep emails brief but complete. Use appropriate tone.`;

    const userMessage = `Context: ${context.description || context.prompt}
${context.recipient ? `Recipient: ${context.recipient}` : ''}
${context.purpose ? `Purpose: ${context.purpose}` : ''}
${context.tone ? `Tone: ${context.tone}` : ''}

Draft an email based on this context.`;

    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    return {
      email: response.text,
      subject: this.extractEmailSubject(response.text)
    };
  }

  /**
   * Prepare agenda for a goal/project
   */
  async prepareAgenda(goal, tasks = []) {
    const systemPrompt = `You are Noxa's meeting agenda assistant. Create clear, actionable agendas.
    Include: objectives, discussion points, action items, time allocations.`;

    // ========== CLEAN DATA ==========
    const cleanGoal = this.cleanGoalData(goal);
    const cleanTasks = (tasks || []).map(t => this.cleanTaskData(t)).filter(Boolean);

    const userMessage = `Goal/Project: ${cleanGoal.title}
Description: ${cleanGoal.description || 'No description'}
Related Tasks: ${cleanTasks.map(t => t.title).join(', ') || 'None'}
Target Date: ${cleanGoal.targetDate}

Prepare a meeting agenda to discuss this goal's progress and next steps.`;

    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    return response.text;
  }

  /**
   * Summarize weekly progress
   */
  async summarizeWeek(weekData) {
    const systemPrompt = `You are Noxa's weekly summary assistant. Provide concise, actionable weekly summaries.
    Include: achievements, challenges, metrics, recommendations for next week.
    Keep it motivating and constructive.`;

    // ========== CLEAN DATA ==========
    const cleanGoalsProgress = (weekData.goalsProgress || []).map(g => this.cleanGoalData(g)).filter(Boolean);
    const cleanCompletedTasks = (weekData.completedTasks || []).map(t => this.cleanTaskData(t)).filter(Boolean);

    const userMessage = `Week's Data:
Goals Worked On: ${weekData.goalsWorkedOn || 0}
Tasks Completed: ${weekData.tasksCompleted || 0}
Tasks Created: ${weekData.tasksCreated || 0}
Total Time Logged: ${weekData.timeLogged || 0} hours

Goals Progress:
${JSON.stringify(cleanGoalsProgress, null, 2)}

Tasks Completed:
${JSON.stringify(cleanCompletedTasks, null, 2)}

Summarize this week's productivity.`;

    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    return response.text;
  }

  /**
   * Summarize an email and extract actionable intelligence
   */
  async summarizeEmail(emailData = {}) {
    const response = await authFetch('/api/v1/emails/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: emailData.from || 'Unknown sender',
        to: emailData.to || 'Me',
        subject: emailData.subject || 'No subject',
        date: emailData.date || new Date().toISOString(),
        body: emailData.body || '',
        goals: emailData.goals || [],
        tasks: emailData.tasks || []
      })
    });

    if (!response.ok) {
      let error = null;
      try {
        error = await response.json();
      } catch {
        error = null;
      }

      throw new Error(error?.message || `Email summary request failed: ${response.status}`);
    }

    const payload = await response.json();
    const data = payload?.data || payload || {};

    return {
      summary: data.summary || '',
      actionItems: Array.isArray(data.actionItems) ? data.actionItems : [],
      urgency: data.urgency || 'medium',
      needsReply: Boolean(data.needsReply),
      suggestedReply: data.suggestedReply || '',
      linkedGoal: data.linkedGoal ?? null,
      linkedTask: data.linkedTask ?? null
    };
  }

  /**
   * Smart task suggestions based on current goals
   */
  async suggestTasks(goal, existingTasks = []) {
    const systemPrompt = `You are Noxa's task recommendation engine. Suggest specific, actionable tasks to help achieve a goal.
    Make tasks SMART: Specific, Measurable, Achievable, Relevant, Time-bound.
    
    Respond in JSON:
    {
      "tasks": [
        {
          "title": "task title",
          "description": "what needs to be done",
          "priority": "high" | "medium" | "low",
          "estimatedTime": "time estimate",
          "category": "category name"
        }
      ]
    }`;

    // ========== CLEAN DATA ==========
    const cleanGoal = this.cleanGoalData(goal);
    const cleanExistingTasks = (existingTasks || []).map(t => this.cleanTaskData(t)).filter(Boolean);

    const userMessage = `Goal: ${cleanGoal.title}
Description: ${cleanGoal.description || 'No description'}
Target: ${cleanGoal.targetDate}
Current Progress: ${cleanGoal.progress}%

Existing Tasks:
${cleanExistingTasks.length > 0 ? cleanExistingTasks.map(t => `- ${t.title}`).join('\n') : 'None'}

Suggest 3-5 new tasks to help achieve this goal.`;

    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { tasks: [], rawAnalysis: response.text };
    } catch (e) {
      console.warn('Failed to parse task suggestions:', e);
      return { tasks: [], rawAnalysis: response.text };
    }
  }

  /**
   * Generate smart reminders based on context
   */
  async generateSmartReminders(goals, tasks, userPatterns = {}) {
    const systemPrompt = `You are Noxa's smart reminder engine. Generate contextual reminders that:
    1. Remind at optimal times (based on user patterns)
    2. Are actionable and specific
    3. Prevent problems before they occur
    4. Motivate rather than nag
    
    Respond in JSON:
    {
      "reminders": [
        {
          "type": "deadline" | "progress_check" | "milestone" | "motivation",
          "target": "goal or task title",
          "message": "reminder message",
          "suggestedTime": "when to send (relative)",
          "priority": "high" | "medium" | "low",
          "action": "suggested action for user"
        }
      ]
    }`;

    // ========== CLEAN DATA - Limit to prevent huge payloads ==========
    const cleanGoals = (goals || []).slice(0, 5).map(g => this.cleanGoalData(g)).filter(Boolean);
    const cleanTasks = (tasks || []).slice(0, 10).map(t => this.cleanTaskData(t)).filter(Boolean);

    const userMessage = `Goals:
${JSON.stringify(cleanGoals, null, 2)}

Tasks:
${JSON.stringify(cleanTasks, null, 2)}

User Patterns:
${JSON.stringify(userPatterns, null, 2)}

Today's date: ${new Date().toISOString().split('T')[0]}

Generate smart reminders for the next 7 days.`;

    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { reminders: [], rawAnalysis: response.text };
    } catch (e) {
      console.warn('Failed to parse reminders:', e);
      return { reminders: [], rawAnalysis: response.text };
    }
  }

  /**
   * Analyze a note to see if it should be converted to task/goal
   */
  async analyzeNoteForConversion(noteContent) {
    const systemPrompt = `You are a productivity assistant that analyzes notes to detect actionable items.

    Determine if the note contains:
    1. A task (something to do once, with a deadline)
    2. A goal (something to achieve over time, with milestones)
    3. Just a note (no action needed)

    If actionable, extract:
    - Suggested title (concise, 5-10 words)
    - Suggested category (Personal, Work, Health, Financial, Education)
    - Suggested priority (high, medium, low)
    - Suggested due date (if mentioned or implied)
    - For goals: suggested milestones
    - Item type (task or goal)

    Respond ONLY with JSON:
    {
      "isActionable": true/false,
      "itemType": "task" | "goal" | "none",
      "suggestedTitle": "title here",
      "suggestedCategory": "category",
      "suggestedPriority": "priority",
      "suggestedDueDate": "YYYY-MM-DD or null",
      "suggestedTargetDate": "YYYY-MM-DD or null",
      "suggestedMilestones": ["milestone 1", "milestone 2"],
      "reasoning": "why this is a task/goal"
    }`;

    const userMessage = `Note content: "${noteContent}"
    
    Today's date: ${new Date().toISOString().split('T')[0]}
    
    Analyze this note and determine if it should be a task or goal.`;

    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.isActionable ? parsed : null;
      }
      return null;
    } catch (e) {
      console.warn('Failed to parse note analysis:', e);
      return null;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Extract email subject from drafted email
   */
  extractEmailSubject(emailText) {
    const subjectMatch = emailText.match(/Subject:\s*(.+?)(\n|$)/i);
    if (subjectMatch) {
      return subjectMatch[1].trim();
    }
    // Default subject if not found
    return 'Follow-up';
  }

  /**
   * Chat with AI assistant (general purpose)
   */
  async chat(message, context = {}) {
    const systemPrompt = `You are Noxa, an AI productivity assistant inside a goals, tasks, reminders, and notes app.

Your responses must feel specific, grounded, and useful, never generic.

Rules:
- Use the user's actual goals, tasks, notes, and recent conversation when available.
- Refer to item names directly instead of vague phrases like "your tasks" or "your goals."
- Give concrete next steps, prioritization, sequencing, or tradeoffs.
- If you mention urgency, explain why using the provided deadlines, progress, or priorities.
- Avoid filler, cliches, empty motivation, and generic productivity advice.
- Do not invent missing context. If something important is missing, say what is missing in one sentence and still provide the best next step.
- Keep the answer concise but substantive.`;

    const userMessage = this.buildChatUserMessage(message, context);
    const messages = [{ role: 'user', content: userMessage }];

    const response = await this.makeRequest(messages, systemPrompt);
    return response.text;
  }

  /**
   * Chat with AI and ask for executable app actions.
   * Returns a user-facing message plus optional actions.
   */
  async chatWithActions(message, context = {}) {
    const now = new Date();
    const directActionResult = this.resolveDirectActionCommand(message, context, now);
    if (directActionResult) {
      return directActionResult;
    }

    const systemPrompt = `You are Noxa, an AI productivity assistant integrated with a task, goal, reminder, and note app.

Your responses must feel concrete and personalized to the workspace data you receive.

You must return STRICT JSON with this schema:
{
  "message": "assistant response for the user",
  "actions": [
    {
      "type": "create_task" | "create_goal" | "create_reminder" | "create_note" | "complete_task" | "complete_goal",
      "payload": {}
    }
  ]
}

Rules:
- Include actions only when the user clearly requests app changes (create/update/complete/set reminder).
- Keep actions minimal and safe.
- Use the exact current datetime and timezone provided to you. Do not guess time.
- Convert relative time requests like "in an hour" into concrete ISO datetimes.
- If timing or target is unclear, ask one short follow-up question only.
- Keep clarification questions under 12 words.
- If user asks to write down/save/jot something, use "create_note".
- For notes use payload: { "title": string, "content": string, "category": "work" | "personal" | "ideas" | "study" | "general" | "other", "isPinned": boolean }.
- For reminders include a concrete ISO datetime in payload.reminderTime and payload.dueDate.
- For reminder notification channel use one of: "app", "email", "both".
- If details are missing, ask follow-up questions in "message" and return empty actions.
- In "message", reference the user's real goals, tasks, notes, or constraints when they are relevant.
- Avoid generic encouragement and vague summaries.
- Prefer one clear recommendation over a broad list of obvious ideas.
- Output valid JSON only.`;

    const userMessage = this.buildChatUserMessage(message, context, now);
    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    try {
      const parsed = this.parseActionPayload(response.text);
      return this.normalizeActionPlan(parsed, context, now);
    } catch {
      return {
        message: response.text,
        actions: []
      };
    }
  }

  parseActionPayload(rawText) {
    if (!rawText) {
      throw new Error('Empty AI action response');
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON payload found');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      message: parsed.message || 'Done.',
      actions: Array.isArray(parsed.actions) ? parsed.actions : []
    };
  }

  resolveDirectActionCommand(message, context = {}, now = new Date()) {
    const trimmed = normalizeWhitespace(message);
    if (!trimmed) return null;

    if (REMINDER_COMMAND_PATTERN.test(trimmed)) {
      return this.buildDirectReminderPlan(trimmed, context, now);
    }

    if (TASK_CREATE_PATTERN.test(trimmed)) {
      return this.buildDirectTaskPlan(trimmed, context, now);
    }

    if (TASK_COMPLETE_PATTERN.test(trimmed)) {
      return this.buildDirectTaskCompletionPlan(trimmed, context);
    }

    return null;
  }

  buildDirectReminderPlan(message, context = {}, now = new Date()) {
    const parsedDateTime = parseDateTimeExpression(message, now);
    const title = extractReminderTitle(message, parsedDateTime?.matchedText || '');
    const linkedTask = findTaskByTitle(context.tasks || [], title);
    const linkedGoal = findGoalByTitle(context.goals || [], title);

    if (!parsedDateTime) {
      return {
        message: 'When should I remind you?',
        actions: []
      };
    }

    const reminderTime = parsedDateTime.date;
    const titleText = title
      ? title.startsWith('Reminder')
        ? title
        : toTitleCase(title)
      : 'Reminder';
    return {
      message: `I’ll remind you ${formatReminderTime(reminderTime)}.`,
      actions: [
        {
          type: 'create_reminder',
          payload: {
            title: titleText,
            dueDate: reminderTime.toISOString(),
            reminderTime: reminderTime.toISOString(),
            priority: linkedTask?.priority || 'medium',
            category: linkedTask?.category || linkedGoal?.category || 'general',
            frequency: 'once',
            notificationMethod: 'app',
            taskId: linkedTask?.id || null,
            linkedGoalId: linkedGoal?.id || null,
            note: ''
          }
        }
      ]
    };
  }

  buildDirectTaskPlan(message, context = {}, now = new Date()) {
    const parsedDateTime = parseDateTimeExpression(message, now);
    const title = extractTaskTitle(message, parsedDateTime?.matchedText || '');

    if (!title) {
      return {
        message: 'What task should I create?',
        actions: []
      };
    }

    const dueDate = parsedDateTime?.date || new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return {
      message: `I’ll create that task for ${formatReminderTime(dueDate)}.`,
      actions: [
        {
          type: 'create_task',
          payload: {
            title: toTitleCase(title),
            description: '',
            dueDate: dueDate.toISOString(),
            priority: 'medium',
            category: 'personal',
            status: 'pending'
          }
        }
      ]
    };
  }

  buildDirectTaskCompletionPlan(message, context = {}) {
    const normalizedMessage = normalizeWhitespace(message)
      .replace(/^(?:please\s+)?(?:can you\s+|could you\s+|would you\s+)?/i, '')
      .replace(/^complete\s+/i, '')
      .replace(/^(?:mark|set)\s+/i, '')
      .replace(/\s+as\s+done$/i, '')
      .replace(/^task\s+/i, '')
      .trim();

    const task = findTaskByTitle(context.tasks || [], normalizedMessage);
    if (!task) {
      return {
        message: 'Which task should I complete?',
        actions: []
      };
    }

    return {
      message: `I’ll mark "${task.title}" as done.`,
      actions: [
        {
          type: 'complete_task',
          payload: {
            taskId: task.id,
            title: task.title
          }
        }
      ]
    };
  }

  normalizeActionPlan(plan, context = {}, now = new Date()) {
    return {
      message: String(plan?.message || 'Done.').trim() || 'Done.',
      actions: Array.isArray(plan?.actions)
        ? plan.actions
            .map((action) => this.normalizeAction(action, context, now))
            .filter(Boolean)
        : []
    };
  }

  normalizeAction(action, context = {}, now = new Date()) {
    if (!action || typeof action !== 'object') return null;
    const type = String(action.type || '').trim();
    const payload = action.payload && typeof action.payload === 'object' ? action.payload : {};

    if (type === 'create_reminder') {
      return {
        type,
        payload: this.normalizeReminderPayload(payload, context, now)
      };
    }

    if (type === 'create_task') {
      return {
        type,
        payload: this.normalizeTaskPayload(payload, now)
      };
    }

    return {
      type,
      payload
    };
  }

  normalizeReminderPayload(payload = {}, context = {}, now = new Date()) {
    const reminderCandidate =
      payload.reminderTime || payload.when || payload.time || payload.suggestedTime || payload.dueDate || '';
    const parsedReminderTime = parseDateTimeExpression(reminderCandidate, now);
    const reminderTime = parsedReminderTime?.date || (isIsoDateTime(payload.reminderTime) ? new Date(payload.reminderTime) : null);
    const dueDate = reminderTime || new Date(now.getTime() + 60 * 60 * 1000);
    const title = normalizeWhitespace(payload.title || payload.message || payload.taskTitle || 'Reminder');
    const linkedTask =
      payload.taskId
        ? (context.tasks || []).find((task) => String(task?.id) === String(payload.taskId))
        : findTaskByTitle(context.tasks || [], payload.taskTitle || title);
    const linkedGoal =
      payload.linkedGoalId
        ? (context.goals || []).find((goal) => String(goal?.id) === String(payload.linkedGoalId))
        : findGoalByTitle(context.goals || [], payload.goalTitle || title);

    return {
      ...payload,
      title: title || 'Reminder',
      dueDate: dueDate.toISOString(),
      reminderTime: dueDate.toISOString(),
      frequency: payload.frequency || 'once',
      category: String(payload.category || linkedTask?.category || linkedGoal?.category || 'general').toLowerCase(),
      priority: String(payload.priority || linkedTask?.priority || 'medium').toLowerCase(),
      notificationMethod: ['app', 'email', 'both'].includes(String(payload.notificationMethod || '').toLowerCase())
        ? String(payload.notificationMethod).toLowerCase()
        : 'app',
      taskId: linkedTask?.id || payload.taskId || null,
      linkedGoalId: linkedGoal?.id || payload.linkedGoalId || null,
      note: payload.note || ''
    };
  }

  normalizeTaskPayload(payload = {}, now = new Date()) {
    const dueDateCandidate = payload.dueDate || payload.when || payload.time || '';
    const parsedDueDate = parseDateTimeExpression(dueDateCandidate, now);
    const dueDate = parsedDueDate?.date || (isIsoDateTime(payload.dueDate) ? new Date(payload.dueDate) : null);
    return {
      ...payload,
      title: normalizeWhitespace(payload.title || 'New Task'),
      dueDate: (dueDate || new Date(now.getTime() + 24 * 60 * 60 * 1000)).toISOString(),
      priority: ['high', 'medium', 'low'].includes(String(payload.priority || '').toLowerCase())
        ? String(payload.priority).toLowerCase()
        : 'medium',
      category: String(payload.category || 'personal').toLowerCase(),
      status: payload.status || 'pending'
    };
  }
}

// Export singleton instance
export default new AiService();
