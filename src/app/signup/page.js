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
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{ overscrollBehavior: "none" }}
    >
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
      <div
        className="relative z-10 flex flex-col justify-center items-center min-h-screen px-4 sm:px-6 lg:px-8 py-8"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "none" }}
      >
        <div className="w-full max-w-lg sm:max-w-md mx-4 bg-white/50 rounded-lg shadow-2xl border border-gray-200">
          {/* Logo Area */}
          <div className="bg-blue-200 rounded-t-lg p-4 flex justify-center items-center shadow-inner">
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
            className="flex flex-col gap-4 sm:gap-5 p-6 sm:p-8"
          >

            {/* Form Fields */}
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-3 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />

            {(role !== "staff" &&
              role !== "supervisor" &&
              role !== "maintenance") && (
              <>
                <input
                  type="text"
                  placeholder="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full p-3 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </>
            )}
            <div>
              <input
                id="dob"
                type="date"
                placeholder="dd-mm-yyyy"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-full p-3 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>

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
              className="w-full p-3 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />

            {error && (
              <div className="text-red-600 text-xs sm:text-sm text-center font-semibold">
                {error}
              </div>
            )}

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

            <div className="text-xs sm:text-sm text-center text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 hover:underline">
                Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}