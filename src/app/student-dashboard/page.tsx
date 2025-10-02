"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase/config";
import Sidebar from "./components/Sidebar";
import ComplaintForm from "./components/ComplaintForm";
import ComplaintsList from "./components/ComplaintsList";
import ReopenComplaint from "./components/ReopenComplaint";
import Profile from "./components/Profile";

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

export default function StudentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] = useState("submit-complaint");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const storedUserData = localStorage.getItem("userData");
        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case "submit-complaint":
        return <ComplaintForm />;
      case "my-complaints":
        return <ComplaintsList />;
      case "reopen-complaints":
        return <ReopenComplaint />;
      case "profile":
        return userData ? (
          <Profile userData={userData} />
        ) : (
          <div className="text-center text-gray-500">Loading profile...</div>
        );
      default:
        return <ComplaintForm />;
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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar for desktop */}  
      <aside className="hidden md:block w-64 fixed top-0 left-0 h-full bg-blue-100 shadow-md z-40">
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          userData={userData ?? {}}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
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
          <aside className="relative w-64 bg-blue-100 shadow-lg h-full z-50">
            <Sidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              userData={userData ?? {}}
              isOpen={isSidebarOpen}
              setIsOpen={setIsSidebarOpen}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {/* Header */}  
        <div className="sticky top-0 z-20 pb-4 mb-6 border-b flex items-center justify-between bg-blue-400 p-4 rounded">
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-950">
              Student Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {userData?.name || "Student"}!
            </p>
          </div>

          {/* Hamburger for Mobile */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-200 bg-gray-700 text-white shadow-md"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        {/* Active Section */}
        {renderActiveSection()}
      </main>
    </div>
  );
}