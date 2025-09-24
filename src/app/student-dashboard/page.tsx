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
  [key: string]: unknown; // optional for any extra fields
}

export default function StudentDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] = useState("submit-complaint");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Get user data from localStorage
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
        // Safely render Profile only if userData is available
        return userData ? <Profile userData={userData} /> : (
          <div className="text-center text-gray-500">
            Loading profile...
          </div>
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          userData={userData ?? {}}
        />

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Student Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {userData?.name || "Student"}!
              </p>
            </div>

            {renderActiveSection()}
          </div>
        </div>
      </div>
    </div>
  );
}