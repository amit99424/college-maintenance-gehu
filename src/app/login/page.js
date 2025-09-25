"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
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

  const router = useRouter();

  // Enhanced captcha generator with better security
  const generateCaptcha = useCallback(() => {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const numbers = "23456789";
    const allChars = letters + numbers;

    let newCaptcha = "";
    // Ensure variety: at least one letter and one number
    newCaptcha += letters.charAt(Math.floor(Math.random() * letters.length));
    newCaptcha += numbers.charAt(Math.floor(Math.random() * numbers.length));

    // Fill remaining 4 characters randomly
    for (let i = 0; i < 4; i++) {
      newCaptcha += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the captcha string
    newCaptcha = newCaptcha.split('').sort(() => Math.random() - 0.5).join('');

    setCaptcha(newCaptcha);
    setCaptchaError("");
    setLastRefreshTime(Date.now());
  }, []);

  // Generate captcha on first render
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // Enhanced captcha refresh with rate limiting
  const handleCaptchaRefresh = () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;

    // Rate limiting: minimum 2 seconds between refreshes
    if (timeSinceLastRefresh < 2000) {
      setCaptchaError("Please wait before refreshing again");
      return;
    }

    setRefreshingCaptcha(true);
    setCaptchaError("");

    // Simulate loading state
    setTimeout(() => {
      generateCaptcha();
      setRefreshingCaptcha(false);
    }, 500);
  };

  // Enhanced login handler with better validation
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setCaptchaError("");

    try {
      // 1. Validate captcha with enhanced security
      const normalizedCaptchaInput = captchaInput.trim().toUpperCase();
      const normalizedCaptcha = captcha.toUpperCase();

      if (normalizedCaptchaInput !== normalizedCaptcha) {
        setCaptchaError("Captcha is incorrect. Please try again.");
        setAttempts(prev => prev + 1);
        generateCaptcha();
        setCaptchaInput("");
        setIsLoading(false);

        // Rate limiting after multiple failed attempts
        if (attempts >= 2) {
          setCaptchaError("Multiple failed attempts. Please wait before trying again.");
          setTimeout(() => {
            setAttempts(0);
            setCaptchaError("");
          }, 5000);
        }
        return;
      }

      // 2. Clean and validate email & password
      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim();

      if (!emailTrimmed || !passwordTrimmed) {
        setCaptchaError("Email and password are required!");
        setIsLoading(false);
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        setCaptchaError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      // 3. Firebase login
      const userCred = await signInWithEmailAndPassword(
        auth,
        emailTrimmed,
        passwordTrimmed
      );

      // 4. Fetch user data from Firestore
      const docSnap = await getDoc(doc(db, "users", userCred.user.uid));

      if (!docSnap.exists()) {
        setCaptchaError("No user data found in database!");
        setIsLoading(false);
        return;
      }

      const userData = { ...docSnap.data(), uid: userCred.user.uid };

      console.log("✅ Logged in user data:", userData);

      // Save user in localStorage
      localStorage.setItem("userData", JSON.stringify(userData));

      // 5. Redirect based on role
      if (userData.role === "student") {
        router.push("/student-dashboard");
      } else if (userData.role === "staff") {
        router.push("/staff-dashboard");
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
      console.error("❌ Login error:", error);

      // Enhanced error handling with user-friendly messages
      if (error.code === "auth/user-not-found") {
        setCaptchaError("No account found with this email address.");
      } else if (error.code === "auth/wrong-password") {
        setCaptchaError("Incorrect password. Please check and try again.");
      } else if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-login-credentials"
      ) {
        setCaptchaError("Authentication failed. Please check your credentials.");
      } else if (error.code === "auth/too-many-requests") {
        setCaptchaError("Too many login attempts. Please wait a few minutes before trying again.");
      } else if (error.code === "auth/network-request-failed") {
        setCaptchaError("Network error. Please check your internet connection and try again.");
      } else if (error.code === "auth/invalid-email") {
        setCaptchaError("Please enter a valid email address.");
      } else if (error.code === "auth/user-disabled") {
        setCaptchaError("This account has been disabled. Please contact your administrator.");
      } else {
        setCaptchaError(`Login failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // maintenance key submit
  const handleMaintenanceKeySubmit = () => {
    if (maintenanceKeyInput === MAINTENANCE_KEY) {
      setShowMaintenanceKeyModal(false);
      router.push("/maintenance-dashboard");
    } else {
      alert("Invalid Maintenance Key!");
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ overscrollBehavior: 'none' }}>
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
      <div className="relative z-10 flex flex-col justify-start min-h-full px-4 sm:px-6 lg:px-8 pt-16 pb-8 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'none' }}>
        <div className="w-full max-w-xs sm:max-w-md md:max-w-lg">
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-4 sm:gap-5 bg-white/50 p-4 sm:p-6 md:p-8 rounded-lg shadow-2xl border border-gray-200"
          >
            {/* Logo */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <Image
                src="https://www.italcoholic.in/wp-content/uploads/2017/01/geu.png"
                alt="University Logo"
                width={300}
                height={60}
                className="w-48 sm:w-56 md:w-64 lg:w-72 h-auto"
                priority
              />
            </div>

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />

            {/* Captcha */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-900">
                Captcha
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <div className="relative flex items-center w-full sm:w-auto">
                  {/* Refresh Button */} 
                  <button
                    type="button"
                    onClick={handleCaptchaRefresh}
                    disabled={refreshingCaptcha}
                    className={`absolute left-2 z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 transition-all duration-200 ${
                      refreshingCaptcha
                        ? "border-gray-300 bg-gray-200 cursor-not-allowed"
                        : "border-blue-500 bg-white hover:bg-blue-50 cursor-pointer"
                    } flex items-center justify-center`}
                    style={{
                      background: refreshingCaptcha ? '#f3f4f6' : 'linear-gradient(45deg, #3b82f6, #06b6d4)',
                      border: refreshingCaptcha ? '2px solid #d1d5db' : '2px solid #3b82f6'
                    }}
                  >
                    <svg
                      className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${
                        refreshingCaptcha ? 'animate-spin' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>

                  {/* Captcha Display */}
                  <div
                    className="text-lg sm:text-xl font-bold tracking-widest px-4 sm:px-5 py-2 sm:py-3 rounded-lg min-w-[100px] sm:min-w-[320px] text-center shadow-lg text-white relative overflow-hidden w-full sm:w-auto"
                    style={{
                      background: refreshingCaptcha
                        ? '#e5e7eb'
                        : 'linear-gradient(135deg, #10b981 0%, #06b6d4 50%, #8b5cf6 100%)',
                      border: '2px solid transparent',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                    </div>
                    <span className="relative z-10">
                      {refreshingCaptcha ? "..." : (captcha || "------")}
                    </span>
                  </div>
                </div>
              </div>
              {captchaError && (
                <p className="text-xs sm:text-sm text-red-600 font-medium">
                  {captchaError}
                </p>
              )}
              <input
                type="text"
                placeholder="Enter the captcha text above"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                required
                className="w-full p-3 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 text-sm sm:text-base rounded-lg text-white font-semibold transition-colors ${isLoading
                  ? "bg-blue-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isLoading ? "Processing..." : "LOGIN"}
            </button>

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

      {/* Maintenance Key Modal */}
      <Dialog
        open={showMaintenanceKeyModal}
        onOpenChange={setShowMaintenanceKeyModal}
      >
          <DialogContent className="p-4 sm:p-6 rounded-lg shadow-lg bg-white max-w-[95vw] sm:max-w-sm mx-auto mt-10 sm:mt-20 relative">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base">
                Enter Maintenance Key
              </DialogTitle>
            </DialogHeader>

            <input
              type="password"
              placeholder="Enter Key"
              value={maintenanceKeyInput}
              onChange={(e) => setMaintenanceKeyInput(e.target.value)}
              className="w-full p-3 mt-4 text-sm sm:text-base rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <DialogFooter className="flex justify-end gap-2 mt-4 flex-wrap sm:flex-nowrap">
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
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}