"use client";

import { useState } from "react";

interface ForgotPasswordLoginProps {
  onClose: () => void;
}

export default function ForgotPasswordLogin({ onClose }: ForgotPasswordLoginProps) {
  const [email, setEmail] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!email || !day || !month || !year || !newPassword) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    const formattedDob = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;

    try {
      const response = await fetch("/api/resetPasswordWithVerification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), dob: formattedDob, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password reset successfully. You can now log in with your new password.");
        setEmail("");
        setDay("");
        setMonth("");
        setYear("");
        setNewPassword("");
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">FORGOT PASSWORD</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="sr-only">Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <div className="flex space-x-2">
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              required
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d.toString().padStart(2, '0')}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="">Month</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m.toString().padStart(2, '0')}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              <option value="">Year</option>
              {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => 1900 + i)
                .reverse()
                .map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label className="sr-only">New Password</label>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-md text-white font-semibold ${
            isLoading
              ? "bg-blue-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isLoading ? "Resetting..." : "RESET PASSWORD"}
        </button>
      </form>
    </div>
  );
}
