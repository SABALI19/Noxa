// src/services/aiService.js
/**
 * AI Service for Noxa Smart Notification System
 * Integrates with Claude API for intelligent features:
 * 1. Predictive problem prevention
 * 2. Pattern recognition & automation
 * 3. AI assistant capabilities
 */

const AI_CONFIG = {
  apiEndpoint: 'https://api.anthropic.com/v1/messages',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 1000
};

class AIService {
  constructor() {
    // Note: API key should be stored in environment variables
    // For production, use: process.env.REACT_APP_ANTHROPIC_API_KEY
    this.apiKey = null; // Will be set via setApiKey method
  }

  /**
   * Set the API key (call this on app initialization)
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Make a request to Claude API
   */
  async makeRequest(messages, systemPrompt = '') {
    if (!this.apiKey) {
      throw new Error('API key not configured. Please set your Anthropic API key.');
    }

    try {
      const requestBody = {
        model: AI_CONFIG.model,
        max_tokens: AI_CONFIG.maxTokens,
        messages: messages
      };

      if (systemPrompt) {
        requestBody.system = systemPrompt;
      }

      const response = await fetch(AI_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
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

    const userMessage = `Current Goals:
${JSON.stringify(goals, null, 2)}

Current Tasks:
${JSON.stringify(tasks, null, 2)}

Analyze these and predict any potential problems.`;

    const response = await this.makeRequest(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    try {
      // Try to extract JSON from response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
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

    const userMessage = `Goal: ${JSON.stringify(goal, null, 2)}
Related Tasks: ${JSON.stringify(relatedTasks, null, 2)}

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

    const userMessage = `Task History:
${JSON.stringify(taskHistory, null, 2)}

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

    const userMessage = `Goal/Project: ${goal.title}
Description: ${goal.description || 'No description'}
Related Tasks: ${tasks.map(t => t.title).join(', ')}
Target Date: ${goal.targetDate}

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

    const userMessage = `Week's Data:
Goals Worked On: ${weekData.goalsWorkedOn || 0}
Tasks Completed: ${weekData.tasksCompleted || 0}
Tasks Created: ${weekData.tasksCreated || 0}
Total Time Logged: ${weekData.timeLogged || 0} hours

Goals Progress:
${JSON.stringify(weekData.goalsProgress || [], null, 2)}

Tasks Completed:
${JSON.stringify(weekData.completedTasks || [], null, 2)}

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

    const userMessage = `Goal: ${goal.title}
Description: ${goal.description}
Target: ${goal.targetDate}
Current Progress: ${goal.progress}%

Existing Tasks:
${existingTasks.map(t => `- ${t.title}`).join('\n')}

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

    const userMessage = `Goals:
${JSON.stringify(goals.slice(0, 5), null, 2)}

Tasks:
${JSON.stringify(tasks.slice(0, 10), null, 2)}

User Patterns:
${JSON.stringify(userPatterns, null, 2)}

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
      return { reminders: [], rawAnalysis: response.text };
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
}

// Export singleton instance
export default new AIService();