import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiCalendar,
  FiCheckCircle,
  FiTrendingUp,
  FiTarget,
  FiClock,
  FiChevronLeft,
  FiEdit,
  FiShare2,
  FiTrash2,
  FiFileText,
  FiFlag,
  FiCheckSquare,
  FiX,
  FiPlus,
  FiActivity,
  FiBook,
  FiGlobe,
  FiDollarSign,
  FiBarChart2,
  FiMessageSquare
} from "react-icons/fi";
import Button from '../components/Button';
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationTracking } from '../hooks/useNotificationTracking';

const GoalDetailsPage = () => {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  const { trackView, trackCompletion, trackProgressUpdate, trackNotification } = useNotificationTracking();
  
  const [goal, setGoal] = useState(null);
  const [newMilestone, setNewMilestone] = useState('');
  const [progressUpdate, setProgressUpdate] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const mockGoals = [
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
      icon: <FiBook className="text-blue-500" />,
      description: "Reading 2 books per month to improve knowledge and relax",
      priority: "medium",
      milestones: [
        { id: 1, title: "Read 6 books", completed: true, date: "Mar 31, 2024" },
        { id: 2, title: "Read 12 books", completed: true, date: "Jun 30, 2024" },
        { id: 3, title: "Read 18 books", completed: true, date: "Sep 30, 2024" },
        { id: 4, title: "Read 24 books", completed: false, date: "Dec 31, 2024" }
      ],
      notes: [
        { id: 1, date: "Jan 15, 2024", content: "Starting with fiction novels first" },
        { id: 2, date: "Mar 20, 2024", content: "Switching to non-fiction for variety" }
      ],
      trackingHistory: [
        { id: 1, date: "Jan 15, 2024", progress: 8, value: 2, notes: "Started strong with two books" },
        { id: 2, date: "Apr 20, 2024", progress: 33, value: 8, notes: "Ahead of schedule!" },
        { id: 3, date: "Jul 31, 2024", progress: 50, value: 12, notes: "Halfway there!" },
        { id: 4, date: "Oct 15, 2024", progress: 67, value: 16, notes: "Two more books finished" },
        { id: 5, date: "Dec 1, 2024", progress: 75, value: 18, notes: "On track to finish by year end" }
      ],
      createdAt: "Jan 1, 2024"
    },
    {
      id: 2,
      title: "Exercise 3x per week",
      category: "Health",
      targetDate: "Ongoing",
      progress: 67,
      currentValue: 27,
      targetValue: 36,
      unit: "workouts",
      milestone: "27 workouts this week",
      nextCheckin: "Dec 16",
      completed: false,
      icon: <FiActivity className="text-green-500" />,
      description: "Maintain consistent exercise routine for better health",
      priority: "high",
      milestones: [
        { id: 1, title: "First month complete", completed: true, date: "Feb 1, 2024" },
        { id: 2, title: "100 days streak", completed: true, date: "Apr 10, 2024" },
        { id: 3, title: "200 workouts", completed: false, date: "Dec 31, 2024" }
      ],
      notes: [],
      trackingHistory: [],
      createdAt: "Jan 1, 2024"
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
      description: "Achieve conversational fluency in Spanish",
      currentValue: 75,
      targetValue: 100,
      unit: "proficiency",
      priority: "medium",
      milestones: [],
      notes: [],
      trackingHistory: [],
      createdAt: "Jan 15, 2024"
    },
    {
      id: 4,
      title: "Complete project documentation",
      category: "Work",
      targetDate: "Dec 12, 2024",
      progress: 100,
      completed: true,
      icon: <FiFileText className="text-gray-500" />,
      description: "Document all project processes and outcomes",
      currentValue: 100,
      targetValue: 100,
      unit: "pages",
      priority: "low",
      milestones: [],
      notes: [],
      trackingHistory: [],
      createdAt: "Nov 1, 2024"
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
      description: "Build emergency fund savings",
      currentValue: 1500,
      targetValue: 5000,
      unit: "dollars",
      priority: "high",
      milestones: [],
      notes: [],
      trackingHistory: [],
      createdAt: "Jan 1, 2024"
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
      description: "Complete first draft of new novel",
      currentValue: 46,
      targetValue: 100,
      unit: "chapters",
      priority: "medium",
      milestones: [],
      notes: [],
      trackingHistory: [],
      createdAt: "Jan 1, 2024"
    },
  ];

  useEffect(() => {
    const foundGoal = mockGoals.find(g => g.id === parseInt(goalId));
    if (foundGoal) {
      setGoal(foundGoal);
      setEditedGoal({ ...foundGoal });
      
      // Track view when goal is loaded
      trackView(parseInt(goalId), 'goal');
      trackNotification(parseInt(goalId), 'goal', 'viewed', 'goal_view');
      
      const editMode = searchParams.get('edit') === 'true';
      const tabParam = searchParams.get('tab');
      
      if (editMode) setIsEditing(true);
      if (tabParam && ['overview', 'milestones', 'notes', 'progress'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    } else {
      navigate('/goals');
    }
  }, [goalId, navigate, searchParams, trackView, trackNotification]);

  const handleSaveGoal = () => {
    setGoal(editedGoal);
    setIsEditing(false);
    
    // Send update notification
    addNotification('goal_updated', editedGoal, () => {
      navigate(`/goals/${goalId}`);
    });
    
    // Track notification
    trackNotification(parseInt(goalId), 'goal', 'sent', 'goal_updated');
  };

  const handleMarkComplete = () => {
    const updatedGoal = { 
      ...goal, 
      completed: true, 
      progress: 100,
      completedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    setGoal(updatedGoal);
    
    // Send completion notification
    addNotification('goal_completed', updatedGoal, () => {
      navigate('/goals');
    });
    
    // Track completion
    trackCompletion(parseInt(goalId), 'goal');
    trackNotification(parseInt(goalId), 'goal', 'sent', 'goal_completed');
  };

  const handleDeleteGoal = () => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      // Send deletion notification
      addNotification('goal_deleted', goal);
      
      // Track notification
      trackNotification(parseInt(goalId), 'goal', 'sent', 'goal_deleted');
      
      navigate('/goals');
    }
  };

  const handleAddMilestone = () => {
    if (!newMilestone.trim()) return;
    
    const newMilestoneObj = {
      id: goal.milestones.length + 1,
      title: newMilestone,
      completed: false,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    
    const updatedGoal = {
      ...goal,
      milestones: [...goal.milestones, newMilestoneObj]
    };
    
    setGoal(updatedGoal);
    setNewMilestone('');
    setShowAddMilestone(false);
    
    // Send milestone notification
    addNotification('goal_milestone', {
      ...updatedGoal,
      title: `Added milestone: ${newMilestone}`
    });
    
    trackNotification(parseInt(goalId), 'goal', 'sent', 'milestone_added');
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const newNoteObj = {
      id: goal.notes.length + 1,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      content: newNote
    };
    
    const updatedGoal = {
      ...goal,
      notes: [...goal.notes, newNoteObj]
    };
    
    setGoal(updatedGoal);
    setNewNote('');
    setShowNoteForm(false);
  };

  const handleLogProgress = () => {
    if (!progressUpdate.trim()) return;
    
    const newValue = parseInt(progressUpdate) || 0;
    const oldProgress = goal.progress;
    const newProgress = Math.min(Math.round((goal.currentValue + newValue) / goal.targetValue * 100), 100);
    
    const newProgressEntry = {
      id: goal.trackingHistory.length + 1,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      progress: newProgress,
      value: newValue,
      notes: progressNotes
    };
    
    const updatedGoal = {
      ...goal,
      trackingHistory: [newProgressEntry, ...goal.trackingHistory],
      progress: newProgress,
      currentValue: goal.currentValue + newValue
    };
    
    setGoal(updatedGoal);
    setProgressUpdate('');
    setProgressNotes('');
    setShowProgressForm(false);
    
    // Send progress notification
    addNotification('goal_progress', {
      ...updatedGoal,
      progress: newProgress
    }, () => {
      navigate(`/goals/${goalId}`);
    });
    
    // Track progress update
    trackProgressUpdate(parseInt(goalId), oldProgress, newProgress, 'goal');
    trackNotification(parseInt(goalId), 'goal', 'sent', 'progress_update');
  };

  const toggleMilestone = (milestoneId) => {
    const updatedMilestones = goal.milestones.map(milestone => 
      milestone.id === milestoneId 
        ? { ...milestone, completed: !milestone.completed }
        : milestone
    );
    
    const milestone = goal.milestones.find(m => m.id === milestoneId);
    const updatedGoal = { ...goal, milestones: updatedMilestones };
    setGoal(updatedGoal);
    
    // Send milestone completion notification
    if (milestone && !milestone.completed) {
      addNotification('goal_milestone', {
        ...updatedGoal,
        title: `Completed milestone: ${milestone.title}`
      });
      
      trackNotification(parseInt(goalId), 'goal', 'sent', 'milestone_completed');
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "bg-[#4caf93]";
    if (progress >= 60) return "bg-[#3d9c9c]";
    if (progress >= 40) return "bg-[#ffb84d]";
    return "bg-red-500";
  };

  const getCategoryBgColor = (category) => {
    const colorMap = {
      "personal": "bg-gray-100 text-gray-800",
      "health": "bg-green-100 text-green-800",
      "work": "bg-purple-100 text-purple-800",
      "financial": "bg-yellow-100 text-yellow-800",
      "education": "bg-red-100 text-red-800",
    };
    return colorMap[category.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  if (!goal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading goal details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header - FIXED BACK BUTTON */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/goals')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiChevronLeft className="text-xl text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Goal Details</h1>
              <p className="text-sm md:text-base text-gray-600">Track and manage your goal</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="soft"
              size="md"
              className="rounded-xl flex-1 sm:flex-none"
              onClick={() => setIsEditing(!isEditing)}
            >
              <FiEdit className="mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
            <Button
              variant="primary"
              size="md"
              className="rounded-xl flex-1 sm:flex-none"
              onClick={() => navigate(`/goals/${goalId}/track`)}
            >
              <FiTrendingUp className="mr-2" />
              Track
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 ${
              activeTab === 'overview' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 ${
              activeTab === 'milestones' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 ${
              activeTab === 'notes' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-3 font-medium whitespace-nowrap border-b-2 ${
              activeTab === 'progress' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Progress
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Goal Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Goal Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editedGoal.title}
                    onChange={(e) => setEditedGoal({...editedGoal, title: e.target.value})}
                    className="w-full text-xl md:text-2xl font-bold p-3 border rounded-lg bg-gray-50"
                  />
                  <textarea
                    value={editedGoal.description}
                    onChange={(e) => setEditedGoal({...editedGoal, description: e.target.value})}
                    className="w-full p-3 border rounded-lg bg-gray-50"
                    rows="3"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Date</label>
                      <input
                        type="text"
                        value={editedGoal.targetDate}
                        onChange={(e) => setEditedGoal({...editedGoal, targetDate: e.target.value})}
                        className="w-full p-3 border rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={editedGoal.category}
                        onChange={(e) => setEditedGoal({...editedGoal, category: e.target.value})}
                        className="w-full p-3 border rounded-lg bg-gray-50"
                      >
                        <option value="Personal">Personal</option>
                        <option value="Health">Health</option>
                        <option value="Work">Work</option>
                        <option value="Financial">Financial</option>
                        <option value="Education">Education</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      variant="soft"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSaveGoal}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 break-words">{goal.title}</h2>
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryBgColor(goal.category)}`}>
                          {goal.category}
                        </span>
                        {goal.completed && (
                          <span className="inline-flex items-center gap-1 text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">
                            <FiCheckCircle className="text-sm" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2 flex-shrink-0">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <FiShare2 className="text-gray-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-red-50 rounded-lg"
                        onClick={handleDeleteGoal}
                      >
                        <FiTrash2 className="text-red-600" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">{goal.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <FiCalendar className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium">Target Date</span>
                      </div>
                      <p className="text-base md:text-lg font-semibold">{goal.targetDate}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <FiCalendar className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium">Created</span>
                      </div>
                      <p className="text-base md:text-lg font-semibold">{goal.createdAt}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-600">Progress</span>
                      <span className="text-lg font-bold text-gray-800">{goal.progress}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProgressColor(goal.progress)} transition-all duration-500`}
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>{goal.currentValue} {goal.unit}</span>
                      <span>Target: {goal.targetValue} {goal.unit}</span>
                    </div>
                  </div>

                  {!goal.completed && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() => setShowProgressForm(true)}
                      >
                        <FiPlus className="mr-2" />
                        Log Progress
                      </Button>
                      <Button
                        variant="soft"
                        className="flex-1 sm:flex-none"
                        onClick={handleMarkComplete}
                      >
                        <FiCheckSquare className="mr-2" />
                        Complete
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'milestones' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">Milestones</h3>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => setShowAddMilestone(true)}
                  >
                    <FiPlus className="mr-2" />
                    Add
                  </Button>
                </div>

                {showAddMilestone && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newMilestone}
                        onChange={(e) => setNewMilestone(e.target.value)}
                        placeholder="Enter milestone title"
                        className="flex-1 p-3 border rounded-lg"
                      />
                      <button
                        onClick={() => setShowAddMilestone(false)}
                        className="p-3 hover:bg-gray-200 rounded-lg flex-shrink-0"
                      >
                        <FiX />
                      </button>
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleAddMilestone}
                      className="w-full"
                    >
                      Add Milestone
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  {goal.milestones.map((milestone) => (
                    <div 
                      key={milestone.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        milestone.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => toggleMilestone(milestone.id)}
                          className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${
                            milestone.completed 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300'
                          }`}
                        >
                          {milestone.completed && <FiCheckSquare className="text-sm" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <h4 className={`font-medium break-words ${
                            milestone.completed ? 'text-green-800 line-through' : 'text-gray-800'
                          }`}>
                            {milestone.title}
                          </h4>
                          <p className="text-sm text-gray-500">{milestone.date}</p>
                        </div>
                      </div>
                      {milestone.completed && (
                        <FiCheckCircle className="text-green-500 text-xl flex-shrink-0 ml-2" />
                      )}
                    </div>
                  ))}
                  {goal.milestones.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No milestones added yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">Notes</h3>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => setShowNoteForm(true)}
                  >
                    <FiPlus className="mr-2" />
                    Add
                  </Button>
                </div>

                {showNoteForm && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="mb-3">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add your note here..."
                        className="w-full p-3 border rounded-lg"
                        rows="3"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="soft"
                        className="flex-1"
                        onClick={() => setShowNoteForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleAddNote}
                      >
                        Save Note
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {goal.notes.map((note) => (
                    <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">{note.date}</span>
                      </div>
                      <p className="text-gray-600 break-words">{note.content}</p>
                    </div>
                  ))}
                  {goal.notes.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No notes added yet</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-6">Progress History</h3>
                <div className="space-y-4">
                  {goal.trackingHistory.map((entry) => (
                    <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-3">
                      <div className="flex justify-between flex-wrap gap-2">
                        <span className="font-medium text-gray-800">{entry.date}</span>
                        <span className="text-green-600 font-semibold">+{entry.value}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 break-words">{entry.notes}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${entry.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium flex-shrink-0">{entry.progress}%</span>
                      </div>
                    </div>
                  ))}
                  {goal.trackingHistory.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No progress logged yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="soft"
                  className="w-full justify-start"
                  onClick={() => navigate(`/goals/${goalId}/track`)}
                >
                  <FiTrendingUp className="mr-3" />
                  View Progress Charts
                </Button>
                <Button
                  variant="soft"
                  className="w-full justify-start"
                  onClick={() => setShowProgressForm(true)}
                >
                  <FiPlus className="mr-3" />
                  Add Progress Note
                </Button>
                <Button
                  variant="soft"
                  className="w-full justify-start"
                  onClick={() => window.print()}
                >
                  <FiFileText className="mr-3" />
                  Export Goal
                </Button>
                <Button
                  variant="soft"
                  className="w-full justify-start"
                  onClick={() => navigate('/reminders')}
                >
                  <FiCalendar className="mr-3" />
                  Set Reminder
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <FiTrendingUp className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">Current Progress</p>
                      <p className="text-base md:text-lg font-bold">{goal.progress}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <FiTarget className="text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">Milestones</p>
                      <p className="text-base md:text-lg font-bold">{goal.milestones.filter(m => m.completed).length}/{goal.milestones.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                      <FiClock className="text-yellow-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">Next Check-in</p>
                      <p className="text-base md:text-lg font-bold truncate">{goal.nextCheckin || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Update Modal */}
        {showProgressForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Log Progress</h3>
                  <button
                    onClick={() => setShowProgressForm(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <FiX className="text-xl" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Value ({goal.unit})
                    </label>
                    <input
                      type="number"
                      value={progressUpdate}
                      onChange={(e) => setProgressUpdate(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                      placeholder={`Enter current ${goal.unit}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={progressNotes}
                      onChange={(e) => setProgressNotes(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                      rows="3"
                      placeholder="How did it go? Any challenges or achievements?"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="soft"
                      className="flex-1"
                      onClick={() => setShowProgressForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleLogProgress}
                    >
                      Save Progress
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalDetailsPage;