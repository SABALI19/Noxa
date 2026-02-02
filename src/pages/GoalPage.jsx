// src/pages/GoalPage.jsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  FiBook,
  FiActivity,
  FiGlobe,
  FiFileText,
  FiDollarSign,
  FiEdit,
  FiCheckCircle,
  FiCalendar,
  FiChevronLeft,
  FiMoreHorizontal,
  FiEdit3,
  FiTrash2,
  FiShare2,
  FiFlag,
  FiCheckSquare,
  FiTrendingUp,
  FiEye,
  FiBell,
  FiZap,
  FiBarChart2
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationTracking } from '../hooks/useNotificationTracking';
import Button from "../components/Button";
import SortDropdown from "../components/SortDropdown";
import GoalTrackingDetail from '../components/tracking/GoalTrackingDetail';
import GoalDropdownMenuPortal from '../components/GoalDropdownMenu';

const GoalsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sortBy, setSortBy] = useState("deadline");
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "Read 24 books this year",
      category: "Personal",
      targetDate: "Dec 31, 2024",
      progress: 75,
      milestone: "18/24 books",
      nextCheckin: "Dec 20",
      completed: false,
      icon: <FiBook className="text-blue-500" />,
      targetValue: 24,
      currentValue: 18,
      unit: "books",
      description: "Reading 2 books per month to improve knowledge and relax",
      priority: "medium",
    },
    {
      id: 2,
      title: "Exercise 3x per week",
      category: "Health",
      targetDate: "Ongoing",
      progress: 67,
      milestone: "27 workouts this week",
      nextCheckin: "Dec 16",
      completed: false,
      icon: <FiActivity className="text-green-500" />,
      targetValue: 36,
      currentValue: 27,
      unit: "workouts",
      description: "Maintain consistent exercise routine for better health",
      priority: "high",
    },
    {
      id: 3,
      title: "Learn Spanish Conversation",
      category: "Education",
      targetDate: "Mar 15, 2024",
      progress: 75,
      milestone: "Intermediate level",
      nextCheckin: "Dec 20",
      completed: false,
      icon: <FiGlobe className="text-purple-500" />,
      targetValue: 100,
      currentValue: 75,
      unit: "proficiency",
      description: "Achieve conversational fluency in Spanish",
      priority: "medium",
    },
    {
      id: 4,
      title: "Complete project documentation",
      category: "Work",
      targetDate: "Dec 12, 2024",
      progress: 100,
      completed: true,
      icon: <FiFileText className="text-gray-500" />,
      targetValue: 100,
      currentValue: 100,
      unit: "pages",
      description: "Document all project processes and outcomes",
      priority: "low",
    },
    {
      id: 5,
      title: "Save $5000",
      category: "Financial",
      targetDate: "Dec 31, 2024",
      progress: 30,
      milestone: "$1500 saved",
      nextCheckin: "Jan 15, 2025",
      completed: false,
      icon: <FiDollarSign className="text-yellow-500" />,
      targetValue: 5000,
      currentValue: 1500,
      unit: "dollars",
      description: "Build emergency fund savings",
      priority: "high",
    },
    {
      id: 6,
      title: "Write a new book",
      category: "Personal",
      targetDate: "Jun 30, 2025",
      progress: 46,
      milestone: "Chapter 1 completed",
      nextCheckin: "Feb 1, 2025",
      completed: false,
      icon: <FiEdit className="text-red-500" />,
      targetValue: 100,
      currentValue: 46,
      unit: "chapters",
      description: "Complete first draft of new novel",
      priority: "medium",
    },
  ]);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [showTrackingDetail, setShowTrackingDetail] = useState(false);
  const [selectedGoalTracking, setSelectedGoalTracking] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [menuTriggerRect, setMenuTriggerRect] = useState(null);
  
  const { addNotification } = useNotifications();
  const { 
    trackView, 
    trackCompletion, 
    trackProgressUpdate, 
    getNotificationStats,
    trackNotification 
  } = useNotificationTracking();

  // Handle goal creation/update from navigation state
  const pendingGoalUpdateRef = useRef(null);
  const processedActionsRef = useRef(new Set()); // Track processed actions to prevent duplicates

  // Handle goal creation/update from navigation state
  useEffect(() => {
    const actionKey = location.state?.action;
    const goalDataKey = location.state?.goalData?.title; // Use title as unique identifier

    console.log('GoalPage useEffect triggered:', { actionKey, goalDataKey, processedActions: Array.from(processedActionsRef.current) });

    if (actionKey === 'created' && goalDataKey) {
      // Check if we've already processed this creation
      const processKey = `created_${goalDataKey}`;
      if (processedActionsRef.current.has(processKey)) {
        console.log('Already processed goal creation, skipping:', processKey);
        return; // Already processed, skip
      }

      console.log('Processing new goal creation:', processKey);

      const newGoalData = location.state.goalData;
      const newId = goals.length > 0 ? Math.max(...goals.map(g => g.id)) + 1 : 1;

      const newGoal = {
        id: newId,
        title: newGoalData.title,
        category: newGoalData.category,
        targetDate: newGoalData.targetDate,
        progress: 0,
        milestone: '',
        nextCheckin: '',
        completed: false,
        icon: newGoalData.category === 'Personal' ? <FiBook className="text-blue-500" /> :
               newGoalData.category === 'Health' ? <FiActivity className="text-green-500" /> :
               newGoalData.category === 'Education' ? <FiGlobe className="text-purple-500" /> :
               newGoalData.category === 'Financial' ? <FiDollarSign className="text-yellow-500" /> :
               newGoalData.category === 'Work' ? <FiFileText className="text-gray-500" /> :
               <FiEdit className="text-red-500" />,
        targetValue: 100,
        currentValue: 0,
        unit: '',
        description: newGoalData.description || '',
        priority: newGoalData.priority || 'medium',
        milestones: newGoalData.milestones || []
      };

      // Set pending update
      pendingGoalUpdateRef.current = { action: 'add', goal: newGoal };

      // Send notification for goal creation
      console.log('Sending goal_created notification for:', newGoal.title);
      addNotification('goal_created', newGoal, () => {
        navigate(`/goals/${newGoal.id}`);
      });

      // Track notification
      trackNotification(newGoal.id, 'goal', 'sent', 'goal_created');

      // Mark as processed
      processedActionsRef.current.add(processKey);
      console.log('Marked as processed:', processKey);

      // Clear the navigation state
      window.history.replaceState({}, document.title);

    } else if (actionKey === 'updated' && goalDataKey) {
      const updatedGoalData = location.state.goalData;
      
      pendingGoalUpdateRef.current = { action: 'update', goal: updatedGoalData };
      
      // Send notification for goal update
      addNotification('goal_updated', updatedGoalData, () => {
        navigate(`/goals/${updatedGoalData.id}`);
      });
      
      // Track notification
      trackNotification(updatedGoalData.id, 'goal', 'sent', 'goal_updated');
      
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, goals, addNotification, trackNotification, navigate]);

  // Handle pending goal updates
  useEffect(() => {
    if (pendingGoalUpdateRef.current) {
      const update = pendingGoalUpdateRef.current;
      pendingGoalUpdateRef.current = null;
      
      setGoals((prevGoals) => {
        if (update.action === 'add') {
          return [update.goal, ...prevGoals];
        } else if (update.action === 'update') {
          return prevGoals.map(goal => {
            if (goal.id === update.goal.id) {
              return {
                ...goal,
                title: update.goal.title,
                category: update.goal.category,
                targetDate: update.goal.targetDate,
                description: update.goal.description,
                milestones: update.goal.milestones,
                priority: update.goal.priority
              };
            }
            return goal;
          });
        }
        return prevGoals;
      });
    }
  }, [goals]);

  const sortedActiveGoals = useMemo(() => {
    const activeGoals = goals.filter(goal => !goal.completed);
    
    return activeGoals.sort((a, b) => {
      if (sortBy === "deadline") {
        const dateA = a.targetDate === "Ongoing" ? new Date(9999, 11, 31) : new Date(a.targetDate);
        const dateB = b.targetDate === "Ongoing" ? new Date(9999, 11, 31) : new Date(b.targetDate);
        return dateA - dateB;
      } else if (sortBy === "progress") {
        return b.progress - a.progress;
      } else if (sortBy === "category") {
        return a.category.toLowerCase().localeCompare(b.category.toLowerCase());
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [goals, sortBy]);

  const completedGoals = useMemo(() => 
    goals.filter(goal => goal.completed), 
    [goals]
  );

  const categoryDistribution = useMemo(() => {
    const categoryCounts = {};
    
    goals.forEach(goal => {
      const categoryName = goal.category.toLowerCase();
      
      if (!categoryCounts[categoryName]) {
        categoryCounts[categoryName] = 0;
      }
      categoryCounts[categoryName]++;
    });
    
    const completedCount = goals.filter(g => g.completed).length;
    if (completedCount > 0) {
      categoryCounts["completed"] = completedCount;
    }
    
    const getCategoryColor = (category) => {
      const colorMap = {
        "personal": "bg-gray-400",
        "health": "bg-green-500",
        "work": "bg-purple-500",
        "financial": "bg-yellow-500",
        "education": "bg-red-500",
        "completed": "bg-gray-500"
      };
      return colorMap[category] || "bg-gray-400";
    };
    
    const formatCategoryName = (category) => {
      if (category === "completed") return "Completed";
      return category.charAt(0).toUpperCase() + category.slice(1);
    };
    
    return Object.entries(categoryCounts).map(([name, count]) => ({
      name: formatCategoryName(name),
      count,
      color: getCategoryColor(name)
    }));
  }, [goals]);

  const getProgressColor = (progress) => {
    if (progress >= 80) return "bg-[#4caf93]";
    if (progress >= 60) return "bg-[#3d9c9c]";
    if (progress >= 40) return "bg-[#ffb84d]";
    return "bg-red-500";
  };

  const getSortSubtitle = () => {
    switch(sortBy) {
      case "deadline": return "By deadline";
      case "progress": return "By progress";
      case "category": return "By category";
      case "title": return "By title";
      default: return "By deadline";
    }
  };

  // Update the menu toggle handler
  const handleMenuToggle = (goalId, event) => {
    if (openMenuId === goalId) {
      setOpenMenuId(null);
      setMenuTriggerRect(null);
    } else {
      const buttonRect = event.currentTarget.getBoundingClientRect();
      setMenuTriggerRect(buttonRect);
      setOpenMenuId(goalId);
    }
  };

  const handleMenuAction = (goalId, action) => {
    const goal = goals.find(g => g.id === goalId);
    
    switch (action) {
      case "view":
        navigate(`/goals/${goalId}`);
        trackView(goalId, 'goal');
        trackNotification(goalId, 'goal', 'viewed', 'goal_view');
        break;
        
      case "view_tracking":
        handleViewGoalTracking(goal);
        break;
        
      case "edit": {
        navigate(`/goals/${goalId}/edit`, { state: { goal: goal } });
        break;
      }
        
      case "progress":
        navigate(`/goals/${goalId}/track`);
        trackNotification(goalId, 'goal', 'viewed', 'progress_tracking');
        break;
        
      case "complete":
        setGoals(prev => prev.map(g => {
          if (g.id === goalId) {
            const updated = { ...g, completed: true, progress: 100 };
            
            // Send completion notification
            addNotification('goal_completed', updated, () => {
              navigate(`/goals/${goalId}`);
            });
            
            // Track completion
            trackCompletion(goalId, 'goal');
            trackNotification(goalId, 'goal', 'sent', 'goal_completed');
            
            return updated;
          }
          return g;
        }));
        break;
        
      case "delete":
        if (window.confirm("Are you sure you want to delete this goal?")) {
          const toDelete = goals.find(g => g.id === goalId);
          setGoals(prev => prev.filter(g => g.id !== goalId));
          if (toDelete) {
            addNotification('goal_deleted', toDelete);
            trackNotification(goalId, 'goal', 'sent', 'goal_deleted');
          }
        }
        break;
        
      case "milestone":
        navigate(`/goals/${goalId}?tab=milestones`);
        break;
        
      case "notes":
        navigate(`/goals/${goalId}?tab=notes`);
        break;
        
      default:
        alert(`Action "${action}" will be implemented soon!`);
    }
    
    // Close menu after action
    setOpenMenuId(null);
    setMenuTriggerRect(null);
  };

  // Handle view goal tracking
  const handleViewGoalTracking = (goal, e) => {
    e?.stopPropagation();
    setSelectedGoal(goal);
    setSelectedGoalTracking(getNotificationStats(goal.id, 'goal'));
    setShowTrackingDetail(true);
    trackView(goal.id, 'goal');
    trackNotification(goal.id, 'goal', 'viewed', 'tracking_view');
  };

  // Handle update progress with tracking
  const handleUpdateProgress = (goalId, e) => {
    e?.stopPropagation();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    const newProgress = prompt(`Update progress for "${goal.title}" (0-100):`, goal.progress);
    if (newProgress !== null && !isNaN(newProgress)) {
      const progressNum = Math.min(100, Math.max(0, parseInt(newProgress)));
      const oldProgress = goal.progress;
      
      setGoals(prev => prev.map(g => 
        g.id === goalId ? { ...g, progress: progressNum } : g
      ));
      
      // Send progress notification
      addNotification('goal_progress', { 
        ...goal, 
        progress: progressNum 
      }, () => {
        navigate(`/goals/${goalId}`);
      });
      
      // Track progress update
      trackProgressUpdate(goalId, oldProgress, progressNum);
      trackNotification(goalId, 'goal', 'sent', 'progress_update');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    {/* Left side: Back button and title */}
    <div className="flex items-center gap-4 w-full sm:w-auto">
      <button
        onClick={() => navigate('/dashboard')}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
      >
        <FiChevronLeft className="text-xl text-gray-600" />
      </button>
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Goals</h1>
        <p className="text-sm md:text-base text-gray-600">Track and manage your objectives</p>
      </div>
    </div>
    
    {/* Create Goal Button - Flex on desktop, full width on mobile */}
    <div className="w-full sm:w-auto sm:mt-0">
      <Button
        variant="primary"
        size="md"
        className="w-full sm:w-auto rounded-xl"
        onClick={() => navigate('/goals/new')}
      >
        + Create goal
      </Button>
    </div>
  </div>
</div>

{/* Goal filter buttons - Responsive sizes */}
<div className="flex flex-wrap mb-4 gap-2 sm:gap-4">
  <Button 
    variant="primary"
    size="sm"
    className="rounded-full flex-1 sm:flex-none text-sm sm:text-base "
  >
    Active
  </Button>

  <Button
    variant="soft"
    size="sm"
    className="rounded-full flex-1 sm:flex-none text-sm sm:text-base"
  >
    Completed
  </Button>

  <Button
    variant="soft"
    size="sm"
    className="rounded-full flex-1 sm:flex-none text-sm sm:text-base "
  >
    All
  </Button>
</div>

        {/* Active goals header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Active Goals</h2>
            <p className="text-sm md:text-base text-gray-600">{getSortSubtitle()}</p>
          </div>
          
          <SortDropdown
            selectedOption={sortBy}
            onSelect={setSortBy}
            buttonLabel="Sort by"
          />
        </div>

        {/* Active Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
          {sortedActiveGoals.length > 0 ? (
            sortedActiveGoals.map((goal) => {
              const goalTracking = getNotificationStats(goal.id, 'goal');
              
              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="p-4">
                    {/* Header with Icon and Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-800 truncate">
                          {goal.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {goal.completed && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              <FiCheckCircle className="text-sm" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Three dots menu */}
                      {!goal.completed && (
                        <div className="relative ml-2 shrink-0">
                          <button 
                            onClick={(e) => handleMenuToggle(goal.id, e)}
                            className="text-gray-400 hover:text-gray-600 p-1 relative z-10"
                          >
                            <FiMoreHorizontal className="text-xl" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiCalendar className="text-gray-400 shrink-0" />
                        <span className="text-sm font-medium">
                          Due: {goal.targetDate}
                        </span>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-600">
                            Progress
                          </span>
                          <span className="text-lg font-bold text-gray-800">
                            {goal.progress}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColor(
                              goal.progress
                            )} transition-all duration-500`}
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Category and Check-in */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="inline-block text-xs text-gray-500 px-3 py-1 bg-[#d5f8f8] rounded-2xl text-center">
                            {goal.category}
                          </span>
                        </div>
                        {!goal.completed && goal.nextCheckin && (
                          <div className="flex items-center gap-1">
                            <FiCalendar className="text-blue-500 text-sm shrink-0" />
                            <div className="min-w-0">
                              <span className="block text-xs text-gray-500">Next check-in</span>
                              <p className="text-sm font-medium text-blue-600 truncate">
                                {goal.nextCheckin}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tracking Stats */}
                      {goalTracking && goalTracking.totalNotifications > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <FiBell className="text-blue-500" size={12} />
                              <span className="text-gray-600">
                                {goalTracking.totalNotifications} notifications
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiZap className="text-amber-500" size={12} />
                              <span className="text-gray-600">
                                {goalTracking.snoozedCount || 0} snoozes
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Buttons */}
{!goal.completed && (
  <div className="flex flex-wrap sm:flex-nowrap gap-3">
    <Button 
      variant="primary"
      size="md"
      className="flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl flex-1 min-w-[140px] sm:min-w-0"
      onClick={() => navigate(`/goals/${goal.id}`)}
    >
      <FiEye className="text-lg sm:text-base" />
      <span className="whitespace-nowrap">View Details</span>
    </Button>
    <Button
      variant="soft"
      size="md"
      className="flex items-center justify-center rounded-xl sm:rounded-2xl flex-1 min-w-[140px] sm:shrink-0 sm:w-auto sm:px-6"
      onClick={(e) => handleUpdateProgress(goal.id, e)}
    >
      <span className="whitespace-nowrap">Update</span>
    </Button>
  </div>
)}

                      {/* Completed State */}
                      {goal.completed && (
                        <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
                          <FiCheckCircle className="text-green-500 text-xl shrink-0" />
                          <span className="text-base md:text-lg font-medium text-green-600">
                            Completed on {goal.targetDate}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No active goals found</p>
              <p className="text-gray-400 mt-2">Add a new goal to get started</p>
            </div>
          )}
        </div>

        {/* Completed Goals Section */}
        {completedGoals.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Completed Goals</h2>
                <p className="text-sm md:text-base text-gray-600">Recently completed</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
              {completedGoals.map((goal) => {
                const goalTracking = getNotificationStats(goal.id, 'goal');
                
                return (
                  <div
                    key={goal.id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-semibold text-gray-800 truncate">
                            {goal.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              <FiCheckCircle className="text-sm" />
                              Completed
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <FiCalendar className="text-gray-400 shrink-0" />
                          <span className="text-sm font-medium">
                            Due: {goal.targetDate}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-medium text-gray-600">
                              Progress
                            </span>
                            <span className="text-lg font-bold text-gray-800">
                              {goal.progress}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getProgressColor(
                                goal.progress
                              )} transition-all duration-500`}
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <span className="inline-block text-xs text-gray-500 px-3 py-1 bg-[#d5f8f8] rounded-2xl text-center">
                            {goal.category}
                          </span>
                        </div>

                        {goalTracking && goalTracking.totalNotifications > 0 && (
                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <FiBell className="text-blue-500" size={12} />
                                <span className="text-gray-600">
                                  {goalTracking.totalNotifications} notifications
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FiZap className="text-amber-500" size={12} />
                                <span className="text-gray-600">
                                  {goalTracking.snoozedCount || 0} snoozes
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
                          <FiCheckCircle className="text-green-500 text-xl shrink-0" />
                          <span className="text-base md:text-lg font-medium text-green-600">
                            Completed on {goal.targetDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Category Distribution */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-200">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6">
            Goal Categories Distribution
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryDistribution.map((category) => (
              <div key={category.name} className="text-center">
                <div
                  className={`h-12 w-12 sm:h-16 sm:w-16 rounded-full ${category.color} mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md`}
                >
                  {category.count}
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700">
                  {category.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portal-based Dropdown Menu */}
      {openMenuId && (
        <GoalDropdownMenuPortal
          goalId={openMenuId}
          isOpen={true}
          onClose={() => {
            setOpenMenuId(null);
            setMenuTriggerRect(null);
          }}
          onMenuAction={handleMenuAction}
          triggerRect={menuTriggerRect}
        />
      )}

      {/* Tracking Detail Modal */}
      {showTrackingDetail && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <GoalTrackingDetail
              goal={selectedGoal}
              trackingData={selectedGoalTracking}
              onClose={() => setShowTrackingDetail(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;