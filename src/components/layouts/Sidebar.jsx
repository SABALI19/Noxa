import React, { useState, useEffect, useRef, useCallback } from "react";
import Button from "../Button";
import { FiBell, FiUser } from "react-icons/fi";
import { IoColorPaletteOutline } from "react-icons/io5";
import { MdOutlineShield } from "react-icons/md";
import { IoIosHelpCircleOutline } from "react-icons/io";
import { Link, useLocation } from "react-router-dom";
import { PanelLeftOpen, PanelRightOpen, Menu } from "lucide-react";

const Sidebar = ({ onToggle, isMobile, isOpen = false }) => {
  const [fabPosition, setFabPosition] = useState({ x: window.innerWidth - 72, y: 80 }); // Top right position
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const fabRef = useRef(null);
  const location = useLocation();

  // Derive collapsed state from props instead of using state
  const isCollapsed = isMobile ? true : !isOpen;

  // Initialize FAB position to top right and update on resize
  useEffect(() => {
    const updateFabPosition = () => {
      if (isMobile) {
        setFabPosition({ x: window.innerWidth - 72, y: 80 });
      }
    };
    
    updateFabPosition();
    window.addEventListener('resize', updateFabPosition);
    
    return () => window.removeEventListener('resize', updateFabPosition);
  }, [isMobile]);

  // FAB drag handlers
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: touch.clientX - fabPosition.x,
      y: touch.clientY - fabPosition.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !isMobile) return;
    e.preventDefault();
    const touch = e.touches[0];
    
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    // Check if moved more than 5px to distinguish from tap
    if (Math.abs(newX - fabPosition.x) > 5 || Math.abs(newY - fabPosition.y) > 5) {
      setHasMoved(true);
    }
    
    // Get viewport dimensions
    const maxX = window.innerWidth - 56; // 56px is the FAB width
    const maxY = window.innerHeight - 56;
    
    // Constrain to viewport
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));
    
    setFabPosition({ x: constrainedX, y: constrainedY });
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    if (!isMobile) return;
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: e.clientX - fabPosition.x,
      y: e.clientY - fabPosition.y
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !isMobile) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Check if moved more than 5px to distinguish from click
    if (Math.abs(newX - fabPosition.x) > 5 || Math.abs(newY - fabPosition.y) > 5) {
      setHasMoved(true);
    }

    // Get viewport dimensions
    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;

    // Constrain to viewport
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    setFabPosition({ x: constrainedX, y: constrainedY });
  }, [isDragging, isMobile, dragStart, fabPosition]);

  const handleMouseUp = useCallback(() => {
    if (!isMobile) return;
    setIsDragging(false);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isMobile, handleMouseMove, handleMouseUp]);

  const handleFabClick = () => {
    if (!hasMoved) {
      toggleSidebar();
    }
  };

  const menuItems = [
    { id: "account", icon: <FiUser className="text-xl" />, label: "Account", path: "/account" },
    { id: "notifications", icon: <FiBell className="text-xl" />, label: "Notifications", path: "/notifications" },
    { id: "appearance", icon: <IoColorPaletteOutline className="text-xl" />, label: "Appearance", path: "/appearance" },
    { id: "data-privacy", icon: <MdOutlineShield className="text-xl" />, label: "Settings", path: "/data-privacy" },
    { id: "help", icon: <IoIosHelpCircleOutline className="text-xl"/>, label: "Help & Support", path: "/help-support" }
  ];

  const toggleSidebar = () => {
    if (isMobile) {
      // On mobile, toggle the open state
      if (onToggle) onToggle(!isOpen);
    } else {
      // On desktop, toggle collapsed state
      if (onToggle) onToggle(isCollapsed);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (isMobile && onToggle) {
      onToggle(false);
    }
  };

  // Mobile FAB button when sidebar is closed
  if (isMobile && !isOpen) {
    return (
      <div 
        ref={fabRef}
        className="fixed z-50 cursor-move touch-none"
        style={{
          left: `${fabPosition.x}px`,
          top: `${fabPosition.y}px`,
          transition: isDragging ? 'none' : 'all 0.3s ease'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <button
          className="bg-[#3D9B9B] hover:bg-[#2d7b7b] text-white rounded-full p-4 shadow-lg active:shadow-xl transition-all duration-200"
          onClick={handleFabClick}
        >
          <Menu size={24} />
        </button>
      </div>
    );
  }

  // Mobile sidebar - slides in from left
  if (isMobile && isOpen) {
    return (
      <>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => onToggle(false)}
        />
        
        {/* Sidebar */}
        <div 
          className={`fixed left-0 top-0 h-full w-64 bg-[#f2f5f7] shadow-xl z-50 p-4 transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Close button for mobile */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => onToggle(false)}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Close sidebar"
            >
              <PanelRightOpen className="text-sm text-[#3D9B9B]" />
            </button>
          </div>

          <div className="mt-2">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              
              return (
                <Link 
                  key={item.id} 
                  to={item.path}
                  onClick={handleLinkClick}
                  className="block mb-2"
                >
                  <Button
                    variant={active ? "primary" : "secondaryPro"}
                    className={`group flex items-center hover:text-white hover:bg-[#3D9B9B] gap-4 w-full rounded-2xl p-3 ${
                      active ? "bg-[#3D9B9B] text-white" : ""
                    }`}
                  >
                    <span className={active ? "text-white" : "text-[#3D9B9B] group-hover:text-white"}>
                      {item.icon}
                    </span>
                    <p className={`${active ? "text-white" : "group-hover:text-white"} 
                      text-sm md:text-base font-medium whitespace-nowrap`}>
                      {item.label}
                    </p>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className={`${
      isCollapsed ? 'w-20' : 'w-64'
    } h-[calc(100vh-3.5rem)] bg-[#f2f5f7] p-4 transition-all duration-300 fixed left-0 top-14 z-30`}>
      {/* Collapse Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="text-sm text-[#3D9B9B]" />
          ) : (
            <PanelRightOpen className="text-sm text-[#3D9B9B]" />
          )}
        </button>
      </div>

      <div className="mt-2">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Link 
              key={item.id} 
              to={item.path}
              className="block mb-2"
            >
              <Button
                variant={active ? "primary" : "secondaryPro"}
                className={`group flex items-center hover:text-white hover:bg-[#3D9B9B] gap-4 w-full rounded-2xl ${
                  active ? "bg-[#3D9B9B] text-white" : ""
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <span className={active ? "text-white" : "text-[#3D9B9B] group-hover:text-white"}>
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <p className={`${active ? "text-white" : "group-hover:text-white"} 
                    text-sm md:text-base lg:text-lg font-medium whitespace-nowrap transition-opacity duration-300`}>
                    {item.label}
                  </p>
                )}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;