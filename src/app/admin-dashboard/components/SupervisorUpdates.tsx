"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/config";

type SupervisorUpdatesProps = Record<string, never>;

interface SupervisorUpdate {
  id: string;
  complaintId: string;
  title: string;
  status: string;
  supervisorName: string;
  updatedAt: Timestamp | Date;
  lastUpdatedBy: string;
}

export default function SupervisorUpdates({}: SupervisorUpdatesProps) {
  const [updates, setUpdates] = useState<SupervisorUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "complaints"), orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatesData = snapshot.docs
        .filter((doc) => doc.data().lastUpdatedBy === "supervisor")
        .map((doc) => ({
          id: doc.id,
          complaintId: doc.id,
          title: doc.data().title || "Untitled Complaint",
          status: doc.data().status || "Unknown",
          supervisorName: doc.data().supervisorName || "Unknown Supervisor",
          updatedAt: doc.data().updatedAt,
          lastUpdatedBy: doc.data().lastUpdatedBy,
        })) as SupervisorUpdate[];
      console.log("Fetched supervisor updates:", updatesData);
      setUpdates(updatesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching supervisor updates:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get color classes for status badges
  const getStatusColor = (status: string) => {
    const normalizedStatus = status.trim().toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return "bg-red-200 text-red-900";
      case "in progress":
        return "bg-yellow-200 text-yellow-900";
      case "completed":
        return "bg-green-200 text-green-900";
      case "reopened":
        return "bg-orange-200 text-orange-900";
      default:
        return "bg-gray-200 text-gray-900";
    }
  };

  // Format date from Timestamp or Date
  const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Get time ago string
  const getTimeAgo = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return "Unknown";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-gray-900 font-semibold mb-6">Supervisor Updates</h3>

      {updates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-500 font-medium">No supervisor updates found.</p>
          <p className="text-sm text-gray-400 mt-1">Updates will appear here when supervisors modify complaints</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <div
              key={update.id}
              className="bg-gray-50 p-4 rounded-lg shadow-sm hover:bg-gray-100 transition-colors duration-200 border-l-4 border-blue-500"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{update.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">Complaint ID: {update.complaintId}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full mb-2 inline-block ${getStatusColor(
                      update.status
                    )}`}
                  >
                    {update.status}
                  </span>
                  <div className="text-xs text-gray-500">
                    {getTimeAgo(update.updatedAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-700">
                  <strong>Updated by:</strong> {update.supervisorName}
                </div>
                <div className="text-gray-500">
                  {formatDate(update.updatedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Showing {updates.length} supervisor update{updates.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
