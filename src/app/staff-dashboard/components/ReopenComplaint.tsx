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
  deleteDoc,
  Timestamp
} from "firebase/firestore";
import { db, auth } from "@/firebase/config";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "complaints"),
      where("userId", "==", user.uid),
      where("status", "in", ["resolved", "Reopened"]),
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

  const openDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setSelectedComplaint(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this complaint?")) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "complaints", id));
      setDeletingId(null);
    } catch (error) {
      console.error("Failed to delete complaint:", error);
      setDeletingId(null);
      alert("Failed to delete complaint. Please try again.");
    }
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
          Reopen Complaints
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
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => openDialog(complaint)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDelete(complaint.id)}
                    disabled={deletingId === complaint.id}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reopen Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-white/5 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-blue-100 transform transition-all duration-300 scale-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-blue-900">Reopen Complaint</h3>
                <button
                  onClick={() => {
                    setSelectedComplaint(null);
                    setReopenReason("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-2 text-lg">{selectedComplaint.title}</h4>
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{selectedComplaint.building} - Room {selectedComplaint.room}</span>
                </div>
              </div>

              <form onSubmit={handleReopen}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Reason for Reopening *
                  </label>
                  <textarea
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Please explain why you need to reopen this complaint..."
                    rows={4}
                    required
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none bg-white text-gray-900 placeholder-gray-500 focus:placeholder-gray-400"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComplaint(null);
                      setReopenReason("");
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !reopenReason.trim()}
                    className={`px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 shadow-lg ${
                      isSubmitting || !reopenReason.trim()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105"
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Reopening...</span>
                      </div>
                    ) : (
                      "Reopen Complaint"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl w-full p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
                Complaint Details
              </DialogTitle>
              <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
            </DialogHeader>
            {selectedComplaint && (
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
                      <span className="inline-block px-3 py-1 text-sm font-medium rounded-full mt-1 bg-green-100 text-green-800">
                        {selectedComplaint.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Category</span>
                      <p className="text-gray-900 font-medium">{selectedComplaint.category}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Date Submitted</span>
                      <p className="text-gray-900 font-medium">{formatDate(selectedComplaint.createdAt)}</p>
                    </div>
                  </div>
                </div>
                {selectedComplaint.imageUrl && (
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Image</span>
                    <div className="mt-2">
                      <Image
                        src={selectedComplaint.imageUrl}
                        alt="Complaint"
                        width={400}
                        height={300}
                        className="w-full max-w-md h-auto object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <button
                onClick={closeDialog}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
