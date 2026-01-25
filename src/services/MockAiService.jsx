// src/services/mockAIService.js
export class MockAIService {
  constructor() {
    this.mockResponses = [
      "Hello! I'm your AI assistant. How can I help you today?",
      "I understand you're asking about our services. We provide AI integration, web development, and consulting.",
      "That's a great question! Let me think about the best approach...",
      "Based on your query, I recommend checking our documentation for detailed steps.",
      "I'd be happy to help with that! Could you provide more details?",
      "Thanks for asking! The answer depends on several factors including your specific use case.",
      "I'm designed to provide helpful and harmless responses. Is there anything else I can assist with?",
      "Let me break that down into smaller parts to give you a clearer answer.",
      "That's an interesting perspective! Here's what I think about that topic.",
      "I don't have enough information to answer that precisely, but generally speaking..."
    ];
    
    // Store conversations in localStorage
    this.storageKey = 'ai_conversations';
    this.initializeStorage();
  }

  initializeStorage() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    }
  }

  // Simulate AI thinking with random delay
  simulateDelay(min = 300, max = 1500) {
    return new Promise(resolve => {
      setTimeout(resolve, Math.random() * (max - min) + min);
    });
  }

  // Generate mock response
  generateMockResponse(userInput) {
    // Simple keyword matching for "intelligent" responses
    const input = userInput.toLowerCase();
    
    if (input.includes('hello') || input.includes('hi')) {
      return "Hello! 👋 Nice to meet you! How can I assist you today?";
    }
    
    if (input.includes('weather')) {
      return "I'm an AI, so I don't have real-time weather data, but I hope it's beautiful wherever you are! ☀️";
    }
    
    if (input.includes('price') || input.includes('cost')) {
      return "Pricing varies based on your requirements. Would you like me to connect you with our sales team?";
    }
    
    if (input.includes('thank')) {
      return "You're welcome! 😊 Happy to help!";
    }
    
    if (input.includes('bye') || input.includes('goodbye')) {
      return "Goodbye! Have a wonderful day! 👋";
    }
    
    // Return random response from predefined list
    const randomIndex = Math.floor(Math.random() * this.mockResponses.length);
    return this.mockResponses[randomIndex];
  }

  // Simulate typing effect
  simulateTyping(text, onChunk, chunkDelay = 30) {
    return new Promise(resolve => {
      let i = 0;
      const typeChar = () => {
        if (i < text.length) {
          onChunk(text.charAt(i));
          i++;
          setTimeout(typeChar, chunkDelay);
        } else {
          resolve();
        }
      };
      typeChar();
    });
  }

  // Main API methods
  async sendMessage(message, context = []) {
    await this.simulateDelay(); // Simulate network delay
    
    const mockResponse = this.generateMockResponse(message);
    
    // Simulate a realistic API response structure
    return {
      id: `mock_${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gpt-3.5-turbo-mock',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: mockResponse,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: message.length / 4,
        completion_tokens: mockResponse.length / 4,
        total_tokens: (message.length + mockResponse.length) / 4,
      },
    };
  }

  async sendMessageStream(message, onChunk) {
    const mockResponse = this.generateMockResponse(message);
    
    // Simulate streaming with typing effect
    await this.simulateTyping(mockResponse, onChunk);
    
    return mockResponse;
  }

  // Save conversation to localStorage
  saveConversation(userMessage, aiResponse) {
    const conversations = JSON.parse(localStorage.getItem(this.storageKey));
    const conversation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      user: userMessage,
      ai: aiResponse,
      model: 'mock-ai',
    };
    
    conversations.push(conversation);
    localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    
    return conversation;
  }

  // Get conversation history
  getConversationHistory(limit = 50) {
    const conversations = JSON.parse(localStorage.getItem(this.storageKey));
    return conversations.slice(-limit).reverse();
  }

  // Clear conversation history
  clearHistory() {
    localStorage.setItem(this.storageKey, JSON.stringify([]));
    return true;
  }

  // Get stats
  getStats() {
    const conversations = JSON.parse(localStorage.getItem(this.storageKey));
    return {
      totalConversations: conversations.length,
      lastConversation: conversations[conversations.length - 1],
      mockResponsesUsed: this.mockResponses.length,
    };
  }
}

export const mockAIService = new MockAIService();