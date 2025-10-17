"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, DocumentData, Timestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
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
  status: "pending" | "in-progress" | "resolved" | "completed" | "Reopened";
  createdAt: Timestamp | Date | null;
  imageUrl?: string;
  priority?: string;
  preferredTime?: string;
}

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "in progress" | "completed" | "Reopened">("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false);
  const [reopenId, setReopenId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "complaints"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const complaintsData: Complaint[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        complaintsData.push({
          id: doc.id,
          building: data.building,
          room: data.room,
          category: data.category,
          title: data.title,
          description: data.description,
          status: data.status,
          createdAt: data.createdAt ?? null,
          imageUrl: data.imageUrl,
          priority: data.priority,
          preferredTime: data.preferredTime,
        });
      });
      setComplaints(complaintsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (filter === "all") {
      setFilteredComplaints(complaints);
    } else {
      setFilteredComplaints(complaints.filter((c) => {
        const complaintStatus = c.status.toLowerCase().replace(/\s+/g, '-');
        const filterValue = filter.toLowerCase().replace(/\s+/g, '-');
        return complaintStatus === filterValue;
      }));
    }
  }, [complaints, filter]);

  const getStatusColor = (status: Complaint["status"]) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (timestamp: Complaint["createdAt"]) => {
    if (!timestamp) return "N/A";
    const date =
      timestamp instanceof Date
        ? timestamp
        : "toDate" in timestamp
        ? timestamp.toDate()
        : new Date(timestamp as string | number);
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

  const openReopenDialog = (id: string) => {
    setReopenId(id);
    setIsReopenDialogOpen(true);
  };

  const closeReopenDialog = () => {
    setReopenId(null);
    setIsReopenDialogOpen(false);
  };

  const confirmReopen = async () => {
    if (!reopenId) return;
    try {
      await updateDoc(doc(db, "complaints", reopenId), {
        status: "Reopened",
      });
      closeReopenDialog();
    } catch (error) {
      console.error("Failed to reopen complaint:", error);
      alert("Failed to reopen complaint. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">Loading complaints...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
            <h2 className="text-xl font-semibold text-gray-800">My Complaints</h2>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {["all", "pending", "in progress", "completed", "Reopened"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? status === "pending"
                        ? "bg-red-600 text-white"
                      : status === "in progress"
                        ? "bg-yellow-600 text-white"
                        : status === "completed"
                        ? "bg-purple-600 text-white"
                        : status === "Reopened"
                        ? "bg-orange-600 text-white"
                        : "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {status === "all"
                    ? `All (${complaints.length})`
                    : `${status.charAt(0).toUpperCase() + status.slice(1)} (${
                        complaints.filter((c) => c.status === status).length
                      })`}
                </button>
              ))}
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {filter === "all"
                  ? "No complaints found. Submit your first complaint!"
                  : `No ${filter} complaints found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 sm:mb-3 space-y-2 md:space-y-0 md:space-x-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {complaint.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {complaint.building} - Room {complaint.room} • {complaint.category}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        complaint.status
                      )}`}
                    >
                      {complaint.status.charAt(0).toUpperCase() +
                        complaint.status.slice(1)}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-3 line-clamp-2">
                    {complaint.description}
                  </p>

                  {complaint.imageUrl && (
                    <div className="mb-3">
                      <Image
                        src={complaint.imageUrl}
                        alt="Complaint"
                        width={128}
                        height={128}
                        className="object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-sm text-gray-500 space-y-2 md:space-y-0 md:space-x-4">
                    <span>Created: {formatDate(complaint.createdAt)}</span>
                    <span className="font-medium">ID: {complaint.id.slice(0, 8)}...</span>
                  </div>

                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={() => openDialog(complaint)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                    {complaint.status.toLowerCase() === "completed" && (
                      <button
                        onClick={() => openReopenDialog(complaint.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center justify-center space-x-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span>Reopen</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(complaint.id)}
                      disabled={deletingId === complaint.id}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog for Complaint Details */}
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
                <p className="text-gray-700 leading-relaxed break-words">{selectedComplaint.description}</p>
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
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Category</span>
                    <p className="text-gray-900 font-medium">{selectedComplaint.category}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Priority</span>
                    <p className="text-gray-900 font-medium">{selectedComplaint.priority ?? "Normal"}</p>
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

      {/* Modal Dialog for Reopen Confirmation */}
      <Dialog open={isReopenDialogOpen} onOpenChange={setIsReopenDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-red-700 font-bold text-xl mb-4">
              Confirm Reopen
            </DialogTitle>
          </DialogHeader>
          <div className="text-gray-800">
            <p>Are you sure you want to reopen this complaint? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <button
              onClick={closeReopenDialog}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition mr-2"
            >
              Cancel
            </button>
            <button
              onClick={confirmReopen}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Confirm Reopen
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}