"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { db, auth } from "@/firebase/config";

interface Complaint {
  id: string;
  building: string;
  room: string;
  category: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "resolved";
  createdAt: Timestamp | Date;
  imageUrl?: string;
  userId?: string;
  reopenReason?: string;
  reopenedAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export default function ReopenComplaint() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "complaints"),
      where("userId", "==", user.uid),
      where("status", "==", "resolved"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const complaintsData: Complaint[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Complaint, "id">;
        complaintsData.push({ id: doc.id, ...data });
      });
      setComplaints(complaintsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleReopen = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedComplaint || !reopenReason.trim()) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const complaintRef = doc(db, "complaints", selectedComplaint.id);
      await updateDoc(complaintRef, {
        status: "pending",
        reopenReason: reopenReason.trim(),
        reopenedAt: new Date(),
        updatedAt: new Date(),
      });

      setMessage("Complaint reopened successfully!");
      setSelectedComplaint(null);
      setReopenReason("");

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error reopening complaint:", error);
      setMessage("Error reopening complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return "N/A";
    const date = "toDate" in timestamp ? timestamp.toDate() : timestamp;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">Loading resolved complaints...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Reopen Resolved Complaints
        </h2>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.includes("successfully")
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {complaints.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No resolved complaints available to reopen.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">{complaint.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {complaint.building} - Room {complaint.room} • {complaint.category}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Resolved
                  </span>
                </div>

                <p className="text-gray-700 mb-3 line-clamp-2">{complaint.description}</p>

                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                  <span>Resolved: {formatDate(complaint.createdAt)}</span>
                  <span className="font-medium">ID: {complaint.id.slice(0, 8)}...</span>
                </div>

                <button
                  onClick={() => setSelectedComplaint(complaint)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reopen Complaint
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Reopen Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Reopen Complaint</h3>

              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">{selectedComplaint.title}</h4>
                <p className="text-sm text-gray-600">
                  {selectedComplaint.building} - Room {selectedComplaint.room}
                </p>
              </div>

              <form onSubmit={handleReopen}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Reopening *
                  </label>
                  <textarea
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Please explain why you need to reopen this complaint..."
                    rows={4}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComplaint(null);
                      setReopenReason("");
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !reopenReason.trim()}
                    className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                      isSubmitting || !reopenReason.trim()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isSubmitting ? "Reopening..." : "Reopen Complaint"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}