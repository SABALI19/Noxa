import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import AiService from '../../services/AiService';

/**
 * AI Insights Component
 * Displays predictive intelligence about goals and tasks
 */
const AIInsights = ({ goals = [], tasks = [], onRefresh }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());
  const inFlightRef = useRef(false);
  const lastProcessedKeyRef = useRef('');

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        goals: goals.map((goal) => ({
          id: goal?.id,
          progress: goal?.progress,
          completed: goal?.completed,
          targetDate: goal?.targetDate,
        })),
        tasks: tasks.map((task) => ({
          id: task?.id,
          completed: task?.completed,
          status: task?.status,
          dueDate: task?.dueDate,
        })),
      }),
    [goals, tasks]
  );

  const loadInsights = useCallback(async (force = false) => {
    if (goals.length === 0 && tasks.length === 0) {
      setInsights(null);
      setError(null);
      return;
    }

    if (!force && (inFlightRef.current || lastProcessedKeyRef.current === requestKey)) {
      return;
    }

    inFlightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const predictions = await AiService.analyzePredictiveIssues(goals, tasks);
      setInsights(predictions);
      lastProcessedKeyRef.current = requestKey;
    } catch (err) {
      console.error('Failed to load AI insights:', err);
      setError(err.message);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [goals, tasks, requestKey]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const handleDismiss = (index) => {
    setDismissed((prev) => new Set([...prev, index]));
  };

  const handleRefresh = () => {
    setDismissed(new Set());
    lastProcessedKeyRef.current = '';
    void loadInsights(true);
    onRefresh?.();
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'low':
        return 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <FiAlertTriangle className="text-red-500" />;
      case 'medium':
        return <FiClock className="text-yellow-500" />;
      case 'low':
        return <FiTarget className="text-[#3D9B9B]" />;
      default:
        return <FiTrendingUp className="text-gray-500 dark:text-gray-300" />;
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center gap-3">
          <FiRefreshCw className="animate-spin text-[#3D9B9B] text-xl" />
          <span className="text-gray-600 dark:text-gray-300">Analyzing your productivity patterns...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-red-500 text-xl" />
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">AI Insights Unavailable</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="text-green-500 text-xl" />
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">All Clear!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">No potential issues detected. Keep up the great work!</p>
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
    <div className="bg-gradient-to-br from-[#e6f8f8] to-[#f1fbfb] dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-lg border border-[#bfe9e9] dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-[#d4eeee] dark:border-gray-700">
            <FiZap className="text-[#3D9B9B] text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">AI Insights</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Preventing problems before they happen</p>
          </div>
        </div>
        <Button variant="soft" size="sm" onClick={handleRefresh}>
          <FiRefreshCw className="mr-2" />
          Refresh
        </Button>
      </div>

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
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">{getTypeLabel(prediction.type)}</h4>
                    <span className="text-xs px-2 py-0.5 bg-white/80 dark:bg-gray-800 rounded-full font-medium">
                      {prediction.severity}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{prediction.item}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{prediction.reason}</p>

                  <div className="bg-white/75 dark:bg-gray-900/60 rounded-lg p-3 border border-white/50 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Suggestion:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{prediction.suggestion}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDismiss(index)}
                className="p-1 hover:bg-white/70 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiX className="text-gray-500 dark:text-gray-300" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {insights.rawAnalysis && insights.predictions.length === 0 && (
        <div className="mt-4 p-4 bg-white/75 dark:bg-gray-900/60 rounded-xl border border-white/50 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{insights.rawAnalysis}</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
