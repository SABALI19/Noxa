import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineWavingHand } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import GoalCard from "../components/cards/GoalCard";
import TaskCard from "../components/cards/TaskCard";
import ReminderCard from "../components/cards/ReminderCard";
import AiCrierCard from "../components/cards/AiCrierCard";

const Dashboard = ({ isSidebarOpen = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  const [dashboardData] = React.useState({
    goals: {
      total: 6,
      completed: 1,
      active: 5,
      progress: 72
    },
    tasks: {
      pending: 12,
      completed: 8,
      overdue: 2
    },
    reminders: {
      today: 3,
      upcoming: 5,
      completed: 10
    }
  });

  const handleGoalCardClick = () => {
    navigate('/goals');
  };

  const getUserName = () => {
    if (!user) return "Guest";
    const firstName = user.name ? user.name.split(' ')[0] : "User";
    return firstName;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Adjust padding based on sidebar state and screen size
  const getContentPadding = () => {
    if (isMobile) {
      return "p-4";
    }
    if (!isSidebarOpen) {
      return "p-4 md:p-6 lg:p-8";
    }
    return "p-4 "; // Adjust ml based on sidebar width
  };

  return (
    <div className={`min-h-screen 
  bg-linear-to-br 
  from-gray-50 to-blue-50          // Light mode gradient
  dark:from-gray-800 dark:to-gray-900  // Dark mode gradient
  ${getContentPadding()} 
  transition-all duration-300`}>
      {/* Welcome Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-300 mb-2 flex items-center gap-2">
              <span>{getGreeting()}, {getUserName()}!</span>
              <MdOutlineWavingHand className="text-yellow-500" />
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's your productivity overview for today
            </p>
            <div className="mt-4 text-sm text-gray-500 dark:bg-gray-600 dark:text-gray-300 bg-white p-3 rounded-lg inline-block shadow-sm">
              📅 {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Crier Card Section */}
      <div className="mb-8">
        <AiCrierCard />
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <GoalCard 
            title="Goals"
            count={dashboardData.goals.total}
            completed={dashboardData.goals.completed}
            color="#3D9B9B"
            onClick={handleGoalCardClick}
          />
        </div>
        
        <div className="lg:col-span-1">
          <TaskCard 
            pending={dashboardData.tasks.pending}
            completed={dashboardData.tasks.completed}
            overdue={dashboardData.tasks.overdue}
          />
        </div>
        
        <div className="lg:col-span-1">
          <ReminderCard 
            today={dashboardData.reminders.today}
            upcoming={dashboardData.reminders.upcoming}
            completed={dashboardData.reminders.completed}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white dark:bg-gray-800  p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-300">Recent Activity</h2>
          {user && (
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString() : "Today"}
            </span>
          )}
        </div>
        <div className="space-y-3">
          {[
            { action: 'Completed "Project Documentation" goal', time: '2 hours ago', type: 'goal' },
            { action: 'Added new task: "Review Q4 Reports"', time: '3 hours ago', type: 'task' },
            { action: 'Set reminder for meeting tomorrow', time: '5 hours ago', type: 'reminder' },
            { action: 'Achieved 75% progress on "Learn Spanish"', time: '1 day ago', type: 'goal' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activity.type === 'goal' ? 'bg-blue-100 text-blue-600' :
                activity.type === 'task' ? 'bg-green-100 text-green-600' :
                'bg-yellow-100 text-yellow-600'
              }`}>
                {activity.type === 'goal' ? '🎯' : activity.type === 'task' ? '✅' : '⏰'}
              </div>
              <div className="flex-1">
                <p className="text-gray-800">{activity.action}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;