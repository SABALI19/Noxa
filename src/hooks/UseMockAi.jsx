// src/hooks/useMockAI.js
import { useState, useCallback, useEffect } from 'react';
import { mockAIService } from '../services/mockAIService';

export const useMockAI = (options = {}) => {
  const { enableHistory = true, autoSave = true } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [stats, setStats] = useState(null);

  // Load conversation history on mount
  useEffect(() => {
    if (enableHistory) {
      loadHistory();
      loadStats();
    }
  }, [enableHistory]);

  const loadHistory = () => {
    const history = mockAIService.getConversationHistory();
    setConversationHistory(history);
  };

  const loadStats = () => {
    const stats = mockAIService.getStats();
    setStats(stats);
  };

  const sendMessage = useCallback(async (message) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await mockAIService.simulateDelay(500, 1000); // Realistic delay
      
      const response = await mockAIService.sendMessage(message);
      const aiResponse = response.choices[0].message.content;
      
      if (autoSave) {
        mockAIService.saveConversation(message, aiResponse);
        loadHistory();
        loadStats();
      }
      
      return { response, aiResponse };
    } catch (err) {
      const errorMsg = 'Mock AI Service Error: ' + err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [autoSave]);

  const sendMessageStream = useCallback(async (message, onComplete) => {
    setIsLoading(true);
    setStreamingText('');
    setError(null);

    try {
      let fullResponse = '';
      
      await mockAIService.sendMessageStream(message, (chunk) => {
        setStreamingText(prev => {
          fullResponse = prev + chunk;
          return fullResponse;
        });
      });
      
      if (autoSave) {
        mockAIService.saveConversation(message, fullResponse);
        loadHistory();
        loadStats();
      }
      
      onComplete?.(fullResponse);
      return fullResponse;
    } catch (err) {
      const errorMsg = 'Stream Error: ' + err.message;
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [autoSave]);

  const clearHistory = useCallback(() => {
    mockAIService.clearHistory();
    setConversationHistory([]);
    setStats(mockAIService.getStats());
  }, []);

  return {
    sendMessage,
    sendMessageStream,
    isLoading,
    error,
    streamingText,
    conversationHistory,
    stats,
    clearHistory,
    refreshHistory: loadHistory,
    refreshStats: loadStats,
  };
};