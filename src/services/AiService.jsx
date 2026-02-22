// src/services/aiService.js
/**
 * AI Service for Noxa Smart Notification System
 * Integrates with Claude API for intelligent features:
 * 1. Predictive problem prevention
 * 2. Pattern recognition & automation
 * 3. AI assistant capabilities
 */

const AI_CONFIG = {
  apiEndpoint: 'http://localhost:3001/api/ai', // ✅ Points to your proxy server
  model: 'claude-sonnet-4-20250514',
  maxTokens: 1000
};

class AiService {
  constructor() {
    this.apiKey = null; // Kept for backward compatibility
  }

  /**
   * Set the API key (for initialization in App.jsx)
   */
  setApiKey(key) {
    this.apiKey = key;
    console.log('✅ AI Service configured to use backend proxy');
  }

  /**
   * Make a request to Claude API via backend proxy
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

      // ✅ No API key in headers - proxy handles it
      const response = await fetch(AI_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API request failed: ${response.status}`);
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
    const systemPrompt = `You are Noxa, an AI productivity assistant. You help users:
    - Manage goals and tasks effectively
    - Stay organized and on track
    - Prevent problems before they happen
    - Automate repetitive work
    
    Be concise, helpful, and actionable. Always relate advice back to the user's specific goals and tasks.`;

    const userMessage = context.previousMessages 
      ? message 
      : `Context: ${JSON.stringify(context, null, 2)}\n\nUser: ${message}`;

    const messages = context.previousMessages 
      ? [...context.previousMessages, { role: 'user', content: message }]
      : [{ role: 'user', content: userMessage }];

    const response = await this.makeRequest(messages, systemPrompt);
    return response.text;
  }

  /**
   * Chat with AI and ask for executable app actions.
   * Returns a user-facing message plus optional actions.
   */
  async chatWithActions(message, context = {}) {
    const systemPrompt = `You are Noxa, an AI productivity assistant integrated with a task/goal/reminder app.

You must return STRICT JSON with this schema:
{
  "message": "assistant response for the user",
  "actions": [
    {
      "type": "create_task" | "create_goal" | "create_reminder" | "complete_task" | "complete_goal",
      "payload": {}
    }
  ]
}

Rules:
- Include actions only when the user clearly requests app changes (create/update/complete/set reminder).
- Keep actions minimal and safe.
- For reminders include a concrete ISO datetime in payload.reminderTime and payload.dueDate.
- For reminder notification channel use one of: "app", "email", "both".
- If details are missing, ask follow-up questions in "message" and return empty actions.
- Output valid JSON only.`;

    const userMessage = `Context: ${JSON.stringify(context, null, 2)}\n\nUser: ${message}`;
    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    try {
      const parsed = this.parseActionPayload(response.text);
      return parsed;
    } catch (error) {
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
}

// Export singleton instance
export default new AiService();
