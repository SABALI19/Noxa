// src/components/layouts/Header.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/UseAuth.jsx";
import Heading from "../../assets/logo-items/logo-dark-transparent.png";
import Button from "../Button";
import { FiSearch, FiMenu, FiLogOut, FiSettings, FiChevronDown, FiX, FiPlus } from "react-icons/fi";
import Input from "../common/input";
import NotificationBell from "../notifications/NotificationBell";
import CustomDropdown from "../common/CustomDropDown";
import Profile from "../common/Profile";
import AiToggle from "../settings/AiToggle";

const Header = ({
  Logo = Heading,
  height = "h-14",
  className = "",
  logoHeight = "h-12",
  logoWidth = "w-[120px]",
  altText = "Noxa",
  onSearch,
  onToggleSidebar,
  showSidebarToggle = true,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchValue, setSearchValue] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // Changed to 1024px for tablet
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchValue("");
      if (onSearch) onSearch("");
    }
  };

  const handleSearchIconClick = () => {
    if (searchValue.trim()) {
      console.log("Searching for:", searchValue);
    }
  };

  // Handle dropdown selection
  const handleDropdownSelect = (value) => {
    switch (value) {
      case "settings":
        navigate("/settings");
        break;
      case "logout":
        handleLogout();
        break;
      default:
        console.log("Selected option:", value);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    }
  };

  // Mock notifications data
  const notifications = [
    { 
      id: 1, 
      title: "Task Completed", 
      message: "Your 'Design Review' task is now complete", 
      time: "2 min ago",
      read: false,
      onClick: () => console.log("Notification 1 clicked")
    },
    { 
      id: 2, 
      title: "New Message", 
      message: "You have a new message from John", 
      time: "5 min ago",
      read: false,
      onClick: () => console.log("Notification 2 clicked")
    },
    { 
      id: 3, 
      title: "Reminder", 
      message: "Team meeting in 30 minutes", 
      time: "10 min ago",
      read: true,
      onClick: () => console.log("Notification 3 clicked")
    },
  ];

  const markAsRead = () => {
    console.log("All notifications marked as read");
  };

  const clearAllNotifications = () => {
    console.log("All notifications cleared");
  };

  return (
    <div
      className={`w-full ${height} ${className} py-4 flex items-center justify-between gap-2 md:gap-4 bg-[#edf0f2] shadow-lg shadow-blue-500/50`}
    >
      {/* Sidebar Toggle Button - Only on mobile & tablet (hidden on desktop) */}
      {showSidebarToggle && onToggleSidebar && isMobile && (
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-gray-200 ml-2 md:ml-4 lg:hidden" // lg:hidden hides on desktop
          title="Toggle sidebar"
        >
          <FiMenu className="text-xl text-gray-600" />
        </button>
      )}

      {/* Logo */}
      {Logo && !isSearchVisible && (
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <img
            src={Logo}
            alt={altText}
            className={`${logoHeight} ${logoWidth} object-contain ml-2 md:ml-8 ${
              isMobile ? 'lg:ml-8' : ''
            }`}
          />
        </div>
      )}

      {/* AI Toggle - Desktop only */}
      <div className="hidden lg:block">
        <AiToggle/>
      </div>

      {/* Quick Add Button - Desktop full button */}
      <div className="hidden lg:block">
        <Button 
          variant="primary" 
          size="sm" 
          className="rounded-lg"
          onClick={() => navigate("/tasks")}
        >
          + Quick Add
        </Button>
      </div>

      {/* Search Input - Desktop (always visible) */}
      <div className="hidden lg:block w-full max-w-md">
        <Input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Search tasks, notes, reminders..."
          icon={<FiSearch />}
          iconPosition="left"
          size="medium"
          onIconClick={handleSearchIconClick}
        />
      </div>

      {/* Mobile & Tablet Search - Toggleable (replaces other elements when active) */}
      {isMobile && isSearchVisible && (
        <div className="flex-1 mx-2">
          <Input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search..."
            icon={<FiSearch />}
            iconPosition="left"
            size="medium"
            autoFocus
            onIconClick={handleSearchIconClick}
          />
        </div>
      )}

      {/* Mobile & Tablet: Spacer to push items to the right when search is not active */}
      {isMobile && !isSearchVisible && <div className="flex-1"></div>}

      {/* Right section - Notifications and Profile */}
      <div className="flex items-center gap-2 md:gap-6 mr-2 md:mr-7">
        {/* Mobile & Tablet Search Toggle Button */}
        {isMobile && (
          <button
            onClick={toggleSearch}
            className="p-2 rounded-md hover:bg-gray-200 lg:hidden" // lg:hidden hides on desktop
            title={isSearchVisible ? "Close search" : "Search"}
          >
            {isSearchVisible ? (
              <FiX className="text-xl text-gray-600" />
            ) : (
              <FiSearch className="text-xl text-gray-400" />
            )}
          </button>
        )}

        {/* Mobile & Tablet Quick Add - Plus icon only */}
        {isMobile && !isSearchVisible && (
          <button
            onClick={() => navigate("/tasks")}
            className="p-2 rounded-md bg-gray-300 text-white hover:bg-blue-600 lg:hidden" // lg:hidden hides on desktop
            title="Quick Add"
          >
            <FiPlus className="text-xl" />
          </button>
        )}

        {/* NotificationBell - Hide on mobile when search is active */}
        {!isSearchVisible && (
          <NotificationBell
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onClearAll={clearAllNotifications}
          />
        )}

        {/* Profile - Hide on mobile when search is active */}
        {!isSearchVisible && (
          <div className="flex items-center gap-3">
            <Profile size="medium" />
            
            {/* Dropdown for other options */}
            <div className="relative">
              <CustomDropdown
                label={
                  <div className="flex items-center gap-1 cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <FiChevronDown className="w-4 h-4 text-gray-600" />
                  </div>
                }
                items={[
                  { 
                    label: "Settings", 
                    value: "settings",
                    icon: <FiSettings className="w-4 h-4 mr-2" />
                  },
                  { 
                    label: "Logout", 
                    value: "logout",
                    icon: <FiLogOut className="w-4 h-4 mr-2" />
                  },
                ]}
                onSelect={handleDropdownSelect}
                triggerClassName=""
                dropdownClassName="min-w-[160px] mt-2"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;