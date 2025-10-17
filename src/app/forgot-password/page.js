"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const router = useRouter();

  const handleVerifyUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/verify-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowPasswordSection(true);
        setSuccess("User verified successfully. Please set your new password.");
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          newPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setEmail("");
        setDob(null);
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordSection(false);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
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
        <div className="w-[90%] sm:w-full max-w-md bg-white/20 backdrop-transparent-lg rounded-2xl shadow-2xl border border-white/20 overflow-y-auto max-h-[90vh] animate-fadeInZoom">
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">FORGOT PASSWORD</h1>
            <p className="text-sm text-gray-900">Enter your details to reset your password.</p>
          </div>
          {!showPasswordSection ? (
            <form
              onSubmit={handleVerifyUser}
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
                  <path d="M2.94 6.94a1.5 1.5 0 012.12 0L10 11.88l4.94-4.94a1.5 1.5 0 112.12 2.12l-6 6a1.5 1.5 0 01-2.12 0l-6-6a1.5 1.5 0 010-2.12z" />
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 p-3 text-sm sm:text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:shadow-lg focus:shadow-blue-400/50 bg-white/90 text-gray-900 shadow-md transition-all duration-300"
              />
            </div>

            {/* Date of Birth */}
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
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
              <DatePicker
                selected={dob}
                onChange={(date) => setDob(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Date of Birth (DD/MM/YYYY)"
                className="w-full pl-10 p-3 text-sm sm:text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:shadow-lg focus:shadow-blue-400/50 bg-white/90 text-gray-900 shadow-md transition-all duration-300"
                wrapperClassName="w-full"
                required
                maxDate={new Date()}
                minDate={new Date(new Date().getFullYear() - 100, 0, 1)}
                showYearDropdown={true}
                showMonthDropdown={true}
                dropdownMode="select"
                yearDropdownItemNumber={50}
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs sm:text-sm text-red-600 font-medium text-center">
                {error}
              </p>
            )}

            {/* Success Message */}
            {success && (
              <div className="text-xs sm:text-sm text-green-600 font-medium text-center bg-green-50 p-3 rounded-lg border border-green-200">
                <p>{success}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 py-3 text-sm sm:text-base rounded-lg text-white font-semibold transition-colors ${
                  isLoading
                    ? "bg-green-500 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isLoading ? "Processing..." : "RESET"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="flex-1 py-3 text-sm sm:text-base rounded-lg text-white font-semibold bg-yellow-600 hover:bg-yellow-700 transition-colors"
              >
                SIGN IN
              </button>
            </div>
            </form>
          ) : (
            <form
              onSubmit={handleUpdatePassword}
              className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-6 md:p-8"
            >
              {/* New Password */}
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
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full pl-10 p-3 text-sm sm:text-base rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:shadow-lg focus:shadow-blue-400/50 bg-white/90 text-gray-900 shadow-md transition-all duration-300"
                />
              </div>

              {/* Confirm Password */}
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
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

              {/* Success Message */}
              {success && (
                <div className="text-xs sm:text-sm text-green-600 font-medium text-center bg-green-50 p-3 rounded-lg border border-green-200">
                  <p>{success}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 py-3 text-sm sm:text-base rounded-lg text-white font-semibold transition-colors ${
                    isLoading
                      ? "bg-blue-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isLoading ? "Updating..." : "UPDATE PASSWORD"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="flex-1 py-3 text-sm sm:text-base rounded-lg text-white font-semibold bg-gray-600 hover:bg-gray-700 transition-colors"
                >
                  BACK
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
