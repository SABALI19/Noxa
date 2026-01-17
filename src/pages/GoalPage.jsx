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
import AiCrierCard from "../components/cards/AiCrierCard";

// Dropdown Menu Component
const GoalDropdownMenu = ({ goalId, isOpen, onClose, onMenuAction }) => {
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    { id: "view", label: "View Details", icon: <FiFileText className="text-lg" /> },
    { id: "view_tracking", label: "View Tracking", icon: <FiBarChart2 className="text-lg" /> },
    { id: "edit", label: "Edit Goal", icon: <FiEdit3 className="text-lg" /> },
    { id: "complete", label: "Mark Complete", icon: <FiCheckSquare className="text-lg" /> },
    { id: "progress", label: "Track Progress", icon: <FiTrendingUp className="text-lg" /> },
    { id: "share", label: "Share", icon: <FiShare2 className="text-lg" /> },
    { id: "milestone", label: "Add Milestone", icon: <FiFlag className="text-lg" /> },
    { id: "notes", label: "Add Notes", icon: <FiEdit3 className="text-lg" /> },
    { id: "reminder", label: "Set Reminder", icon: <FiCalendar className="text-lg" /> },
    { id: "priority", label: "Change Priority", icon: <FiFlag className="text-lg" /> },
    { id: "archive", label: "Archive", icon: <FiFileText className="text-lg" /> },
    { id: "duplicate", label: "Duplicate", icon: <FiEdit3 className="text-lg" /> },
    { id: "export", label: "Export", icon: <FiShare2 className="text-lg" /> },
    { id: "delete", label: "Delete", icon: <FiTrash2 className="text-lg" />, danger: true },
  ];

  const handleItemClick = (itemId) => {
    onMenuAction(goalId, itemId);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2 max-h-64 overflow-y-auto"
    >
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleItemClick(item.id)}
          className={`w-full px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
            item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

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
  
  const { addTaskNotification } = useNotifications();
  const { trackView, trackCompletion, trackProgressUpdate, getNotificationStats } = useNotificationTracking();

  // Handle goal creation/update from navigation state
  const pendingGoalUpdateRef = useRef(null);

  // Handle goal creation/update from navigation state
  useEffect(() => {
    if (location.state?.action === 'created') {
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
        priority: 'medium',
        milestones: newGoalData.milestones || []
      };
      
      // Set pending update
      pendingGoalUpdateRef.current = { action: 'add', goal: newGoal };
      
      // Clear the navigation state
      window.history.replaceState({}, document.title);
      
    } else if (location.state?.action === 'updated') {
      const updatedGoalData = location.state.goalData;
      
      pendingGoalUpdateRef.current = { action: 'update', goal: updatedGoalData };
      
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, goals]); // Added goals to dependencies

  // Handle pending goal updates
  useEffect(() => {
    if (pendingGoalUpdateRef.current) {
      // Store the pending update in a local variable
      const update = pendingGoalUpdateRef.current;
      
      // Clear pending update immediately to prevent re-running
      pendingGoalUpdateRef.current = null;
      
      // Update goals using functional update
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
                milestones: update.goal.milestones
              };
            }
            return goal;
          });
        }
        return prevGoals;
      });
    }
  }, [goals]); // Only depend on goals

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

  const handleMenuToggle = (goalId) => {
    setOpenMenuId(openMenuId === goalId ? null : goalId);
  };

  const handleMenuAction = (goalId, action) => {
    const goal = goals.find(g => g.id === goalId);
    
    switch (action) {
      case "view":
        navigate(`/goals/${goalId}`);
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
        break;
        
      case "complete":
        setGoals(prev => prev.map(goal => {
          if (goal.id === goalId) {
            const updated = { ...goal, completed: true, progress: 100 };
            try {
              addTaskNotification('task_completed', updated);
            } catch (e) {
              console.error('Failed to add task notification:', e);
            }
            trackCompletion(goalId, 'goal');
            return updated;
          }
          return goal;
        }));
        break;
        
      case "delete":
        if (window.confirm("Are you sure you want to delete this goal?")) {
          const toDelete = goals.find(g => g.id === goalId);
          setGoals(prev => prev.filter(goal => goal.id !== goalId));
          if (toDelete) {
            try { addTaskNotification('task_deleted', toDelete); } catch(e) { console.error('Error adding task notification for deletion:', e); }
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
  };

  // Handle view goal tracking
  const handleViewGoalTracking = (goal, e) => {
    e?.stopPropagation();
    setSelectedGoal(goal);
    setSelectedGoalTracking(getNotificationStats(goal.id, 'goal'));
    setShowTrackingDetail(true);
    // Track view
    trackView(goal.id, 'goal');
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
      
      try { 
        addTaskNotification('task_updated', { 
          ...goal, 
          progress: progressNum 
        }); 
      } catch (error) {
        console.error('Error adding task notification:', error);
      }
      
      // Track progress update
      trackProgressUpdate(goalId, oldProgress, progressNum);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiChevronLeft className="text-xl text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Goals</h1>
              <p className="text-gray-600">Track and manage your objectives</p>
            </div>
          </div>
          
          <div>
            <Button
              variant="primary"
              size="md"
              className="rounded-xl"
              onClick={() => navigate('/goals/new')}
            >
              + Create goal
            </Button>
          </div>
        </div>

        {/* Goal filter buttons */}
        <div className="flex mb-4 gap-2">
          <Button 
            variant="primary"
            size="md"
            className="rounded-full"
          >
            Active
          </Button>

          <Button
            variant="soft"
            size="md"
            className="rounded-full"
          >
            Completed
          </Button>

          <Button
            variant="soft"
            size="md"
            className="rounded-full"
          >
            All
          </Button>
        </div>

        {/* Active goals header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Active Goals</h2>
            <p className="text-gray-600">{getSortSubtitle()}</p>
          </div>
          
          <SortDropdown
            selectedOption={sortBy}
            onSelect={setSortBy}
            buttonLabel="Sort by"
          />
        </div>

        {/* Active Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {sortedActiveGoals.length > 0 ? (
            sortedActiveGoals.map((goal) => {
              const goalTracking = getNotificationStats(goal.id, 'goal');
              
              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="p-4">
                    {/* Header with Icon and Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            {goal.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            {goal.completed && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-800 px-2 rounded-full">
                                <FiCheckCircle className="text-sm" />
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Three dots menu */}
                      {!goal.completed && (
                        <div className="relative">
                          <button 
                            onClick={() => handleMenuToggle(goal.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FiMoreHorizontal className="text-xl" />
                          </button>
                          
                          <GoalDropdownMenu
                            goalId={goal.id}
                            isOpen={openMenuId === goal.id}
                            onClose={() => setOpenMenuId(null)}
                            onMenuAction={handleMenuAction}
                          />
                        </div>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiCalendar className="text-gray-400" />
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
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-xs text-gray-500 mb-1 p-1 bg-[#d5f8f8] rounded-2xl w-24 text-center">
                            {goal.category}
                          </span>
                        </div>
                        {!goal.completed && goal.nextCheckin && (
                          <div className="flex items-center gap-1">
                            <FiCalendar className="text-blue-500 text-sm" />
                            <div>
                              <span className="block text-xs text-gray-500">Next check-in</span>
                              <p className="text-sm font-medium text-blue-600">
                                {goal.nextCheckin}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Tracking Stats */}
                      {goalTracking && goalTracking.totalNotifications > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs">
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
                        <div className="flex gap-4">
                          <Button 
                            variant="primary"
                            size="md"
                            className="group flex items-center hover:text-white hover:bg-[#3D9B9B] gap-2 rounded-2xl"
                            onClick={() => navigate(`/goals/${goal.id}`)}
                          >
                            <FiEye className="text-lg" />
                            View Details
                          </Button>
                          <Button
                            variant="soft"
                            size="md"
                            className="rounded-xl"
                            onClick={(e) => handleUpdateProgress(goal.id, e)}
                          >
                            Update
                          </Button>
                        </div>
                      )}

                      {/* Completed State */}
                      {goal.completed && (
                        <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
                          <FiCheckCircle className="text-green-500 text-xl" />
                          <span className="text-lg font-medium text-green-600">
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
            <div className="col-span-2 text-center py-12">
              <p className="text-gray-500 text-lg">No active goals found</p>
              <p className="text-gray-400 mt-2">Add a new goal to get started</p>
            </div>
          )}
        </div>

        {/* Completed Goals Section */}
        {completedGoals.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Completed Goals</h2>
                <p className="text-gray-600">Recently completed</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {completedGoals.map((goal) => {
                const goalTracking = getNotificationStats(goal.id, 'goal');
                
                return (
                  <div
                    key={goal.id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="p-4">
                      {/* Header with Icon and Status */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">
                              {goal.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-800 px-2 rounded-full">
                                <FiCheckCircle className="text-sm" />
                                Completed
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Due Date */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <FiCalendar className="text-gray-400" />
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

                        {/* Category */}
                        <div>
                          <span className="block text-xs text-gray-500 mb-1 p-1 bg-[#d5f8f8] rounded-2xl w-24 text-center">
                            {goal.category}
                          </span>
                        </div>

                        {/* Tracking Stats */}
                        {goalTracking && goalTracking.totalNotifications > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs">
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

                        {/* Completed State */}
                        <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100">
                          <FiCheckCircle className="text-green-500 text-xl" />
                          <span className="text-lg font-medium text-green-600">
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
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            Goal Categories Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryDistribution.map((category) => (
              <div key={category.name} className="text-center">
                <div
                  className={`h-16 w-16 rounded-full ${category.color} mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl shadow-md`}
                >
                  {category.count}
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {category.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

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