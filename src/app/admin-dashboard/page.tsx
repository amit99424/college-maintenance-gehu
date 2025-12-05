"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, DocumentData, updateDoc } from "firebase/firestore";
import { Toaster } from "sonner";
import Sidebar from "./components/Sidebar";
import DashboardHome from "./components/DashboardHome";
import AllComplaintsTable from "./components/AllComplaintsTable";
import SupervisorUpdates from "./components/SupervisorUpdates";
import Analytics from "./components/Analytics";
import Profile from "./components/Profile";
import ChangePassword from "./components/ChangePassword";
import NotificationDropdown from "@/components/NotificationDropdown";

import { useTranslation } from "react-i18next";

interface UserData {
  name?: string;
  email?: string;
  role?: string;
  profileImage?: string;
  uid?: string;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);



  useEffect(() => {
    // Check localStorage first
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      console.log("DEBUG: Admin dashboard userData loaded from localStorage:", parsedUserData);
      setUserData(parsedUserData);
      setLoading(false);

      // Try to sync with Firebase Auth
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
        }
      });

      return () => unsubscribe();
    } else {
      // No userData in localStorage, redirect to login
      console.log("DEBUG: No userData in localStorage, redirecting to login");
      router.push("/login");
      setLoading(false);
    }
  }, []);

  // Fetch notifications for admin
  useEffect(() => {
    if (!userData) return;

    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsMap = new Map();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const complaintId = data.complaintId;
        if (!notificationsMap.has(complaintId)) {
          notificationsMap.set(complaintId, {
            id: doc.id,
            message: data.message,
            timestamp: data.createdAt?.toDate?.()?.toLocaleString() || new Date().toLocaleString(),
            isRead: data.read || false,
          });
        }
      });
      setNotifications(Array.from(notificationsMap.values()));
    });

    return () => unsubscribe();
  }, [userData]);





  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userData");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardHome setActiveSection={setActiveSection} setStatusFilter={setStatusFilter} />;
      case "all-complaints":
        return <AllComplaintsTable initialStatusFilter={statusFilter} />;
      case "supervisor-updates":
        return <SupervisorUpdates />;
      case "analytics":
        return <Analytics />;

      case "profile":
        return userData ? <Profile userData={userData} /> : <div>{t("loading")}</div>;
      case "change-password":
        return <ChangePassword onSuccess={() => setActiveSection("profile")} />;
      default:
        return <DashboardHome setActiveSection={setActiveSection} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t("loading")}</div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--main-bg)' }}>
      {/* Sidebar for desktop */}
      <aside className="hidden md:block w-64 fixed top-0 left-0 h-full shadow-md z-40" style={{ backgroundColor: 'var(--sidebar-bg)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          userData={userData ?? {}}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onLogout={handleLogout}
        />
      </aside>

      {/* Sidebar for mobile (slide-in) */}
      <div
        className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0"
            }`}
          onClick={() => setIsSidebarOpen(false)}
        />
        {/* Sidebar Panel */}
        <aside
          className={`relative w-64 shadow-lg h-full z-50 transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          style={{ backgroundColor: 'var(--sidebar-bg)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
        >
          <Sidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            userData={userData ?? {}}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            onLogout={handleLogout}
          />
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-2 md:p-4 w-full">
        {/* Header */}
        <div
          className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-21 px-4 md:px-8 border-b bg-white shadow-md md:pl-72"
        >
          {/* Logo Section */}
        <div className="flex items-center space-x-3 -ml-10">
          <img
            src="/university-logo.png"
            alt="University Logo"
            className="h-15 w-auto object-contain"
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <NotificationDropdown
              notifications={notifications}
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(!isNotificationOpen)}
              onClearAll={() => setNotifications([])}
              onMarkAsRead={(id: string) => {
                // Mark as read logic
                setNotifications(prev =>
                  prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                );
              }}
            />

            {/* Hamburger menu button for mobile */}
            <button
              aria-label="Toggle sidebar"
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Active Section */}
        <div className="animate-fade-in pt-24 md:pt-24">
          {renderActiveSection()}
        </div>
      </main>
      <Toaster />
    </div>
  );
}