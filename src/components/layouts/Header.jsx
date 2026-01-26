// src/components/layouts/Header.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/UseAuth.jsx";
import { useTasks } from "../../context/TaskContext.jsx";
import Heading from "../../assets/logo-items/logo-dark-transparent.png";
import Button from "../Button";
import { 
  FiSearch, 
  FiLogOut, 
  FiSettings, 
  FiChevronDown, 
  FiX, 
  FiPlus,
  FiFilter,
  FiXCircle
} from "react-icons/fi";
import Input from "../common/input";
import NotificationBell from "../notifications/NotificationBell";
import CustomDropdown from "../common/CustomDropDown";
import Profile from "../common/Profile";
import AiToggle from "../settings/AiToggle";
import SearchFiltersDropdown from "../common/SearchFiltersDropdown.jsx"; // We'll create this

const Header = ({
  Logo = Heading,
  height = "h-14",
  className = "",
  logoHeight = "h-12",
  logoWidth = "w-[120px]",
  altText = "Noxa",
  onSearch,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { tasks, updateFilters, resetFilters, filters: contextFilters } = useTasks();
  
  const [searchValue, setSearchValue] = useState(contextFilters.searchTerm || "");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    category: contextFilters.activeCategory,
    priority: contextFilters.activePriority,
    status: contextFilters.statusFilter,
  });
  
  const filtersRef = useRef(null);
  
  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tasks based on search and filters
  const filterTasks = useCallback((tasksList, searchTerm, filters) => {
    if (!searchTerm && !filters.category && !filters.priority && !filters.status) {
      return tasksList;
    }

    return tasksList.filter(task => {
      // Text search
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by category
      const matchesCategory = !filters.category || task.category === filters.category;
      
      // Filter by priority
      const matchesPriority = !filters.priority || task.priority === filters.priority;
      
      // Filter by status
      const matchesStatus = !filters.status || (
        filters.status === 'completed' ? task.completed :
        filters.status === 'overdue' ? (
          task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
        ) :
        filters.status === 'pending' ? !task.completed : true
      );

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });
  }, []);

  // Handle search change with real-time filtering
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Apply real-time filtering across the app
    const filteredTasks = filterTasks(tasks, value, searchFilters);
    
    // Update URL if we're on a tasks page
    if (location.pathname.includes('/tasks') || location.pathname.includes('/goals')) {
      const searchParams = new URLSearchParams();
      if (value) searchParams.set('search', value);
      if (searchFilters.category) searchParams.set('category', searchFilters.category);
      if (searchFilters.priority) searchParams.set('priority', searchFilters.priority);
      if (searchFilters.status) searchParams.set('status', searchFilters.status);
      
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    }
    
    // Call parent onSearch if provided
    if (onSearch) {
      onSearch(value, searchFilters, filteredTasks);
    }
    
    // Update context filters
    updateFilters({
      searchTerm: value,
      activeCategory: searchFilters.category,
      activePriority: searchFilters.priority,
      statusFilter: searchFilters.status
    });
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...searchFilters,
      [filterType]: searchFilters[filterType] === value ? null : value
    };
    setSearchFilters(newFilters);
    
    // Apply filtering with current search value
    const filteredTasks = filterTasks(tasks, searchValue, newFilters);
    
    // Update context
    updateFilters({
      searchTerm: searchValue,
      activeCategory: newFilters.category,
      activePriority: newFilters.priority,
      statusFilter: newFilters.status
    });
    
    // Update URL
    if (location.pathname.includes('/tasks') || location.pathname.includes('/goals')) {
      const searchParams = new URLSearchParams();
      if (searchValue) searchParams.set('search', searchValue);
      if (newFilters.category) searchParams.set('category', newFilters.category);
      if (newFilters.priority) searchParams.set('priority', newFilters.priority);
      if (newFilters.status) searchParams.set('status', newFilters.status);
      
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    }
    
    // Call parent onSearch if provided
    if (onSearch) {
      onSearch(searchValue, newFilters, filteredTasks);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchFilters({
      category: null,
      priority: null,
      status: null,
    });
    resetFilters();
    
    // Update URL
    if (location.pathname.includes('/tasks') || location.pathname.includes('/goals')) {
      const searchParams = new URLSearchParams();
      if (searchValue) searchParams.set('search', searchValue);
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    }
    
    if (onSearch) {
      onSearch(searchValue, {}, tasks);
    }
  };

  // Remove specific filter
  const removeFilter = (filterType) => {
    handleFilterChange(filterType, null);
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchValue("");
      clearAllFilters();
    }
  };

  const handleSearchIconClick = () => {
    if (searchValue.trim()) {
      console.log("Searching for:", searchValue, "with filters:", searchFilters);
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

  // Check if we have any active filters
  const hasActiveFilters = searchFilters.category || searchFilters.priority || searchFilters.status;
  const hasActiveSearch = searchValue.trim() !== '';

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
      {/* Logo */}
      {Logo && !isSearchVisible && (
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <img
            src={Logo}
            alt={altText}
            className={`${logoHeight} ${logoWidth} object-contain ml-2 md:ml-8`}
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

      {/* Desktop Search with Filters */}
      <div className="hidden lg:flex items-center justify-center flex-1 px-4 mt-" ref={filtersRef}>
  <div className="relative w-full max-w-2xl">
    <div className="flex gap-2 mt-7">
      <div className="flex-1  relative">
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
        
        {/* Filter button on desktop search */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md ${
            hasActiveFilters 
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title="Filter search results"
        >
          <FiFilter className="text-lg" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {Object.values(searchFilters).filter(Boolean).length}
            </span>
          )}
        </button>
      </div>
    </div>
    
    {/* Active filters display */}
    {(hasActiveSearch || hasActiveFilters) && (
      <div className="mt-2 flex flex-wrap gap-2">
        {searchValue && (
          <div className="flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
            <span>Search: "{searchValue}"</span>
            <button
              onClick={() => setSearchValue("")}
              className="text-gray-600 hover:text-gray-800"
            >
              <FiXCircle size={12} />
            </button>
          </div>
        )}
        {searchFilters.category && (
          <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
            <span>Category: {searchFilters.category}</span>
            <button
              onClick={() => removeFilter('category')}
              className="text-purple-600 hover:text-purple-800"
            >
              <FiXCircle size={12} />
            </button>
          </div>
        )}
        {searchFilters.priority && (
          <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">
            <span>Priority: {searchFilters.priority}</span>
            <button
              onClick={() => removeFilter('priority')}
              className="text-amber-600 hover:text-amber-800"
            >
              <FiXCircle size={12} />
            </button>
          </div>
        )}
        {searchFilters.status && (
          <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            <span>Status: {searchFilters.status}</span>
            <button
              onClick={() => removeFilter('status')}
              className="text-blue-600 hover:text-blue-800"
            >
              <FiXCircle size={12} />
            </button>
          </div>
        )}
        {(searchValue || hasActiveFilters) && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-600 hover:text-gray-900 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
    )}
    
    {/* Filters dropdown */}
    {showFilters && (
      <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4">
        <SearchFiltersDropdown
          currentFilters={searchFilters}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      </div>
    )}
  </div>
</div>

      {/* Mobile & Tablet Search - Toggleable */}
      {isMobile && isSearchVisible && (
        <div className="flex-1 mx-2 mt-7" ref={filtersRef}>
          <div className="relative">
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
            
            {/* Filter button on mobile search */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-md ${
                hasActiveFilters 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="Filter search results"
            >
              <FiFilter className="text-lg" />
            </button>
          </div>
          
          {/* Active filters display for mobile */}
          {(hasActiveSearch || hasActiveFilters) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {searchValue && (
                <div className="flex items-center gap-1 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                  <span>" {searchValue} "</span>
                  <button
                    onClick={() => setSearchValue("")}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <FiXCircle size={10} />
                  </button>
                </div>
              )}
              {Object.entries(searchFilters)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <div key={key} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    key === 'category' ? 'bg-purple-100 text-purple-800' :
                    key === 'priority' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    <span className="truncate max-w-[80px]">
                      {key}: {value}
                    </span>
                    <button
                      onClick={() => removeFilter(key)}
                      className="flex-shrink-0"
                    >
                      <FiXCircle size={10} />
                    </button>
                  </div>
                ))}
            </div>
          )}
          
          {/* Filters dropdown for mobile */}
          {showFilters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-sm max-h-[80vh] overflow-y-auto">
                <SearchFiltersDropdown
                  currentFilters={searchFilters}
                  onFilterChange={handleFilterChange}
                  onClose={() => setShowFilters(false)}
                  isMobile={true}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile & Tablet: Spacer */}
      {isMobile && !isSearchVisible && <div className="flex-1"></div>}

      {/* Right section - Notifications and Profile */}
      <div className="flex items-center gap-2 md:gap-6 mr-2 md:mr-7">
        {/* Mobile & Tablet Search Toggle Button */}
        {isMobile && (
          <button
            onClick={toggleSearch}
            className="p-2 rounded-md hover:bg-gray-200 lg:hidden"
            title={isSearchVisible ? "Close search" : "Search"}
          >
            {isSearchVisible ? (
              <FiX className="text-xl text-gray-600" />
            ) : (
              <FiSearch className="text-xl text-gray-400" />
            )}
          </button>
        )}

        {/* Mobile & Tablet Quick Add */}
        {isMobile && !isSearchVisible && (
          <button
            onClick={() => navigate("/tasks")}
            className="p-2 rounded-md  text-gray-400 hover:bg-blue-100 lg:hidden"
            title="Quick Add"
          >
            <FiPlus className="text-xl" />
          </button>
        )}

        {/* NotificationBell */}
        {!isSearchVisible && (
          <NotificationBell
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onClearAll={clearAllNotifications}
          />
        )}

        {/* Profile */}
        {!isSearchVisible && (
          <div className="flex items-center gap-3">
            <Profile size="medium" />
            
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