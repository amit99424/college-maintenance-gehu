"use client";

import { useState, useEffect } from "react";
import EnhancedDropdown from "./EnhancedDropdown";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "@/firebase/config";

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
  onLogout?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

export default function Sidebar({ activeSection, setActiveSection, userData, isOpen = true, setIsOpen, onLogout }: SidebarProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setUnreadCount(querySnapshot.size);
    });

    return () => unsubscribe();
  }, []);

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
          className="fixed inset-0 bg-black/40 md:hidden z-10"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full bg-white transition-transform duration-300 z-50
          w-64
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:w-64 md:translate-x-0
          md:border-r md:border-gray-200
          md:rounded-r-lg
          md:overflow-hidden
        `}
      >
        {/* Header */}
        <div className="p-4 border-b flex flex-col items-start justify-between space-y-1" style={{ backgroundColor: 'var(--sidebar-hover)' }}>
          <h2 className="text-lg font-semibold truncate max-w-[12rem]" style={{ color: 'white' }}>
            {userData.name || "Student"}
          </h2>
          <p className="text-sm truncate max-w-[12rem]" style={{ color: 'white' }}>
            {userData.department || "Department"}
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-4 space-y-3">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`classic-card p-1 ${
                activeSection === item.id ? "border-2" : ""
              }`}
              style={activeSection === item.id ? { borderColor: 'var(--sidebar-hover)' } : {}}
            >
              <button
                onClick={() => handleMenuItemClick(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors rounded-md ${
                  activeSection === item.id
                    ? "classic-btn"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                style={activeSection === item.id ? {} : { color: 'var(--paragraph-text)' }}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          <div className="classic-card p-1">
            <button
              onClick={() => handleMenuItemClick("change-password")}
              className="w-full flex items-center px-4 py-3 text-left transition-colors rounded-md text-gray-700 hover:bg-gray-100"
              style={{ color: 'var(--paragraph-text)' }}
            >
              <span className="text-lg mr-3">🔑</span>
              <span className="font-medium">Change Password</span>
            </button>
          </div>
          <div className="classic-card p-1">
            <button
              onClick={() => {
                if (setIsOpen) setIsOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full flex items-center px-4 py-3 text-left transition-colors rounded-md text-red-700 hover:bg-red-100"
            >
              <span className="text-lg mr-3">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
          <div className="text-xs pt-2 text-center" style={{ color: 'var(--paragraph-text)' }}>
            College Maintenance System
          </div>
        </div>
      </div>
    </>
  );
}