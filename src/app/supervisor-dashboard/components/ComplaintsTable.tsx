"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "sonner";

interface ComplaintsTableProps {
  category?: string;
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
  [key: string]: unknown;
}

export default function ComplaintsTable({ category }: ComplaintsTableProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [submittedByFilter, setSubmittedByFilter] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const buildQueryConstraints = (): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [];
    if (category) {
      constraints.push(where("category", "==", category));
    }
    if (statusFilter.trim() !== "") {
      constraints.push(where("status", "==", statusFilter));
    }
    if (buildingFilter.trim() !== "") {
      constraints.push(where("building", "==", buildingFilter));
    }
    constraints.push(orderBy("createdAt", "desc"));
    return constraints;
  };

  // Fetch complaints from Firestore with dynamic query constraints
  useEffect(() => {
    let isSubscribed = true;

    const constraints = buildQueryConstraints();

    const q = query(collection(db, "complaints"), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isSubscribed) return;
        const complaintsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Complaint[];
        setComplaints(complaintsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching complaints:", error);
        setLoading(false);
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [
    category,
    statusFilter,
    buildingFilter,
    // stringify filters to keep dependency array stable
    JSON.stringify(category),
    JSON.stringify(statusFilter),
    JSON.stringify(buildingFilter),
  ]);

  // Get unique buildings from complaints for building filter dropdown
  const uniqueBuildings = useMemo(() => {
    const buildings = complaints
      .map((c) => (typeof c.building === "string" ? c.building.trim() : ""))
      .filter(Boolean);
    return Array.from(new Set(buildings));
  }, [complaints]);

  // Helper to determine user type from email domain
  const getUserTypeFromEmail = (email: string): string => {
    if (!email) return "Unknown";
    if (email.toLowerCase().endsWith("@gmail.com")) return "Student";
    if (email.toLowerCase().endsWith("@staff.com")) return "Staff";
    return "Unknown";
  };

  // Client-side filtering combining search and submittedBy filters
  const filteredComplaints = useMemo(() => {
    let filtered = complaints;

    // Search filter on title or description (case insensitive)
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title?.toString().toLowerCase().includes(lowerSearch) ||
          c.description?.toString().toLowerCase().includes(lowerSearch)
      );
    }

    // Submitted By filter based on userEmail domain
    if (submittedByFilter.trim() !== "") {
      filtered = filtered.filter(
        (c) =>
          getUserTypeFromEmail(c.userEmail).toLowerCase() ===
          submittedByFilter.trim().toLowerCase()
      );
    }

    return filtered;
  }, [complaints, searchTerm, submittedByFilter]);

  // Handle status change update in Firestore
  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "complaints", complaintId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      toast.success(`Complaint status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update complaint status");
    }
  };

  // Handle reopen action for completed complaints
  const handleReopen = async (complaintId: string) => {
    try {
      await updateDoc(doc(db, "complaints", complaintId), {
        status: "Reopened",
        updatedAt: new Date(),
      });
      toast.success("Complaint reopened successfully");
    } catch (error) {
      console.error("Error reopening complaint:", error);
      toast.error("Failed to reopen complaint");
    }
  };

  // Modal handlers
  const openModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedComplaint(null);
  };

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

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-gray-900 font-semibold mb-6">Complaints</h3>

      {/* Search input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by title or description"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Reopened">Reopened</option>
        </select>

        {/* Building Filter */}
        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">All Buildings</option>
          {uniqueBuildings.map((building) => (
            <option key={building} value={building}>
              {building}
            </option>
          ))}
        </select>

        {/* Submitted By Filter */}
        <select
          value={submittedByFilter}
          onChange={(e) => setSubmittedByFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">All Submitted By</option>
          <option value="student">Student</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      {/* Table for desktop */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Building
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Room
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Submitted By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-700">
                  No complaints found matching your filters.
                </td>
              </tr>
            ) : (
              filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                  </td>
                  <td className="px-4 py-4 max-w-xs truncate">
                    <div className="text-sm text-gray-900">{complaint.description}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{complaint.building}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{complaint.room}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        complaint.status
                      )}`}
                    >
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap capitalize text-gray-900">
                    {getUserTypeFromEmail(complaint.userEmail)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(complaint.createdAt)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex space-x-2 items-center">
                      {complaint.status.toLowerCase() !== "completed" ? (
                        <select
                          value={complaint.status}
                          onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="in progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      ) : (
                        <button
                          onClick={() => handleReopen(complaint.id)}
                          className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        onClick={() => openModal(complaint)}
                        className="ml-2 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-4">
        {filteredComplaints.length === 0 ? (
          <div className="text-center text-gray-700">No complaints found matching your filters.</div>
        ) : (
          filteredComplaints.map((complaint) => (
            <div
              key={complaint.id}
              className="bg-gray-50 p-4 rounded-lg shadow hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">{complaint.title}</h4>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    complaint.status
                  )}`}
                >
                  {complaint.status}
                </span>
              </div>
              <p className="text-sm text-gray-900 mb-1 truncate">{complaint.description}</p>
              <p className="text-xs text-gray-800 mb-1">
                <strong>Building:</strong> {complaint.building} &nbsp; <strong>Room:</strong>{" "}
                {complaint.room}
              </p>
              <p className="text-xs text-gray-800 mb-1 capitalize">
                <strong>Submitted By:</strong> {getUserTypeFromEmail(complaint.userEmail)}
              </p>
              <p className="text-xs text-gray-800 mb-2">
                <strong>Date:</strong> {formatDate(complaint.createdAt)}
              </p>
              <div className="flex space-x-2">
                {complaint.status.toLowerCase() !== "completed" ? (
                  <select
                    value={complaint.status}
                    onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="pending">Pending</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <button
                    onClick={() => handleReopen(complaint.id)}
                    className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => openModal(complaint)}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-800">
        Showing {filteredComplaints.length} of {complaints.length} complaints
      </div>

      {/* Modal */}
      {modalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl font-bold"
              aria-label="Close modal"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Complaint Details</h2>
            <div className="space-y-2 text-gray-900">
              <p>
                <strong>Title:</strong> {selectedComplaint.title}
              </p>
              <p>
                <strong>Description:</strong> {selectedComplaint.description}
              </p>
              <p>
                <strong>Building:</strong> {selectedComplaint.building}
              </p>
              <p>
                <strong>Room:</strong> {selectedComplaint.room}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    selectedComplaint.status
                  )}`}
                >
                  {selectedComplaint.status}
                </span>
              </p>
              <p>
                <strong>Submitted By:</strong> {getUserTypeFromEmail(selectedComplaint.userEmail)}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(selectedComplaint.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
