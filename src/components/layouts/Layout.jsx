import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import TaskSidebar from './TaskSidebar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/UseAuth';
import AIAssistantChat from '../ai/AIAssistantChat';
import { useTasks } from '../../context/TaskContext';
import { useNotifications } from '../../hooks/useNotifications';
import { getGoals, goalEvents, hydrateGoalsFromBackend } from '../../services/goalStorage';

const STARTUP_DIGEST_SESSION_KEY = 'noxa_startup_digest';
const PRIORITY_SCORE = { high: 3, medium: 2, low: 1 };

const readDateValue = (value) => {
  if (!value || value === 'Ongoing') return Number.POSITIVE_INFINITY;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime();
};

const StartupDigestPopup = ({
  digest,
  onDismiss,
  onOpenReminders,
  onOpenGoals,
  onAskAi,
}) => {
  if (!digest) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[85] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-3xl border border-teal-200 bg-white shadow-2xl shadow-teal-900/10 ring-1 ring-black/5 dark:border-teal-900/60 dark:bg-gray-900">
        <div className="bg-linear-to-r from-teal-500 to-cyan-500 px-5 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
            Smart Briefing
          </p>
          <h2 className="mt-1 text-xl font-semibold">{digest.title}</h2>
          <p className="mt-2 text-sm text-white/90">{digest.message}</p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-teal-50 px-4 py-3 dark:bg-teal-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
                Reminders
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {digest.reminderCount}
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                {digest.reminderLabel}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 px-4 py-3 dark:bg-amber-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                Urgent
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {digest.urgentCount}
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                due now or overdue
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-4 py-3 dark:bg-blue-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                Focus Goals
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {digest.topGoals.length}
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                active priorities today
              </p>
            </div>
          </div>

          {digest.topGoals.length > 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                Top Goals
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {digest.topGoals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => onOpenGoals(goal.id)}
                    className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition hover:bg-teal-50 hover:text-teal-700 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 dark:hover:bg-teal-950/40 dark:hover:text-teal-300"
                  >
                    {goal.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/30">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
              AI Suggestion
            </p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{digest.aiPrompt}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenReminders}
              className="rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Open reminders
            </button>
            <button
              type="button"
              onClick={() => onOpenGoals()}
              className="rounded-2xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-teal-400 hover:text-teal-700 dark:border-gray-700 dark:text-gray-200 dark:hover:border-teal-600 dark:hover:text-teal-300"
            >
              Review goals
            </button>
            <button
              type="button"
              onClick={onAskAi}
              className="rounded-2xl border border-cyan-300 px-4 py-2.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-300 dark:hover:bg-cyan-950/40"
            >
              Ask AI to plan today
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="ml-auto text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { tasks, reminders } = useTasks();
  const { addNotification } = useNotifications();
  const isTaskPage =
    location.pathname === '/tasks' ||
    location.pathname === '/notes' ||
    location.pathname === '/calendar';
  
  // Sidebar state management
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isAiAssistantEnabled, setIsAiAssistantEnabled] = useState(true);
  const [aiAssistantOpenSignal, setAiAssistantOpenSignal] = useState(0);
  const [aiAssistantCloseSignal, setAiAssistantCloseSignal] = useState(0);
  const [goals, setGoals] = useState(() => getGoals());
  const [startupDigest, setStartupDigest] = useState(null);
  const [goalsHydrated, setGoalsHydrated] = useState(false);
  const startupDigestRef = useRef('');

  useEffect(() => {
    if (!isAuthenticated) {
      setGoals([]);
      setGoalsHydrated(false);
      return undefined;
    }

    let isCancelled = false;
    const hydrate = async () => {
      const hydratedGoals = await hydrateGoalsFromBackend();
      if (!isCancelled && Array.isArray(hydratedGoals)) {
        setGoals(hydratedGoals);
        setGoalsHydrated(true);
      }
    };

    void hydrate();
    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const syncGoals = (event) => {
      const incomingGoals = event?.detail && Array.isArray(event.detail) ? event.detail : getGoals();
      setGoals(incomingGoals);
    };

    const syncFromStorage = (event) => {
      if (event.key === 'noxa_goals') {
        setGoals(getGoals());
      }
    };

    window.addEventListener(goalEvents.updated, syncGoals);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener(goalEvents.updated, syncGoals);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // On mobile, close sidebar by default
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        // On desktop, sidebar is open by default for non-task pages
        setIsSidebarOpen(!isTaskPage);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isTaskPage]);



  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (searchTerm) => {
    console.log('Searching for:', searchTerm);
  };

  const handleSidebarToggle = (open) => {
    setIsSidebarOpen(open);
  };

  const handleAiAssistantToggle = (enabled) => {
    setIsAiAssistantEnabled(enabled);
    if (!enabled) {
      setAiAssistantCloseSignal((prev) => prev + 1);
    }
  };

  const handleAiAssistantChatNow = () => {
    if (!isAiAssistantEnabled) {
      setIsAiAssistantEnabled(true);
    }
    setAiAssistantOpenSignal((prev) => prev + 1);
  };

  const startupDigestSummary = useMemo(() => {
    if (!isAuthenticated) return null;

    const now = Date.now();
    const activeReminders = (reminders || []).filter((reminder) => reminder.status !== 'completed');
    const urgentReminders = activeReminders.filter((reminder) => {
      const reminderTime = new Date(reminder.reminderTime);
      if (Number.isNaN(reminderTime.getTime())) return false;
      return reminderTime.getTime() <= now || reminder.status === 'today' || reminder.status === 'missed';
    });

    const activeGoals = (goals || [])
      .filter((goal) => !goal.completed)
      .sort((left, right) => {
        const priorityGap =
          (PRIORITY_SCORE[right.priority] || 0) - (PRIORITY_SCORE[left.priority] || 0);
        if (priorityGap !== 0) return priorityGap;
        const leftDate = readDateValue(left.targetDate);
        const rightDate = readDateValue(right.targetDate);
        if (leftDate !== rightDate) return leftDate - rightDate;
        return Number(left.progress ?? 0) - Number(right.progress ?? 0);
      })
      .slice(0, 3)
      .map((goal) => ({
        id: goal.id,
        title: goal.title || 'Untitled goal',
      }));

    const reminderCount = activeReminders.length;
    const reminderLabel =
      reminderCount === 1 ? 'active reminder waiting' : 'active reminders waiting';
    const title =
      reminderCount > 0
        ? `You have ${reminderCount} reminder${reminderCount === 1 ? '' : 's'}`
        : activeGoals.length > 0
        ? 'Your top goals are ready'
        : 'You are caught up';

    const focusMessageParts = [];
    if (urgentReminders.length > 0) {
      focusMessageParts.push(
        `${urgentReminders.length} urgent reminder${urgentReminders.length === 1 ? ' is' : 's are'} due now`
      );
    }
    if (activeGoals.length > 0) {
      focusMessageParts.push(`top goals: ${activeGoals.map((goal) => goal.title).join(', ')}`);
    }

    const message =
      focusMessageParts.join('. ') ||
      'No urgent reminders right now. Open your AI assistant if you want a quick plan for today.';

    const aiPrompt =
      urgentReminders.length > 0
        ? `Start with the urgent reminders, then focus on ${activeGoals[0]?.title || 'your highest-priority goal'}.`
        : activeGoals.length > 0
        ? `Ask the AI assistant to break down ${activeGoals[0].title} into the next action.`
        : 'You have room to plan ahead. Ask the AI assistant to draft your next set of goals.';

    return {
      title,
      message,
      aiPrompt,
      reminderCount,
      reminderLabel,
      urgentCount: urgentReminders.length,
      topGoals: activeGoals,
    };
  }, [goals, isAuthenticated, reminders]);

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated ||
      !startupDigestSummary ||
      !goalsHydrated ||
      typeof window === 'undefined'
    ) {
      return undefined;
    }

    const userId = user?.id || user?._id || user?.email || 'guest';
    const sessionKey = `${STARTUP_DIGEST_SESSION_KEY}:${userId}`;
    if (window.sessionStorage.getItem(sessionKey)) {
      return;
    }

    const summaryFingerprint = JSON.stringify({
      title: startupDigestSummary.title,
      message: startupDigestSummary.message,
      reminders: startupDigestSummary.reminderCount,
      urgent: startupDigestSummary.urgentCount,
      goals: startupDigestSummary.topGoals.map((goal) => goal.id),
    });

    if (startupDigestRef.current === summaryFingerprint) {
      return;
    }
    startupDigestRef.current = summaryFingerprint;

    const timerId = window.setTimeout(() => {
      window.sessionStorage.setItem(sessionKey, 'shown');
      setStartupDigest(startupDigestSummary);
      addNotification(
        'socket_message',
        { title: startupDigestSummary.title },
        null,
        false,
        {
          source: 'local',
          dedupeKey: `startup-digest:${userId}`,
          templateOverride: {
            title: 'Smart Briefing',
            message: startupDigestSummary.message,
            type: 'info',
          },
          originPath: '/dashboard',
        }
      );
    }, 900);

    return () => window.clearTimeout(timerId);
  }, [addNotification, authLoading, goalsHydrated, isAuthenticated, startupDigestSummary, user]);

  // Determine main content margin based on sidebar state
  const getMainContentClass = () => {
    if (isTaskPage) {
      // Task pages have their own sidebar logic
      return 'ml-0';
    }
    
    if (isMobile) {
      // On mobile, no margin - sidebar is overlay
      return 'ml-0';
    }
    
    // On desktop, adjust margin based on sidebar state
    return isSidebarOpen ? 'ml-64' : 'ml-20';
  };

  const handleOpenGoals = (goalId = null) => {
    setStartupDigest(null);
    if (goalId) {
      navigate(`/goals/${encodeURIComponent(String(goalId))}`);
      return;
    }
    navigate('/goals');
  };

  const handleOpenReminders = () => {
    setStartupDigest(null);
    navigate('/reminders');
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <StartupDigestPopup
        digest={startupDigest}
        onDismiss={() => setStartupDigest(null)}
        onOpenReminders={handleOpenReminders}
        onOpenGoals={handleOpenGoals}
        onAskAi={() => {
          setStartupDigest(null);
          handleAiAssistantChatNow();
        }}
      />
      <Header 
        onSearch={handleSearch}
        user={user}
        onLogout={logout}
        onToggleSidebar={handleToggleSidebar}
        showSidebarToggle={true}
      />
      
      <div className="flex flex-1 overflow-hidden relative bg-white dark:bg-gray-900">
        {/* Conditionally render sidebar based on route */}
        {isTaskPage ? (
          <TaskSidebar />
        ) : (
          <Sidebar 
            onToggle={handleSidebarToggle}
            isMobile={isMobile}
            isOpen={isSidebarOpen}
          />
        )}
        
        {/* Main content area where pages will render - UPDATED with dark mode */}
        <main className={`flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-300 ${getMainContentClass()}`}>
          <Outlet
            context={{
              aiAssistantEnabled: isAiAssistantEnabled,
              onAiAssistantToggle: handleAiAssistantToggle,
              onAiAssistantChatNow: handleAiAssistantChatNow
            }}
          />
        </main>

         {/* ✅ AI Assistant Chat - appears on all pages */}
        <AIAssistantChat 
          goals={goals}
          tasks={tasks}
          userContext={{ user }}
          showFab={isAiAssistantEnabled}
          openSignal={aiAssistantOpenSignal}
          closeSignal={aiAssistantCloseSignal}
        />
      </div>
      
    </div>
  );
};

export default Layout;
