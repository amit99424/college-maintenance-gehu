"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/config";

interface SupervisorUpdatesProps extends Record<string, never> {}

interface Complaint {
  id: string;
  title: string;
  description: string;
  building: string;
  room: string;
  status: string;
  category: string;
  lastUpdatedBy?: string;
  lastUpdatedByRole?: string;
  updatedAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  [key: string]: unknown;
}

export default function SupervisorUpdates({}: SupervisorUpdatesProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "complaints"),
      where("lastUpdatedByRole", "==", "Supervisor"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const complaintsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complaint[];
      setComplaints(complaintsData);
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

      {complaints.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-500 font-medium">No supervisor updates found.</p>
          <p className="text-sm text-gray-400 mt-1">Updates will appear here when supervisors modify complaints</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-gray-50 p-4 rounded-lg shadow-sm hover:bg-gray-100 transition-colors duration-200 border-l-4 border-blue-500"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{complaint.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>
                      <strong>Building:</strong> {complaint.building}
                    </span>
                    <span>
                      <strong>Room:</strong> {complaint.room}
                    </span>
                    <span>
                      <strong>Category:</strong> {complaint.category}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full mb-2 inline-block ${getStatusColor(
                      complaint.status
                    )}`}
                  >
                    {complaint.status}
                  </span>
                  <div className="text-xs text-gray-500">
                    {getTimeAgo(complaint.updatedAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-700">
                  <strong>Updated by:</strong> {complaint.lastUpdatedBy || "Unknown Supervisor"}
                </div>
                <div className="text-gray-500">
                  {formatDate(complaint.updatedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Showing {complaints.length} supervisor update{complaints.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
