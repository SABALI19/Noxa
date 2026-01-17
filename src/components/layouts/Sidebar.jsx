import React, { useState, useEffect } from "react";
import Button from "../Button";
import { FiBell, FiUser } from "react-icons/fi";
import { IoColorPaletteOutline } from "react-icons/io5";
import { MdOutlineShield } from "react-icons/md";
import { IoIosHelpCircleOutline } from "react-icons/io";
import { Link, useLocation } from "react-router-dom";
import { PanelLeftOpen, PanelRightOpen } from "lucide-react";

const Sidebar = ({ onToggle, isMobile, isOpen = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  
  // Sync with isOpen prop and handle mobile behavior
  useEffect(() => {
    if (isMobile) {
      // On mobile, always use collapsed state (icons only)
      setIsCollapsed(true);
    } else {
      // On desktop, use isOpen prop to determine collapsed state
      setIsCollapsed(!isOpen);
    }
  }, [isMobile, isOpen]);

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
      setIsCollapsed(!isCollapsed);
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

  // Mobile sidebar - slides in from left without overlay
  if (isMobile) {
    return (
      <div 
        className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-20 bg-[#f2f5f7] shadow-lg z-40 p-4 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button for mobile */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleSidebar}
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
                  className={`group flex items-center justify-center hover:text-white hover:bg-[#3D9B9B] w-full rounded-2xl p-3 ${
                    active ? "bg-[#3D9B9B] text-white" : ""
                  }`}
                >
                  <span className={active ? "text-white" : "text-[#3D9B9B] group-hover:text-white"}>
                    {item.icon}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
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