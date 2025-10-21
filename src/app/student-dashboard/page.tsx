"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, DocumentData, Timestamp } from "firebase/firestore";
import Sidebar from "./components/Sidebar";
import ComplaintForm from "./components/ComplaintForm";
import ComplaintsList from "./components/ComplaintsList";
import ReopenComplaint from "./components/ReopenComplaint";
import Profile from "./components/Profile";
import ChangePassword from "./components/ChangePassword";
import Notifications from "./components/Notifications";
import NotificationDropdown from "@/components/NotificationDropdown";

import { useTranslation } from "react-i18next";

interface UserData {
  name?: string;
  email?: string;
  role?: string;
  collegeId?: string;
  department?: string;
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

export default function StudentDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] = useState("submit-complaint");

  console.log("DEBUG: userData in StudentDashboard:", userData);
  console.log("DEBUG: activeSection in StudentDashboard:", activeSection);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    // Check localStorage first
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
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
      router.push("/login");
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsData: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        notificationsData.push({
          id: doc.id,
          message: data.message,
          timestamp: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleString() : "N/A",
          isRead: data.read || false,
        });
      });
      setNotifications(notificationsData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userData");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      const promises = notifications.map(notification =>
        updateDoc(doc(db, "notifications", notification.id), { read: true })
      );
      await Promise.all(promises);
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "submit-complaint":
        return <ComplaintForm />;
      case "my-complaints":
        return <ComplaintsList />;
      case "notifications":
        return <Notifications />;
      case "reopen-complaints":
        return <ReopenComplaint />;
      case "profile":
        return userData ? (
          <Profile userData={userData} />
        ) : (
          <div className="text-center text-gray-500">{t("loading")}</div>
        );
      case "change-password":
        return <ChangePassword onSuccess={() => setActiveSection("profile")} />;
      default:
        return <ComplaintForm />;
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
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--main-bg)' }}>

      <div className="flex">
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
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-transparent"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar Panel */}
            <aside className="relative w-64 shadow-lg h-full z-50" style={{ backgroundColor: 'var(--sidebar-bg)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
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
        )}

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
            {/* Notification Dropdown */}
            <NotificationDropdown
              notifications={notifications}
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(!isNotificationOpen)}
              onClearAll={handleClearAll}
              onMarkAsRead={handleMarkAsRead}
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
          <div className="pt-24 md:pt-24">
            {renderActiveSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
