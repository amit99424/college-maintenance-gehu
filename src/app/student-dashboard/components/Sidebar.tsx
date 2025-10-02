"use client";

import { useState } from "react";

interface UserData {
  name?: string;
  department?: string;
  [key: string]: unknown; // optional for any extra fields
}

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  userData: UserData;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

export default function Sidebar({ activeSection, setActiveSection, userData, isOpen = true, setIsOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: "submit-complaint",
      label: "Submit Complaint",
      icon: "📝",
    },
    {
      id: "my-complaints",
      label: "My Complaints",
      icon: "📋",
    },
    {
      id: "reopen-complaints",
      label: "Reopen Complaints",
      icon: "🔄",
    },
    {
      id: "profile",
      label: "Profile",
      icon: "👤",
    },
  ];

  // Close sidebar on menu item click (for mobile)
  const handleMenuItemClick = (id: string) => {
    setActiveSection(id);
    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-10"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-transform duration-300 z-50
          ${isCollapsed ? "w-16" : "w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:w-64 md:translate-x-0
          md:border-r md:border-gray-200
          md:rounded-r-lg
          md:overflow-hidden
        `}
      >
        {/* Header */}
        <div className="p-4 border-b flex flex-col items-start justify-between space-y-1">
          {!isCollapsed && (
            <>
              <h2 className="text-lg font-semibold text-gray-800 truncate max-w-[12rem]">
                {userData.name || "Student"}
              </h2>
              <p className="text-sm text-gray-600 truncate max-w-[12rem]">
                {userData.department || "Department"}
              </p>
            </>
          )}
          {/* Removed the back button toggle here */}
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                activeSection === item.id
                  ? "bg-blue-100 text-blue-600 border-r-4 border-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-4 left-4 right-4">
          {!isCollapsed && (
            <div className="text-xs text-gray-500">
              College Maintenance System
            </div>
          )}
        </div>
      </div>
    </>
  );
}
