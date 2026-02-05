// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layouts/Layout";
import Dashboard from "./pages/DashBoard";
import Analytics from "./pages/Analytics";
import Settings from "./pages/DataPrivacy";
import GoalsFormWrapper from './forms/GoalsFormWrapper';
import GoalsPage from "./pages/GoalPage";
import GoalDetailsPage from "./pages/GoalDetailsPage";
import GoalProgressPage from "./pages/GoalProgressPage";
import TaskPage from "./pages/TaskPage";
import ReminderPage from "./pages/ReminderPage";
import LandingPage from "./pages/LandingPage";
import AccountPage from './pages/AccountPage';
import NotificationsPage from './pages/NotificationPageSettings';
import AppearancePage from './pages/AppearancePage';
import DataPrivacy from './pages/DataPrivacy';
import HelpSupportPage from './pages/HelpSupportPage';
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationTrackingProvider } from "./context/NotificationTrackingContext";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/UseAuth";
import { TaskProvider } from "./context/TaskContext";
import HowItWorksModal from "./components/HowItWorksModal";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3D9B9B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  return children;
};

const AuthRedirect = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/landing" replace />
  );
};

function App() {
  return (
    <BrowserRouter>
      <TaskProvider>
        <AuthProvider>
        <NotificationProvider>
          <NotificationTrackingProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/howitworks" element={<HowItWorksModal />} />
              <Route path="/login" element={<Navigate to="/landing" replace />} />

              {/* Redirect root to landing or dashboard based on auth */}
              <Route path="/" element={<AuthRedirect />} />

              {/* Protected Routes with Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="goals" element={<GoalsPage />} />
                <Route path="goals/new" element={<GoalsFormWrapper mode="create" />} />
                <Route path="goals/:id/edit" element={<GoalsFormWrapper mode="edit" />} />
                <Route path="tasks" element={<TaskPage />} />
                <Route path="reminders" element={<ReminderPage />} />
                <Route path="goals/:goalId" element={<GoalDetailsPage />} />
                <Route path="goals/:goalId/track" element={<GoalProgressPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="notifications" element={<NotificationsPage />} />  
                <Route path="appearance" element={<AppearancePage />} />
                <Route path="data-privacy" element={<DataPrivacy />} />
                <Route path="help-support" element={<HelpSupportPage />} />
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationTrackingProvider>
        </NotificationProvider>
      </AuthProvider>
      </TaskProvider>
    </BrowserRouter>
  );
}

export default App;