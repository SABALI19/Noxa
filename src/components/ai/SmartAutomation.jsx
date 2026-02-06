// src/components/ai/SmartAutomation.jsx
import React, { useState, useEffect } from 'react';
import {
  FiZap,
  FiClock,
  FiRepeat,
  FiTrendingUp,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiSettings
} from 'react-icons/fi';
import Button from '../Button';
import aiService from '../../services/aiService';

/**
 * Smart Automation Component
 * Displays AI-discovered patterns and automation suggestions
 */
const SmartAutomation = ({ userActivity, onEnableAutomation }) => {
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enabledAutomations, setEnabledAutomations] = useState(new Set());
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    if (userActivity && Object.keys(userActivity).length > 0) {
      discoverPatterns();
    }
  }, [userActivity]);

  const discoverPatterns = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.discoverPatterns(userActivity);
      setPatterns(result);
    } catch (err) {
      console.error('Failed to discover patterns:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAutomation = (patternIndex, automation) => {
    setEnabledAutomations(prev => new Set([...prev, patternIndex]));
    onEnableAutomation?.(automation);
  };

  const handleDismiss = (index) => {
    setDismissed(prev => new Set([...prev, index]));
  };

  const getPatternIcon = (type) => {
    switch (type) {
      case 'repetitive_task':
        return <FiRepeat className="text-purple-500" />;
      case 'time_pattern':
        return <FiClock className="text-blue-500" />;
      case 'category_preference':
        return <FiTrendingUp className="text-green-500" />;
      case 'completion_pattern':
        return <FiCheckCircle className="text-yellow-500" />;
      default:
        return <FiZap className="text-gray-500" />;
    }
  };

  const getPatternColor = (type) => {
    switch (type) {
      case 'repetitive_task':
        return 'bg-purple-50 border-purple-200';
      case 'time_pattern':
        return 'bg-blue-50 border-blue-200';
      case 'category_preference':
        return 'bg-green-50 border-green-200';
      case 'completion_pattern':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatPatternType = (type) => {
    const labels = {
      repetitive_task: 'Repetitive Task',
      time_pattern: 'Time Pattern',
      category_preference: 'Category Preference',
      completion_pattern: 'Completion Pattern'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center gap-3">
          <FiRefreshCw className="animate-spin text-purple-500 text-xl" />
          <span className="text-gray-600">Discovering your patterns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiX className="text-red-500 text-xl" />
            <div>
              <h3 className="font-semibold text-gray-800">Pattern Discovery Unavailable</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <Button variant="soft" size="sm" onClick={discoverPatterns}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!patterns || !patterns.patterns || patterns.patterns.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <FiZap className="text-gray-400 text-xl" />
          <div>
            <h3 className="font-semibold text-gray-800">Keep Using Noxa</h3>
            <p className="text-sm text-gray-600">
              We'll discover patterns and suggest automations as you use the app more.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const visiblePatterns = patterns.patterns.filter((_, index) => !dismissed.has(index));

  if (visiblePatterns.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg border border-purple-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <FiZap className="text-purple-500 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Smart Automation</h3>
            <p className="text-sm text-gray-600">AI-discovered patterns and suggestions</p>
          </div>
        </div>
        <Button variant="soft" size="sm" onClick={discoverPatterns}>
          <FiRefreshCw className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Patterns */}
      <div className="space-y-4">
        {visiblePatterns.map((pattern, index) => {
          const isEnabled = enabledAutomations.has(index);
          
          return (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 ${getPatternColor(pattern.type)} ${
                isEnabled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {getPatternIcon(pattern.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-800">
                        {formatPatternType(pattern.type)}
                      </h4>
                      {pattern.frequency && (
                        <span className="text-xs px-2 py-0.5 bg-white rounded-full font-medium">
                          {pattern.frequency}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{pattern.description}</p>
                  </div>
                </div>
                
                {/* Dismiss button */}
                {!isEnabled && (
                  <button
                    onClick={() => handleDismiss(index)}
                    className="p-1 hover:bg-white hover:bg-opacity-60 rounded-lg transition-colors"
                  >
                    <FiX className="text-gray-500" />
                  </button>
                )}
              </div>

              {/* Automation Suggestion */}
              {pattern.automation && (
                <div className="bg-white bg-opacity-70 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FiSettings className="text-purple-500 text-sm" />
                        <p className="text-sm font-semibold text-gray-800">
                          Suggested Automation
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {pattern.automation.suggestion}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500 font-medium">Trigger:</p>
                          <p className="text-gray-700">{pattern.automation.trigger}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Action:</p>
                          <p className="text-gray-700">{pattern.automation.action}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enable Button */}
                  {isEnabled ? (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <FiCheckCircle />
                      <span>Automation enabled</span>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleEnableAutomation(index, pattern.automation)}
                      className="w-full"
                    >
                      <FiZap className="mr-2" />
                      Enable Automation
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Raw analysis (if JSON parsing failed) */}
      {patterns.rawAnalysis && patterns.patterns.length === 0 && (
        <div className="mt-4 p-4 bg-white bg-opacity-60 rounded-xl">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{patterns.rawAnalysis}</p>
        </div>
      )}
    </div>
  );
};

export default SmartAutomation;