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
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

export default function Sidebar({ activeSection, setActiveSection, userData }: SidebarProps) {
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

  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 ${
      isCollapsed ? "w-16" : "w-64"
    }`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {userData.name || "Student"}
              </h2>
              <p className="text-sm text-gray-600">
                {userData.department || "Department"}
              </p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
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
          <div className="text-xs text-gray-500 text-center">
            College Maintenance System
          </div>
        )}
      </div>
    </div>
  );
}