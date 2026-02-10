import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiCheckCircle,
  FiTrendingUp,
  FiTarget,
  FiClock,
  FiChevronLeft,
  FiBarChart2,
  FiActivity,
  FiPlus,
  FiX
} from 'react-icons/fi';
import ProgressChart from '../components/goalsItems/ProgressChart';
import Button from '../components/Button';
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationTracking } from '../hooks/useNotificationTracking';
import { useTheme } from '../context/ThemeContext';

const GoalProgressPage = () => {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { trackView, trackProgressUpdate, trackNotification } = useNotificationTracking();
  const { isDark } = useTheme();
  
  // Mock goals data in useMemo to prevent recreation
  const mockGoals = useMemo(() => [
    {
      id: 1,
      title: "Read 24 books this year",
      category: "Personal",
      targetDate: "Dec 31, 2024",
      progress: 75,
      currentValue: 18,
      targetValue: 24,
      unit: "books",
      milestone: "18/24 books",
      nextCheckin: "Dec 20",
      completed: false,
      description: "Reading 2 books per month to improve knowledge and relax",
      priority: "medium",
      milestones: [
        { id: 1, title: "Read 6 books", completed: true, date: "Mar 31, 2024" },
        { id: 2, title: "Read 12 books", completed: true, date: "Jun 30, 2024" },
        { id: 3, title: "Read 18 books", completed: true, date: "Sep 30, 2024" },
        { id: 4, title: "Read 24 books", completed: false, date: "Dec 31, 2024" }
      ],
      trackingHistory: [
        { id: 1, date: "Jan 15, 2024", progress: 8, value: 2, notes: "Started strong with two books" },
        { id: 2, date: "Apr 20, 2024", progress: 33, value: 8, notes: "Ahead of schedule!" },
        { id: 3, date: "Jul 31, 2024", progress: 50, value: 12, notes: "Halfway there!" },
        { id: 4, date: "Oct 15, 2024", progress: 67, value: 16, notes: "Two more books finished" },
        { id: 5, date: "Dec 1, 2024", progress: 75, value: 18, notes: "On track to finish by year end" }
      ],
    },
  ], []); // Empty dependency array means this only creates once

  // SOLUTION 1: Initialize state with computed value (recommended)
  // Find the goal from mock data immediately
  const initialGoal = useMemo(() => {
    const found = mockGoals.find(g => g.id === parseInt(goalId));
    if (found) {
      // Store in localStorage for testing
      localStorage.setItem(`goal_${goalId}`, JSON.stringify(found));
      return found;
    }
    
    // Check localStorage for saved goal
    const savedGoal = localStorage.getItem(`goal_${goalId}`);
    return savedGoal ? JSON.parse(savedGoal) : null;
  }, [goalId, mockGoals]); // Dependencies: goalId and mockGoals

  const initialTrackingData = useMemo(() => {
    return initialGoal?.trackingHistory || [];
  }, [initialGoal]);

  // Initialize state with computed values
  const [goal, setGoal] = useState(initialGoal);
  const [trackingData, setTrackingData] = useState(initialTrackingData);
  const [progressValue, setProgressValue] = useState('');
  const [progressNotes, setProgressNotes] = useState('');

  // SOLUTION 2: Use useEffect only for side effects (tracking, navigation)
  useEffect(() => {
    if (goal) {
      // Only do side effects here (tracking, notifications)
      trackView(parseInt(goalId), 'goal');
      trackNotification(parseInt(goalId), 'goal', 'viewed', 'progress_tracking_view');
    } else if (!initialGoal) {
      // Only navigate if no goal was found
      navigate('/goals');
    }
  }, [goal, goalId, navigate, trackView, trackNotification, initialGoal]);



  const handleLogProgress = () => {
    if (!progressValue.trim() || !goal) return;
    
    const newValue = parseInt(progressValue);
    const oldProgress = goal.progress;
    const newProgress = Math.min(Math.round((goal.currentValue + newValue) / goal.targetValue * 100), 100);
    
    const newEntry = {
      id: trackingData.length + 1,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      progress: newProgress,
      value: newValue,
      notes: progressNotes
    };
    
    const updatedGoal = {
      ...goal,
      progress: newProgress,
      currentValue: goal.currentValue + newValue
    };
    
    // Update local state
    setGoal(updatedGoal);
    setTrackingData([newEntry, ...trackingData]);
    setProgressValue('');
    setProgressNotes('');
    
    // Save to localStorage for testing
    localStorage.setItem(`goal_${goalId}`, JSON.stringify(updatedGoal));
    
    // Send progress notification
    addNotification('goal_progress', {
      ...updatedGoal,
      title: goal.title
    }, () => {
      navigate(`/goals/${goalId}`);
    });
    
    // Track progress update
    trackProgressUpdate(parseInt(goalId), oldProgress, newProgress, 'goal');
    trackNotification(parseInt(goalId), 'goal', 'sent', 'progress_update');
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "bg-[#4caf93]";
    if (progress >= 60) return "bg-[#3d9c9c]";
    if (progress >= 40) return "bg-[#ffb84d]";
    return "bg-red-500";
  };

  const chartData = useMemo(() => {
    return trackingData.map(entry => ({
      date: entry.date,
      value: entry.value,
      progress: entry.progress
    }));
  }, [trackingData]);

  const calculateDaysRemaining = () => {
    if (!goal || goal.targetDate === "Ongoing") return "Ongoing";
    const target = new Date(goal.targetDate);
    const today = new Date();
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (!goal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading progress data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 dark:to-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header - FIXED BACK BUTTON */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/goals/${goalId}`)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiChevronLeft className="text-xl text-gray-600 dark:text-gray-300" />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-300">Progress Tracking</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 truncate">{goal.title}</p>
            </div>
          </div>
          
          <Button
            variant="primary"
            size="md"
            className="rounded-xl w-full sm:w-auto"
            onClick={() => navigate(`/goals/${goalId}`)}
          >
            Back to Details
          </Button>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl flex-shrink-0">
                <FiTrendingUp className="text-xl md:text-2xl text-blue-500 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">Current Progress</h3>
                <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-300">{goal.progress}%</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getProgressColor(goal.progress)}`}
                style={{ width: `${goal.progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl flex-shrink-0">
                <FiTarget className="text-xl md:text-2xl text-green-500 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">Milestones</h3>
                <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-300">
                  {goal.milestones?.filter(m => m.completed).length || 0}/{goal.milestones?.length || 0}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex-shrink-0">
                <FiClock className="text-xl md:text-2xl text-yellow-500 dark:text-yellow-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">Days Remaining</h3>
                <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-300">{calculateDaysRemaining()}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Target: {goal.targetDate}</p>
          </div>
        </div>

        {/* Progress Tracking Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-300 mb-6">Log Progress</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Value ({goal.unit})
              </label>
              <input 
                type="number" 
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                placeholder={`Enter current ${goal.unit}`}
                className="w-full p-3 border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea 
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                placeholder="Notes about today's progress..."
                className="w-full p-3 border dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
                rows="3"
              />
            </div>
            
            <Button
              variant="primary"
              className="w-full"
              onClick={handleLogProgress}
              disabled={!progressValue.trim()}
            >
              <FiPlus className="mr-2" />
              Log Progress
            </Button>
          </div>
        </div>
        
        {/* Progress History */}
        <div className={`rounded-2xl shadow-lg border p-4 md:p-6 mb-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-300 mb-6">Progress History</h2>

          {trackingData.length > 0 ? (
            <div className="space-y-4">
              {trackingData.map((entry) => (
                <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-lg transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                        <FiActivity className="text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-800 dark:text-gray-300">{entry.date}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full">
                            +{entry.value} {goal.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-800 dark:text-gray-300">{entry.progress}%</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 ml-11 break-words">{entry.notes}</p>
                  <div className="mt-3 ml-11">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-full rounded-full ${getProgressColor(entry.progress)}`}
                        style={{ width: `${entry.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiBarChart2 className="text-2xl text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No progress logged yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Start tracking your progress above</p>
            </div>
          )}
        </div>

        {/* Progress Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-300">Progress Trend</h2>
            <div className="flex gap-2 text-xs sm:text-sm flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#3D9B9B] flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400">Value ({goal.unit})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#4caf93] border border-dashed border-[#4caf93] flex-shrink-0"></div>
                <span className="text-gray-600 dark:text-gray-400">Progress (%)</span>
              </div>
            </div>
          </div>
          
          {chartData.length > 0 ? (
            <ProgressChart data={chartData} isDark={isDark} />
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="text-center">
                <FiBarChart2 className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No data available for chart</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Log some progress to see the trend</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalProgressPage;