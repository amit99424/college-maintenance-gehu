"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, setDoc } from "firebase/firestore";
import Image from "next/image";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [category, setCategory] = useState("");
  // Removed collegeId state as per request
  const [department, setDepartment] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const supervisorCategories = [
    "Cleaning",
    "Electrical",
    "Plumbing",
    "Maintenance",
    "Lab/Server",
    "Other"
  ];

  // validation
  const validateSignup = () => {
    if (!email || !password) {
      setError("Email and Password are required.");
      return false;
    }
    if (!dob) {
      setError("Date of Birth is required.");
      return false;
    }
    if (role === "student") {
      if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
        setError(
          "Please signup with your official Student Gmail ending with @gmail.com"
        );
        return false;
      }
    }
    if (role === "staff") {
      if (!/^[a-zA-Z0-9._%+-]+@staff\.com$/.test(email)) {
        setError(
          "Please signup with your official Staff ID ending with @staff.com"
        );
        return false;
      }
    }
    if (role === "supervisor") {
      if (!/^[a-zA-Z0-9._%+-]+@sup\.com$/.test(email)) {
        setError(
          "Please signup with your official Supervisor ID ending with @sup.com"
        );
        return false;
      }
    }
    setError("");
    return true;
  };

  // signup handler
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;

    if (role === "supervisor" && !category) {
      setError("Please select a category for supervisor role.");
      return;
    }

    setIsLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userData = {
        email,
        role,
        name: name.trim(),
        createdAt: new Date().toISOString(),
        dob,
      };

      if (role !== "staff" && role !== "supervisor" && role !== "maintenance") {
        userData.department = department.trim();
      }

      if (role === "supervisor") {
        userData.category = category;
      }

      await setDoc(doc(db, "users", userCred.user.uid), userData);

      // ✅ After signup → go to login page
      router.push("/login");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email already registered.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/signup-bg.png"
          alt="Background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-4">
        <div className="w-[90%] sm:w-full max-w-md bg-white/20 backdrop-transparent-lg rounded-2xl shadow-2xl border border-white/20 animate-fadeInZoom">
          {/* Logo Area */}
          <div className="bg-blue-200 rounded-t-2xl p-4 flex justify-center items-center shadow-inner">
            <Image
              src="/university-logo.png"
              alt="University Logo"
              width={400}
              height={100}
              className="w-72 sm:w-96 h-auto"
              priority
            />
          </div>
          <form
            onSubmit={handleSignup}
            className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-6 md:p-8"
          >
            {/* Full Name */}
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-6 8a6 6 0 1112 0H4z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 p-3 text-sm sm:text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:shadow-lg focus:shadow-blue-400/50 bg-white/90 text-gray-900 shadow-md transition-all duration-300"
              />
            </div>

            {/* Department */}
            {(role !== "staff" &&
              role !== "supervisor" &&
              role !== "maintenance") && (
              <div className="relative w-full">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full pl-10 p-3 text-sm sm:text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:shadow-lg focus:shadow-blue-400/50 bg-white/90 text-gray-900 shadow-md transition-all duration-300"
                />
              </div>
            )}

            {/* DOB */}
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <input
                id="dob"
                type="text"
                placeholder="Enter DOB (dd-mm-yyyy)"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-full pl-10 p-3 text-sm sm:text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:shadow-lg focus:shadow-blue-400/50 bg-white/90 text-gray-900 shadow-md transition-all duration-300"
              />
            </div>

            {/* Role */}
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setCategory("");
              }}
              className="w-full p-3 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="student">Student</option>
              <option value="staff">Staff</option>
              <option value="supervisor">Supervisor</option>
              <option value="maintenance">Maintenance</option>
            </select>

            {/* Supervisor Category */}
            {role === "supervisor" && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full p-3 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">Select Category</option>
                {supervisorCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Email */}
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M2.94 6.94a1.5 1.5 0 012.12 0L10 11.88l4.94-4.94a1.5 1.5 0 112.12 2.12l-6 6a1.5 1.5 0 01-2.12 0l-6-6a1.5 1.5 0 010-2.12z" />
                </svg>
              </span>
              <input
                type="email"
                placeholder={
                  role === "student"
                    ? "Student Email (ending with @gmail.com)"
                    : role === "staff"
                    ? "Staff Email (ending with @staff.com)"
                    : role === "supervisor"
                    ? "Supervisor Email (ending with @sup.com)"
                    : "Maintenance Email"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 p-3 text-sm sm:text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:shadow-lg focus:shadow-blue-400/50 bg-white/90 text-gray-900 shadow-md transition-all duration-300"
              />
            </div>

            {/* Password */}
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 11v2a5 5 0 01-10 0v-2"
                  />
                </svg>
              </span>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 p-3 text-sm sm:text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:shadow-lg focus:shadow-blue-400/50 bg-white/90 text-gray-900 shadow-md transition-all duration-300"
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs sm:text-sm text-red-600 font-medium text-center">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 text-sm sm:text-base rounded-lg text-white font-semibold transition-colors ${
                isLoading
                  ? "bg-blue-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "Processing..." : "SIGN UP"}
            </button>

            {/* Login Link */}
            <p className="text-center text-xs sm:text-sm text-gray-600 mt-2">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-blue-600 hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
} 
