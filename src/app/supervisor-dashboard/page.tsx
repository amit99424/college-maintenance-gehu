"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, DocumentData, updateDoc } from "firebase/firestore";
import { Toaster } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "./components/Sidebar";
import DashboardHome from "./components/DashboardHome";
import ComplaintsTable from "./components/ComplaintsTable";
import Analytics from "./components/Analytics";
import Profile from "./components/Profile";
import ChangePassword from "./components/ChangePassword";
import Notifications from "./components/Notifications";
import NotificationDropdown from "@/components/NotificationDropdown";

interface UserData {
  name?: string;
  email?: string;
  role?: string;
  category?: string;
  profileImage?: string;
  uid?: string;
  [key: string]: unknown;
}

export default function SupervisorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  interface Notification {
    id: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  }

  useEffect(() => {
    // Check localStorage first
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      console.log("DEBUG: Supervisor dashboard userData loaded from localStorage:", parsedUserData);
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

  useEffect(() => {
    if (!userData?.uid) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userData.uid),
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
  }, [userData?.uid]);

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
        return <DashboardHome category={userData?.category} setActiveSection={setActiveSection} />;
      case "my-complaints":
        return <ComplaintsTable category={userData?.category} userData={userData || undefined} />;
      case "analytics":
        return <Analytics category={userData?.category} />;
      case "notifications":
        return <Notifications />;
      case "profile":
        {console.log("SupervisorDashboard userData:", userData);}
        return userData ? <Profile userData={userData} /> : <div>Loading profile...</div>;
      case "change-password":
        return <ChangePassword onSuccess={() => setActiveSection("profile")} />;
      default:
        return <DashboardHome category={userData?.category} setActiveSection={setActiveSection} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white transition-colors duration-300">
      {/* Sidebar for desktop */}
      <aside className="hidden md:block w-64 fixed top-0 left-0 h-full bg-white shadow-lg z-40 transition-colors duration-300">
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
        className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />
        {/* Sidebar Panel */}
        <aside
          className={`relative w-64 bg-white shadow-xl h-full z-50 transition-transform duration-300 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
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
      <main className="flex-grow min-w-0 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="sticky top-0 z-20 pb-4 mb-6 border-b border-gray-200 flex items-center justify-between bg-white p-4 rounded-lg shadow-md transition-all duration-300">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 font-poppins">
            {userData?.category ? `${userData.category} Supervisor Dashboard` : "Supervisor Dashboard"}
          </h1>
          <div className="relative flex items-center space-x-3 z-50">
            <NotificationDropdown
              notifications={notifications}
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(!isNotificationOpen)}
              onClearAll={handleClearAll}
            />

            {/* Hamburger menu button for mobile */}
            <button
              aria-label="Toggle sidebar"
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Active Section */}
        <div className="animate-fade-in">
          {renderActiveSection()}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
