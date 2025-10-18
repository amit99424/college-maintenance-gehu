"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query, where, Timestamp, doc, getDoc } from "firebase/firestore";
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

interface Complaint {
  id: string;
  title: string;
  description: string;
  building: string;
  room: string;
  status: string;
  userEmail: string;
  userId: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  category: string;
  lastUpdatedBy?: string;
  lastUpdatedByRole?: string;
  preferredTime?: string;
  [key: string]: unknown;
}

export default function SupervisorUpdates({}: SupervisorUpdatesProps) {
  const [updates, setUpdates] = useState<SupervisorUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

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

  // Modal handlers
  const openModal = async (complaintId: string) => {
    try {
      const complaintDoc = await getDoc(doc(db, "complaints", complaintId));
      if (complaintDoc.exists()) {
        const complaintData = complaintDoc.data() as Complaint;
        setSelectedComplaint({ ...complaintData, id: complaintId });
        setModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching complaint details:", error);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedComplaint(null);
  };

  // Helper to determine user type from email domain
  const getUserTypeFromEmail = (email: string): string => {
    if (!email) return "Unknown";
    if (email.toLowerCase().endsWith("@gmail.com")) return "Student";
    if (email.toLowerCase().endsWith("@staff.com")) return "Staff";
    return "Unknown";
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
                <button
                  onClick={() => openModal(update.complaintId)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 text-xs font-medium"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-8 relative transform transition-all duration-300 ease-in-out scale-100">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors duration-200"
              aria-label="Close modal"
            >
              &times;
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Details</h2>
              <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedComplaint.title}</h3>
                <p className="text-gray-700 leading-relaxed">{selectedComplaint.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Building</span>
                    <p className="text-gray-900 font-medium">{selectedComplaint.building}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Room</span>
                    <p className="text-gray-900 font-medium">{selectedComplaint.room}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</span>
                    <span
                      className={`inline-block px-3 py-1 text-sm font-medium rounded-full mt-1 ${getStatusColor(
                        selectedComplaint.status
                      )}`}
                    >
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Category</span>
                    <p className="text-gray-900 font-medium">{selectedComplaint.category}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Submitted By</span>
                    <p className="text-gray-900 font-medium capitalize">{getUserTypeFromEmail(selectedComplaint.userEmail)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Date Submitted</span>
                    <p className="text-gray-900 font-medium">{formatDate(selectedComplaint.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Time Slot</span>
                    <p className="text-gray-900 font-medium">{selectedComplaint.preferredTime || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
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
