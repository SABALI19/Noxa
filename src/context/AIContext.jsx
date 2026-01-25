import React, { createContext, useContext, useState, useCallback } from 'react';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const [aiStatus, setAiStatus] = useState({
    isActive: true,
    mode: 'local',
    lastActive: new Date(),
    totalInteractions: 0,
    recentActivities: []
  });

  const toggleAIStatus = useCallback(() => {
    setAiStatus(prev => ({
      ...prev,
      isActive: !prev.isActive,
      lastActive: new Date()
    }));
  }, []);

  const addInteraction = useCallback((interaction) => {
    setAiStatus(prev => ({
      ...prev,
      totalInteractions: prev.totalInteractions + 1,
      recentActivities: [
        {
          type: interaction.type || 'chat',
          message: interaction.message,
          timestamp: new Date()
        },
        ...prev.recentActivities.slice(0, 9)
      ]
    }));
  }, []);

  const value = {
    aiStatus,
    toggleAIStatus,
    addInteraction
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};