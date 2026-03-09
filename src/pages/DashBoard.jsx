import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { MdOutlineWavingHand } from "react-icons/md";
import { FiActivity, FiBell, FiCheckSquare, FiChevronDown, FiChevronUp, FiTarget, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import GoalCard from "../components/cards/GoalCard";
import TaskCard from "../components/cards/TaskCard";
import ReminderCard from "../components/cards/ReminderCard";
import AiCrierCard from "../components/cards/AiCrierCard";
import AIInsights from "../components/ai/AIInsight";
import { useTasks } from "../context/TaskContext";
import { useNotifications } from "../hooks/useNotifications";
import { getGoals, goalEvents, hydrateGoalsFromBackend } from "../services/goalStorage";

const Dashboard = ({ isSidebarOpen = true }) => {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const {
    aiAssistantEnabled = true,
    onAiAssistantToggle = () => {},
    onAiAssistantChatNow = () => {}
  } = outletContext;
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { notifications } = useNotifications();
  const [isMobile, setIsMobile] = useState(false);
  const [goals, setGoals] = useState(() => getGoals());
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const hydrate = async () => {
      const hydratedGoals = await hydrateGoalsFromBackend();
      if (!isCancelled && Array.isArray(hydratedGoals)) {
        setGoals(hydratedGoals);
      }
    };

    void hydrate();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncGoals = (event) => {
      const incomingGoals = event?.detail && Array.isArray(event.detail) ? event.detail : getGoals();
      setGoals(incomingGoals);
    };

    const syncFromStorage = (event) => {
      if (event.key === "noxa_goals") {
        setGoals(getGoals());
      }
    };

    window.addEventListener(goalEvents.updated, syncGoals);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(goalEvents.updated, syncGoals);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const handleGoalCardClick = () => {
    navigate("/goals");
  };

  const getUserName = () => {
    if (!user) return "Guest";
    const firstName = user.name ? user.name.split(" ")[0] : "User";
    return firstName;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getContentPadding = () => {
    if (isMobile) {
      return "p-4";
    }
    if (!isSidebarOpen) {
      return "p-4 md:p-6 lg:p-8";
    }
    return "p-4";
  };

  const formatRelativeTime = (timestamp) => {
    const parsed = timestamp ? new Date(timestamp) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return "Just now";

    const diffSeconds = Math.floor((Date.now() - parsed.getTime()) / 1000);
    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hr ago`;
    return `${Math.floor(diffSeconds / 86400)} day ago`;
  };

  const resolveActivityType = (notification) => {
    const itemType = String(notification?.itemType || "").toLowerCase();
    if (itemType && itemType !== "system") return itemType;

    const notificationType = String(notification?.notificationType || "").toLowerCase();
    if (notificationType.startsWith("goal_")) return "goal";
    if (notificationType.startsWith("task_")) return "task";
    if (notificationType.startsWith("reminder_")) return "reminder";
    if (notificationType.startsWith("account_") || notificationType === "user_logged_in") return "account";
    return "activity";
  };

  const activityTypeMeta = {
    goal: {
      icon: FiTarget,
      badgeClass: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
      rowClass: "hover:border-teal-300 dark:hover:border-teal-700/60",
    },
    task: {
      icon: FiCheckSquare,
      badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
      rowClass: "hover:border-green-300 dark:hover:border-green-700/60",
    },
    reminder: {
      icon: FiBell,
      badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      rowClass: "hover:border-amber-300 dark:hover:border-amber-700/60",
    },
    account: {
      icon: FiUser,
      badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
      rowClass: "hover:border-blue-300 dark:hover:border-blue-700/60",
    },
    activity: {
      icon: FiActivity,
      badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      rowClass: "hover:border-gray-300 dark:hover:border-gray-600",
    },
  };

  const recentActivities = useMemo(() => {
    return (notifications || []).slice(0, 8).map((entry) => {
      const type = resolveActivityType(entry);
      const text = entry?.message || entry?.title || "Activity update";
      return {
        id: String(entry?.id || `${entry?.timestamp || Date.now()}-${Math.random()}`),
        type,
        text,
        timeLabel: formatRelativeTime(entry?.timestamp),
        originPath: entry?.originPath || "/notifications",
      };
    });
  }, [notifications]);

  const visibleActivities = useMemo(() => {
    if (showAllActivities) return recentActivities;
    return recentActivities.slice(0, 1);
  }, [recentActivities, showAllActivities]);

  const activeGoals = useMemo(() => goals.filter((goal) => !goal.completed), [goals]);

  const handleActivityClick = (originPath) => {
    if (!originPath || typeof originPath !== "string") return;
    navigate(originPath);
  };

  return (
    <div
      className={`min-h-screen bg-linear-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 ${getContentPadding()} transition-all duration-300`}
    >
      <div className="mb-6 mt-8 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <span>
                {getGreeting()}, {getUserName()}!
              </span>
              <MdOutlineWavingHand className="text-yellow-500" />
            </h1>
            <p className="text-[#01d5be] dark:text-gray-200">Here's your productivity overview for today</p>
            <div className="mt-4 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-200 bg-white p-3 rounded-lg inline-block shadow-sm">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <AiCrierCard
          isActive={aiAssistantEnabled}
          onActivate={onAiAssistantToggle}
          onChatNow={onAiAssistantChatNow}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <GoalCard title="Goals" color="#3D9B9B" onClick={handleGoalCardClick} />
        </div>

        <div className="lg:col-span-1">
          <TaskCard />
        </div>

        <div className="lg:col-span-1">
          <ReminderCard />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Activity</h2>
            {user && (
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString() : "Today"}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              visibleActivities.map((activity) => {
                const meta = activityTypeMeta[activity.type] || activityTypeMeta.activity;
                const Icon = meta.icon;

                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => handleActivityClick(activity.originPath)}
                    className={`w-full text-left flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/90 ${meta.rowClass}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${meta.badgeClass}`}>
                      <Icon className="text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 dark:text-gray-200 text-sm md:text-base truncate">{activity.text}</p>
                      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{activity.timeLabel}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-300">No recent activity yet.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  New goal/task/reminder actions will appear here live.
                </p>
              </div>
            )}
          </div>

          {recentActivities.length > 1 && (
            <button
              type="button"
              onClick={() => setShowAllActivities((prev) => !prev)}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#3D9B9B] dark:text-teal-300 hover:text-[#2f7878] dark:hover:text-teal-200 transition-colors"
            >
              {showAllActivities ? (
                <>
                  <FiChevronUp />
                  Show fewer activities
                </>
              ) : (
                <>
                  <FiChevronDown />
                  Show {recentActivities.length - 1} more activities
                </>
              )}
            </button>
          )}
        </div>

        <div>
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setShowAiInsights((prev) => !prev)}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#3D9B9B] dark:text-teal-300 hover:text-[#2f7878] dark:hover:text-teal-200 transition-colors"
            >
              {showAiInsights ? (
                <>
                  <FiChevronUp />
                  Hide AI Insights
                </>
              ) : (
                <>
                  <FiChevronDown />
                  Show AI Insights
                </>
              )}
            </button>
          </div>

          {showAiInsights ? (
            <AIInsights goals={activeGoals} tasks={tasks} onRefresh={() => {}} />
          ) : (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">AI Insights</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Insights are collapsed. Expand to run analysis and view recommendations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
