// src/components/ai/AIAssistantChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  FiMessageSquare,
  FiSend,
  FiX,
  FiMinimize2,
  FiMaximize2,
  FiCopy,
  FiCheck
} from 'react-icons/fi';
import Button from '../Button';
import aiService from '../../services/AiService';

/**
 * AI Assistant Chat Component
 * Floating chat interface for AI interactions
 */
const AIAssistantChat = ({ goals = [], tasks = [], userContext = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm Noxa, your AI productivity assistant. I can help you draft emails, prepare agendas, summarize your week, or provide insights about your goals and tasks. What would you like help with?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Prepare context for AI
      const context = {
        goals,
        tasks,
        ...userContext,
        previousMessages: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      };

      const response = await aiService.chat(inputValue, context);

      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please make sure your API key is configured correctly.",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickActions = [
    { label: '📧 Draft Email', prompt: 'Help me draft an email' },
    { label: '📋 Create Agenda', prompt: 'Prepare an agenda for my upcoming meeting' },
    { label: '📊 Weekly Summary', prompt: 'Summarize my productivity this week' },
    { label: '💡 Suggest Tasks', prompt: 'Suggest tasks for my current goals' }
  ];

  const handleQuickAction = (prompt) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Open AI Assistant"
      >
        <FiMessageSquare className="text-2xl" />
      </button>
    );
  }

  return (
   <div
  className={`fixed z-50 flex flex-col transition-all duration-300 
    ${isMinimized 
      ? 'bottom-6 right-6 w-80 h-16' 
      : 'bottom-0 right-0 md:bottom-6 md:right-6 w-full h-full md:w-96 md:h-[600px] md:rounded-2xl'
    } 
    bg-white shadow-2xl border border-gray-200
    ${!isMinimized && 'rounded-t-2xl md:rounded-2xl'}
  `}
>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <FiMessageSquare className="text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Noxa Assistant</h3>
            {isTyping && <p className="text-xs text-gray-500">Typing...</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white hover:bg-opacity-60 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <FiMaximize2 className="text-gray-600" />
            ) : (
              <FiMinimize2 className="text-gray-600" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white hover:bg-opacity-60 rounded-lg transition-colors"
          >
            <FiX className="text-gray-600" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : message.isError
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.role === 'assistant' && !message.isError && (
                      <button
                        onClick={() => handleCopy(message.content, index)}
                        className="ml-2 p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                      >
                        {copiedIndex === index ? (
                          <FiCheck className="text-xs" />
                        ) : (
                          <FiCopy className="text-xs" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="2"
              />
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="rounded-xl px-2"
              >
                <FiSend />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAssistantChat;