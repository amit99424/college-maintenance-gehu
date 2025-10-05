"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { Toaster } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "./components/Sidebar";
import DashboardHome from "./components/DashboardHome";
import ComplaintsTable from "./components/ComplaintsTable";
import Analytics from "./components/Analytics";
import Profile from "./components/Profile";
import ChangePassword from "./components/ChangePassword";

interface UserData {
  name?: string;
  email?: string;
  role?: string;
  category?: string;
  department?: string;
  profileImage?: string;
  uid?: string;
  [key: string]: unknown;
}

export default function SupervisorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Close notification popup on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("#notification-popup") && !target.closest("#notification-button")) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          localStorage.setItem("userData", JSON.stringify(userDoc.data()));
        } else {
          setUserData(null);
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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
        return <ComplaintsTable category={userData?.category} />;
      case "analytics":
        return <Analytics category={userData?.category} />;
      case "profile":
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

  if (!user) {
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
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Sidebar Panel */}
          <aside className="relative w-64 bg-white shadow-xl h-full z-50 transition-colors duration-300">
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
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="sticky top-0 z-20 pb-4 mb-6 border-b border-gray-200 flex items-center justify-between bg-white p-4 rounded-lg shadow-md transition-all duration-300">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 font-poppins">
            {userData?.category ? `${userData.category} Supervisor Dashboard` : "Supervisor Dashboard"}
          </h1>
          <div className="relative flex items-center space-x-3 z-50">
            {/* Notification Bell */}
            <button
              id="notification-button"
              aria-label="Notifications"
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 z-50"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification badge */}
              <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            </button>

            {/* Notification Popup */}
            {showNotifications && (
              <div
                id="notification-popup"
                className="absolute right-0 mt-2 w-96 bg-white border border-gray-300 rounded-lg shadow-xl z-40"
                role="dialog"
                aria-modal="true"
                aria-labelledby="notification-title"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 id="notification-title" className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h2>
                  <button
                    aria-label="Close notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    <li className="p-4 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                      <span className="inline-block bg-blue-100 text-blue-800 rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20h.01M12 4h.01" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">New complaint assigned</p>
                        <p className="text-xs text-gray-500">5 minutes ago</p>
                      </div>
                    </li>
                    <li className="p-4 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                      <span className="inline-block bg-green-100 text-green-800 rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Complaint resolved</p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </li>
                    <li className="p-4 hover:bg-gray-50 cursor-pointer flex items-center space-x-3">
                      <span className="inline-block bg-yellow-100 text-yellow-800 rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Pending complaint reminder</p>
                        <p className="text-xs text-gray-500">Yesterday</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            )}
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
