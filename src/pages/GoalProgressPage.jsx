import React, { useState, useEffect } from 'react';
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

const GoalProgressPage = () => {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [trackingData, setTrackingData] = useState([]);
  const [progressValue, setProgressValue] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  
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
      description: "Reading 2 books per month to improve knowledge and relax",
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
  ];

  useEffect(() => {
    const foundGoal = mockGoals.find(g => g.id === parseInt(goalId));
    if (foundGoal) {
      setGoal(foundGoal);
      setTrackingData(foundGoal.trackingHistory);
    } else {
      navigate('/goals');
    }
  }, [goalId, navigate]);

  const handleLogProgress = () => {
    if (!progressValue.trim()) return;
    
    const newEntry = {
      id: trackingData.length + 1,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      progress: goal.progress + 5,
      value: parseInt(progressValue),
      notes: progressNotes
    };
    
    setTrackingData([newEntry, ...trackingData]);
    setProgressValue('');
    setProgressNotes('');
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return "bg-[#4caf93]";
    if (progress >= 60) return "bg-[#3d9c9c]";
    if (progress >= 40) return "bg-[#ffb84d]";
    return "bg-red-500";
  };

  const chartData = trackingData.map(entry => ({
    date: entry.date,
    value: entry.value,
    progress: entry.progress
  }));

  if (!goal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  const calculateDaysRemaining = () => {
    if (goal.targetDate === "Ongoing") return "Ongoing";
    const target = new Date(goal.targetDate);
    const today = new Date();
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header - FIXED BACK BUTTON */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/goals/${goalId}`)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiChevronLeft className="text-xl text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Progress Tracking</h1>
              <p className="text-gray-600">{goal.title}</p>
            </div>
          </div>
          
          <Button
            variant="primary"
            size="md"
            className="rounded-xl"
            onClick={() => navigate(`/goals/${goalId}`)}
          >
            Back to Details
          </Button>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiTrendingUp className="text-2xl text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Current Progress</h3>
                <p className="text-3xl font-bold text-gray-800">{goal.progress}%</p>
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${getProgressColor(goal.progress)}`}
                style={{ width: `${goal.progress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <FiTarget className="text-2xl text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Milestones</h3>
                <p className="text-3xl font-bold text-gray-800">
                  {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FiClock className="text-2xl text-yellow-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Days Remaining</h3>
                <p className="text-3xl font-bold text-gray-800">{calculateDaysRemaining()}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Target: {goal.targetDate}</p>
          </div>
        </div>

        {/* Progress Tracking Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Log Progress</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Value ({goal.unit})
              </label>
              <input 
                type="number" 
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                placeholder={`Enter current ${goal.unit}`}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea 
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                placeholder="Notes about today's progress..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
              />
            </div>
            
            <Button
              variant="primary"
              className="w-full"
              onClick={handleLogProgress}
            >
              <FiPlus className="mr-2" />
              Log Progress
            </Button>
          </div>
        </div>
        
        {/* Progress History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Progress History</h2>
          
          {trackingData.length > 0 ? (
            <div className="space-y-4">
              {trackingData.map((entry) => (
                <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-4 hover:bg-gray-50 rounded-r-lg transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FiActivity className="text-blue-500" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800">{entry.date}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            +{entry.value} {goal.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-800">{entry.progress}%</span>
                  </div>
                  <p className="text-gray-600 ml-11">{entry.notes}</p>
                  <div className="mt-3 ml-11">
                    <div className="w-full bg-gray-200 rounded-full h-2">
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
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiBarChart2 className="text-2xl text-gray-400" />
              </div>
              <p className="text-gray-500">No progress logged yet</p>
              <p className="text-gray-400 text-sm mt-1">Start tracking your progress above</p>
            </div>
          )}
        </div>

        {/* Progress Chart */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Progress Trend</h2>
            <div className="flex gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#3D9B9B]"></div>
                <span className="text-gray-600">Value ({goal.unit})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-[#4caf93] border border-dashed border-[#4caf93]"></div>
                <span className="text-gray-600">Progress (%)</span>
              </div>
            </div>
          </div>
          
          {chartData.length > 0 ? (
            <ProgressChart data={chartData} />
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
              <div className="text-center">
                <FiBarChart2 className="text-4xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No data available for chart</p>
                <p className="text-gray-400 text-sm">Log some progress to see the trend</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalProgressPage;