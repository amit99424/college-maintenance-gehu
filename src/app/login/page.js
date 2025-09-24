"use client";

import { useState, useEffect } from "react";
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

  // modal states
  const [showMaintenanceKeyModal, setShowMaintenanceKeyModal] = useState(false);
  const [maintenanceKeyInput, setMaintenanceKeyInput] = useState("");
  const [pendingUser, setPendingUser] = useState(null);

  const router = useRouter();

  // captcha generator
  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let newCaptcha = "";
    for (let i = 0; i < 6; i++) {
      newCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(newCaptcha);
  };

  // Generate captcha on first render
  useEffect(() => {
    generateCaptcha();
  }, []);

  // login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Validate captcha
      if (captchaInput.toUpperCase() !== captcha.toUpperCase()) {
        alert("Captcha incorrect!");
        generateCaptcha();
        setIsLoading(false);
        return;
      }

      // 2. Clean email & password
      const emailTrimmed = email.trim();
      const passwordTrimmed = password.trim();

      if (!emailTrimmed || !passwordTrimmed) {
        alert("Email and password are required!");
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
        alert("No user data found in database!");
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
        alert("Unknown role. Please contact admin.");
        router.push("/");
      }
    } catch (error) {
      console.error("❌ Login error:", error);

      // Handle Firebase auth errors
      if (error.code === "auth/user-not-found") {
        alert("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        alert("Incorrect password. Please try again.");
      } else if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-login-credentials"
      ) {
        alert("Authentication failed. Check your email and password.");
      } else if (error.code === "auth/too-many-requests") {
        alert("Too many failed login attempts. Try again later.");
      } else if (error.code === "auth/network-request-failed") {
        alert("Network error. Check your internet connection.");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email format.");
      } else if (error.code === "auth/user-disabled") {
        alert("This account has been disabled. Contact admin.");
      } else {
        alert(`Login failed: ${error.message}`);
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
    <div className="relative min-h-screen w-full">
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
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md sm:max-w-sm">
          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-4 sm:gap-5 bg-white/50 p-6 sm:p-8 rounded-lg shadow-2xl border border-gray-200"
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
                <div className="bg-gray-100 text-lg sm:text-xl font-bold tracking-widest px-3 sm:px-4 py-2 sm:py-3 rounded min-w-[100px] sm:min-w-[120px] text-center border-2 border-gray-400 shadow-sm text-gray-900">
                  {captcha || "------"}
                </div>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Refresh
                </button>
              </div>
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
              className={`w-full py-3 text-sm sm:text-base rounded-lg text-white font-semibold transition-colors ${
                isLoading
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

          <DialogFooter className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowMaintenanceKeyModal(false)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleMaintenanceKeySubmit}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}