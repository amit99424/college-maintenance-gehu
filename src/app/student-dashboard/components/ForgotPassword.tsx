"use client";

import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !dob || !newPassword) {
      setError("Please fill in all fields.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const storedUserStr = localStorage.getItem(normalizedEmail);
    if (!storedUserStr) {
      setError("User with this email does not exist.");
      return;
    }

    const storedUser = JSON.parse(storedUserStr);
    if (storedUser.dob !== dob) {
      setError("Date of Birth does not match our records.");
      return;
    }

    storedUser.password = newPassword;
    localStorage.setItem(normalizedEmail, JSON.stringify(storedUser));
    setSuccess("Password reset successfully.");
    setEmail("");
    setDob("");
    setNewPassword("");
  };

  const handleDebug = () => {
    let allData = "";
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key!);
      allData += `${key}: ${value}\n`;
    }
    setDebugInfo(allData);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">FORGOT PASSWORD</h2>

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
          <label className="sr-only">Email-ID</label>
          <input
            type="email"
            placeholder="Email-ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="sr-only">Date Of Birth (DD/MM/YYYY)</label>
          <input
            type="text"
            placeholder="Date Of Birth (DD/MM/YYYY)"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
            pattern="^(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/[0-9]{4}$"
            title="Date of Birth must be in DD/MM/YYYY format"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="sr-only">New Password</label>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700"
        >
          RESET PASSWORD
        </button>
      </form>

      <button
        onClick={handleDebug}
        className="mt-4 w-full py-2 px-4 rounded-md text-white font-semibold bg-gray-600 hover:bg-gray-700"
      >
        Debug LocalStorage
      </button>

      {debugInfo && (
        <pre className="mt-4 p-3 bg-gray-100 rounded text-xs whitespace-pre-wrap">
          {debugInfo}
        </pre>
      )}
    </div>
  );
}
