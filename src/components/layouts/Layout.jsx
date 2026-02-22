import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import TaskSidebar from './TaskSidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/UseAuth';
import AIAssistantChat from '../ai/AIAssistantChat';

const Layout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
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

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
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
          goals={[]} // You can pass actual goals/tasks data if available
          tasks={[]} 
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
