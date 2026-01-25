import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import TaskSidebar from './TaskSidebar';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/UseAuth';

const Layout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isTaskPage = location.pathname === '/tasks';
  
  // Sidebar state management
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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

  // Update sidebar state when route changes
  useEffect(() => {
    if (isMobile) {
      // Close sidebar on mobile when navigating
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSidebarOpen(false);
    } else {
      // On desktop, sidebar is open for non-task pages, closed for task pages
      setIsSidebarOpen(!isTaskPage);
    }
  }, [location.pathname, isMobile, isTaskPage]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (searchTerm) => {
    console.log('Searching for:', searchTerm);
  };

  const handleSidebarToggle = (open) => {
    setIsSidebarOpen(open);
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
    <div className="flex flex-col h-screen">
      <Header 
        onSearch={handleSearch}
        user={user}
        onLogout={logout}
        onToggleSidebar={handleToggleSidebar}
        showSidebarToggle={true}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
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
        
        {/* Main content area where pages will render */}
        <main className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${getMainContentClass()}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;