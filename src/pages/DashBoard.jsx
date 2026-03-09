import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { MdOutlineWavingHand } from "react-icons/md";
import {
  FiActivity,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCheckSquare,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiEdit3,
  FiX,
  FiTarget,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import GoalCard from "../components/cards/GoalCard";
import TaskCard from "../components/cards/TaskCard";
import ReminderCard from "../components/cards/ReminderCard";
import AiCrierCard from "../components/cards/AiCrierCard";
import AIInsights from "../components/ai/AIInsight";
import { useTasks } from "../context/TaskContext";
import { useNotifications } from "../hooks/useNotifications";
import { getGoals, goalEvents, hydrateGoalsFromBackend } from "../services/goalStorage";
import {
  getCachedCommunityWords,
  getCachedWordOfDay,
  getCommunityWords,
  getWordOfDay,
  submitCommunityWord,
} from "../services/wordOfDayService";

const WordOfDayModal = ({
  isOpen,
  onClose,
  wordOfDay,
  communityWordsCount,
  formState,
  onFormChange,
  onSubmit,
  submitStatus,
  user,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6 dark:bg-black/60">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#3D9B9B] dark:text-[#4fb3b3]">
              Word Of The Day
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{wordOfDay.word}</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{wordOfDay.meaning}</p>
            {wordOfDay.example ? (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Example: {wordOfDay.example}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Close word of the day modal"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <div className="grid max-h-[calc(100vh-8rem)] gap-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 md:grid-cols-[0.95fr_1.05fr] md:px-6 md:py-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm dark:bg-gray-900 dark:text-amber-300">
                <FiBookOpen className="text-lg" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-300">
                  Community Pool
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-100">
                  {communityWordsCount} submitted {communityWordsCount === 1 ? "word" : "words"}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-amber-900 dark:text-amber-100">
              The featured word rotates from community submissions. Until the real backend is connected,
              this uses the local shared fallback on this device.
            </p>
          </div>

          <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800 sm:p-5">
            <div className="flex items-center gap-2">
              <FiEdit3 className="text-[#3D9B9B] dark:text-[#4fb3b3]" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Submit A Word</h3>
            </div>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {user ? "Add a word for the community rotation." : "Sign in to contribute to the community rotation."}
            </p>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Word</span>
                <input
                  type="text"
                  name="word"
                  value={formState.word}
                  onChange={onFormChange}
                  placeholder="Clarity"
                  disabled={!user || submitStatus.loading}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#3D9B9B] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-[#4fb3b3] sm:px-2.5 sm:py-1.5"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Meaning</span>
                <textarea
                  name="meaning"
                  value={formState.meaning}
                  onChange={onFormChange}
                  rows={3}
                  placeholder="A clear understanding that helps you act with confidence."
                  disabled={!user || submitStatus.loading}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#3D9B9B] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-[#4fb3b3] sm:px-2.5 sm:py-1.5"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Example</span>
                <input
                  type="text"
                  name="example"
                  value={formState.example}
                  onChange={onFormChange}
                  placeholder="Clarity turns a long list into one next step."
                  disabled={!user || submitStatus.loading}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#3D9B9B] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-[#4fb3b3] sm:px-2.5 sm:py-1.5"
                />
              </label>
            </div>

            {submitStatus.message ? (
              <p
                className={`mt-4 text-sm ${
                  submitStatus.error ? "text-red-600 dark:text-red-400" : "text-[#3D9B9B] dark:text-[#4fb3b3]"
                }`}
              >
                {submitStatus.message}
              </p>
            ) : null}

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Featured words are rotated daily.</span>
              <button
                type="submit"
                disabled={!user || submitStatus.loading}
                className="rounded-xl bg-[#3D9B9B] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#2f7878] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#2d7b7b] dark:hover:bg-[#3D9B9B]"
              >
                {submitStatus.loading ? "Submitting..." : "Submit Word"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

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
  const [wordOfDay, setWordOfDay] = useState(() => getCachedWordOfDay());
  const [communityWords, setCommunityWords] = useState(() => getCachedCommunityWords());
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showWordModal, setShowWordModal] = useState(false);
  const [wordForm, setWordForm] = useState({ word: "", meaning: "", example: "" });
  const [submitStatus, setSubmitStatus] = useState({ loading: false, error: false, message: "" });
  const dateMenuRef = useRef(null);

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

  useEffect(() => {
    let isCancelled = false;

    const loadWordOfDay = async () => {
      const [nextWord, nextCommunityWords] = await Promise.all([getWordOfDay(), getCommunityWords()]);
      if (!isCancelled) {
        setWordOfDay(nextWord);
        setCommunityWords(nextCommunityWords);
      }
    };

    void loadWordOfDay();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showDateMenu) return undefined;

    const handlePointerDown = (event) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target)) {
        setShowDateMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showDateMenu]);

  const handleGoalCardClick = () => {
    navigate("/goals");
  };

  const handleCalendarClick = () => {
    setShowDateMenu((prev) => !prev);
  };

  const handleOpenCalendarPage = () => {
    setShowDateMenu(false);
    navigate("/calendar");
  };

  const handleOpenWordModal = () => {
    setShowDateMenu(false);
    setShowWordModal(true);
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

  const handleWordFormChange = (event) => {
    const { name, value } = event.target;
    setWordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleWordSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      setSubmitStatus({
        loading: false,
        error: true,
        message: "You need to sign in before submitting a community word.",
      });
      return;
    }

    if (!wordForm.word.trim() || !wordForm.meaning.trim()) {
      setSubmitStatus({
        loading: false,
        error: true,
        message: "Word and meaning are required.",
      });
      return;
    }

    setSubmitStatus({ loading: true, error: false, message: "" });

    try {
      await submitCommunityWord({
        ...wordForm,
        submittedBy: user.id || user.name || "community-user",
      });

      const [nextWord, nextCommunityWords] = await Promise.all([getWordOfDay(), getCommunityWords()]);
      setWordOfDay(nextWord);
      setCommunityWords(nextCommunityWords);
      setWordForm({ word: "", meaning: "", example: "" });
      setSubmitStatus({
        loading: false,
        error: false,
        message: "Your word has been added to the community rotation.",
      });
    } catch (error) {
      setSubmitStatus({
        loading: false,
        error: true,
        message: error?.message || "Failed to submit word of the day.",
      });
    }
  };

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

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
            <div className="mt-4">
              <div className="relative" ref={dateMenuRef}>
                <button
                  type="button"
                  onClick={handleCalendarClick}
                  className="group flex w-full items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-[#3D9B9B] hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[#4fb3b3]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D9B9B]/10 text-[#3D9B9B] dark:bg-[#4fb3b3]/15 dark:text-[#4fb3b3]">
                    <FiCalendar className="text-[17px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      Calendar
                    </p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formattedDate}</p>
                  </div>
                  <FiChevronDown
                    className={`text-base text-gray-400 transition-transform dark:text-gray-500 ${
                      showDateMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showDateMenu ? (
                  <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    <button
                      type="button"
                      onClick={handleOpenWordModal}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <span className="flex items-center gap-3">
                        <FiBookOpen className="text-[#3D9B9B] dark:text-[#4fb3b3]" />
                        Word of the Day
                      </span>
                      <FiChevronRight className="text-gray-400 dark:text-gray-500" />
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenCalendarPage}
                      className="flex w-full items-center justify-between border-t border-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <span className="flex items-center gap-3">
                        <FiCalendar className="text-[#3D9B9B] dark:text-[#4fb3b3]" />
                        Open Calendar
                      </span>
                      <FiChevronRight className="text-gray-400 dark:text-gray-500" />
                    </button>
                  </div>
                ) : null}
              </div>
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

      <WordOfDayModal
        isOpen={showWordModal}
        onClose={() => setShowWordModal(false)}
        wordOfDay={wordOfDay}
        communityWordsCount={communityWords.length}
        formState={wordForm}
        onFormChange={handleWordFormChange}
        onSubmit={handleWordSubmit}
        submitStatus={submitStatus}
        user={user}
      />
    </div>
  );
};

export default Dashboard;
