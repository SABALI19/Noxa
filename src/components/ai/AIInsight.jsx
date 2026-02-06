// src/components/ai/AIInsights.jsx
import React, { useState, useEffect } from 'react';
import {
  FiAlertTriangle,
  FiTrendingUp,
  FiZap,
  FiTarget,
  FiClock,
  FiCheckCircle,
  FiX,
  FiRefreshCw
} from 'react-icons/fi';
import Button from '../Button';
import aiService from '../../services/aiService';

/**
 * AI Insights Component
 * Displays predictive intelligence about goals and tasks
 */
const AIInsights = ({ goals = [], tasks = [], onRefresh }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    loadInsights();
  }, [goals, tasks]);

  const loadInsights = async () => {
    if (goals.length === 0 && tasks.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const predictions = await aiService.analyzePredictiveIssues(goals, tasks);
      setInsights(predictions);
    } catch (err) {
      console.error('Failed to load AI insights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (index) => {
    setDismissed(prev => new Set([...prev, index]));
  };

  const handleRefresh = () => {
    setDismissed(new Set());
    loadInsights();
    onRefresh?.();
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <FiAlertTriangle className="text-red-500" />;
      case 'medium':
        return <FiClock className="text-yellow-500" />;
      case 'low':
        return <FiTarget className="text-blue-500" />;
      default:
        return <FiTrendingUp className="text-gray-500" />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      deadline_risk: 'Deadline Risk',
      overcommitted: 'Overcommitted',
      blocked: 'Blocked',
      stagnant: 'Stagnant Progress'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center gap-3">
          <FiRefreshCw className="animate-spin text-blue-500 text-xl" />
          <span className="text-gray-600">Analyzing your productivity patterns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-red-500 text-xl" />
            <div>
              <h3 className="font-semibold text-gray-800">AI Insights Unavailable</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <Button variant="soft" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!insights || !insights.predictions || insights.predictions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="text-green-500 text-xl" />
            <div>
              <h3 className="font-semibold text-gray-800">All Clear!</h3>
              <p className="text-sm text-gray-600">No potential issues detected. Keep up the great work!</p>
            </div>
          </div>
          <Button variant="soft" size="sm" onClick={handleRefresh}>
            <FiRefreshCw className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const visiblePredictions = insights.predictions.filter((_, index) => !dismissed.has(index));

  if (visiblePredictions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg border border-blue-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <FiZap className="text-blue-500 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">AI Insights</h3>
            <p className="text-sm text-gray-600">Preventing problems before they happen</p>
          </div>
        </div>
        <Button variant="soft" size="sm" onClick={handleRefresh}>
          <FiRefreshCw className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Predictions */}
      <div className="space-y-3">
        {visiblePredictions.map((prediction, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border-2 ${getSeverityColor(prediction.severity)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">
                  {getSeverityIcon(prediction.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800">{getTypeLabel(prediction.type)}</h4>
                    <span className="text-xs px-2 py-0.5 bg-white rounded-full font-medium">
                      {prediction.severity}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{prediction.item}</p>
                  <p className="text-sm text-gray-600 mb-3">{prediction.reason}</p>
                  
                  {/* Suggestion */}
                  <div className="bg-white bg-opacity-60 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">💡 Suggestion:</p>
                    <p className="text-sm text-gray-600">{prediction.suggestion}</p>
                  </div>
                </div>
              </div>
              
              {/* Dismiss button */}
              <button
                onClick={() => handleDismiss(index)}
                className="p-1 hover:bg-white hover:bg-opacity-60 rounded-lg transition-colors"
              >
                <FiX className="text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Raw analysis (if JSON parsing failed) */}
      {insights.rawAnalysis && insights.predictions.length === 0 && (
        <div className="mt-4 p-4 bg-white bg-opacity-60 rounded-xl">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{insights.rawAnalysis}</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;