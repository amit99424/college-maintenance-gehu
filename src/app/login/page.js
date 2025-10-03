"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const MAINTENANCE_KEY = "gehuservice@04";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState("");
  const [refreshingCaptcha, setRefreshingCaptcha] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // modal states
  const [showMaintenanceKeyModal, setShowMaintenanceKeyModal] = useState(false);
  const [maintenanceKeyInput, setMaintenanceKeyInput] = useState("");
  const [pendingUser, setPendingUser] = useState(null);

  // forget password modal states
  const [showForgetPasswordModal, setShowForgetPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const router = useRouter();

  // captcha generator
  const generateCaptcha = useCallback(() => {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const numbers = "23456789";
    const allChars = letters + numbers;

    let newCaptcha = "";
    newCaptcha += letters.charAt(Math.floor(Math.random() * letters.length));
    newCaptcha += numbers.charAt(Math.floor(Math.random() * numbers.length));

    for (let i = 0; i < 4; i++) {
      newCaptcha += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    newCaptcha = newCaptcha.split("").sort(() => Math.random() - 0.5).join("");

    setCaptcha(newCaptcha);
    setCaptchaError("");
    setLastRefreshTime(Date.now());
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleCaptchaRefresh = () => {
    const now = Date.now();
    if (now - lastRefreshTime < 2000) {
      setCaptchaError("Please wait before refreshing again");
      return;
    }

    setRefreshingCaptcha(true);
    setCaptchaError("");

    setTimeout(() => {
      generateCaptcha();
      setRefreshingCaptcha(false);
    }, 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setCaptchaError("");

    try {
      const normalizedCaptchaInput = captchaInput.trim().toUpperCase();
      const normalizedCaptcha = captcha.toUpperCase();

      if (normalizedCaptchaInput !== normalizedCaptcha) {
        setCaptchaError("Wrong captcha try again");
        setAttempts((prev) => prev + 1);
        setCaptchaInput("");
        setIsLoading(false);

        // Change captcha after showing error message
        setTimeout(() => {
          generateCaptcha();
        }, 2000); // 2 seconds delay

        if (attempts >= 2) {
          setCaptchaError("Multiple failed attempts. Please wait before trying again.");
          setTimeout(() => {
            setAttempts(0);
            setCaptchaError("");
          }, 5000);
        }
        return;
      }

      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim();

      if (!emailTrimmed || !passwordTrimmed) {
        setCaptchaError("Email and password are required!");
        setIsLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        setCaptchaError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      // Query Firestore users collection for email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", emailTrimmed));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setCaptchaError("Wrong email.");
        setIsLoading(false);
        return;
      }

      // Email exists, proceed with sign-in
      const userCred = await signInWithEmailAndPassword(
        auth,
        emailTrimmed,
        passwordTrimmed
      );

      const docSnap = await getDoc(doc(db, "users", userCred.user.uid));

      if (!docSnap.exists()) {
        setCaptchaError("No user data found in database!");
        setIsLoading(false);
        return;
      }

      const userData = { ...docSnap.data(), uid: userCred.user.uid };

      localStorage.setItem("userData", JSON.stringify(userData));

      if (emailTrimmed.endsWith('@staff.com')) {
        router.push("/staff-dashboard");
      } else if (userData.role === "student") {
        router.push("/student-dashboard");
      } else if (userData.role === "supervisor") {
        router.push("/supervisor-dashboard");
      } else if (userData.role === "maintenance") {
        setPendingUser(userData);
        setShowMaintenanceKeyModal(true);
      } else {
        setCaptchaError("Unknown role. Please contact admin.");
        router.push("/");
      }
    } catch (error) {
      console.log("Login error object:", error);
      console.log("Login error code:", error.code);
      console.log("Login error message:", error.message);

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-login-credentials" ||
        (error.message && error.message.toLowerCase().includes("wrong-password"))
      ) {
        setCaptchaError("Wrong password.");
      } else if (error.code === "auth/too-many-requests") {
        setCaptchaError("Too many login attempts. Please wait a few minutes before trying again.");
      } else if (error.code === "auth/network-request-failed") {
        setCaptchaError("Network error. Please check your internet connection and try again.");
      } else if (error.code === "auth/user-disabled") {
        setCaptchaError("This account has been disabled. Please contact your administrator.");
      } else {
        setCaptchaError(`Login failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaintenanceKeySubmit = () => {
    if (maintenanceKeyInput === MAINTENANCE_KEY) {
      setShowMaintenanceKeyModal(false);
      router.push("/maintenance-dashboard");
    } else {
      alert("Invalid Maintenance Key!");
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/login-bg.png"
          alt="Background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-[90%] sm:w-full max-w-md bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-y-auto max-h-[90vh] animate-fadeInZoom">
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
          {/* Heading */}
          <div className="text-center px-4 sm:px-6 md:px-8 pt-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Login to Your Account</h1>
            <p className="text-sm text-gray-500">Welcome back! Please sign in to continue.</p>
          </div>
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-6 md:p-8"
          >

            {/* Email */}
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
                type="email"
                placeholder="Email"
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

              {/* Captcha */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-900">
                  Captcha
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCaptchaRefresh}
                    disabled={refreshingCaptcha}
                    className={`flex items-center justify-center w-10 h-10 rounded border-2 transition-all duration-200 ${
                      refreshingCaptcha
                        ? "border-gray-300 bg-gray-200 cursor-not-allowed"
                        : "border-green-500 bg-white hover:bg-green-50 cursor-pointer"
                    }`}
                    style={{
                      background: refreshingCaptcha
                        ? "#f3f4f6"
                        : "linear-gradient(45deg, #10b981, #06b6d4)",
                      border: refreshingCaptcha
                        ? "2px solid #d1d5db"
                        : "2px solid #10b981",
                    }}
                  >
                    <svg
                      className={`w-6 h-6 transition-transform duration-200 ${
                        refreshingCaptcha ? "animate-spin" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                  <div
                    className="text-lg font-bold tracking-widest px-4 py-2 rounded min-w-[100px] text-center shadow-lg text-white select-none"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%)",
                      border: "2px solid transparent",
                      boxShadow:
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      userSelect: "none",
                      MozUserSelect: "none",
                      WebkitUserSelect: "none",
                      msUserSelect: "none",
                    }}
                  >
                    {refreshingCaptcha ? "..." : captcha || "------"}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Enter Captcha"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  required
                  className="w-full p-3 text-sm sm:text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:shadow-lg focus:shadow-green-400/50 bg-white/90 text-gray-900 shadow-md transition-all duration-300"
                />
                {captchaError && (
                  <p className="text-xs sm:text-sm text-red-600 font-medium">
                    {captchaError}
                  </p>
                )}
              </div>
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
              {isLoading ? "Processing..." : "LOGIN"}
            </button>
            {/* Add Forget Password Button here */}
            {/* Removed Forget Password Button */}
            {/* <div className="text-right mt-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetMessage("");
                  setResetError("");
                  setShowForgetPasswordModal(true);
                }}
                className="text-sm text-blue-600 hover:underline focus:outline-none"
              >
                Forget Password?
              </button>
            </div> */}
            {/* Sign Up Text */}
            <p className="text-center text-xs sm:text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/signup")}
                className="text-blue-600 hover:underline"
              >
                Sign Up
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* Maintenance Key Inline Input */}
      {showMaintenanceKeyModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
            <h3 className="text-sm sm:text-base font-semibold mb-4">Enter Maintenance Key</h3>
            <input
              type="password"
              placeholder="Enter Key"
              value={maintenanceKeyInput}
              onChange={(e) => setMaintenanceKeyInput(e.target.value)}
              className="w-full p-3 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2 mt-4 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setShowMaintenanceKeyModal(false)}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-300 rounded hover:bg-gray-400 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleMaintenanceKeySubmit}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 w-full sm:w-auto mt-2 sm:mt-0"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forget Password Modal */}
      {/* Removed Forget Password Modal */}
      {/* <Dialog
        open={showForgetPasswordModal}
        onOpenChange={setShowForgetPasswordModal}
      >
        <DialogContent className="p-4 sm:p-6 rounded-lg shadow-lg bg-white/90 text-gray-900 max-w-[95vw] sm:max-w-sm mx-auto mt-10 sm:mt-20 relative">
          <ForgotPassword />
        </DialogContent>
      </Dialog> */}
    </div>
  );
}