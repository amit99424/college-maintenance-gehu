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
  getDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "sonner";

interface AllComplaintsTableProps {
  adminName?: string;
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
  supervisorName?: string;
  preferredTime?: string;
  [key: string]: unknown;
}

export default function AllComplaintsTable({ initialStatusFilter }: { initialStatusFilter?: string } = {}) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter || "");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [submittedByFilter, setSubmittedByFilter] = useState("");

  // Modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const buildQueryConstraints = (): QueryConstraint[] => {
    const constraints: QueryConstraint[] = [];
    if (statusFilter.trim() !== "") {
      constraints.push(where("status", "==", statusFilter));
    }
    if (categoryFilter.trim() !== "") {
      constraints.push(where("category", "==", categoryFilter));
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
    statusFilter,
    categoryFilter,
    buildingFilter,
    // stringify filters to keep dependency array stable
    JSON.stringify(statusFilter),
    JSON.stringify(categoryFilter),
    JSON.stringify(buildingFilter),
  ]);

  // Get unique buildings from complaints for building filter dropdown
  const uniqueBuildings = useMemo(() => {
    const buildings = complaints
      .map((c) => (typeof c.building === "string" ? c.building.trim() : ""))
      .filter(Boolean);
    return Array.from(new Set(buildings));
  }, [complaints]);

  // Get unique categories from complaints for category filter dropdown
  const uniqueCategories = useMemo(() => {
    const categories = complaints
      .map((c) => (typeof c.category === "string" ? c.category.trim() : ""))
      .filter(Boolean);
    return Array.from(new Set(categories));
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
        lastUpdatedBy: "Admin", // Assuming admin name, can be passed as prop
        lastUpdatedByRole: "Admin",
      });

      // Create notification for the student
      const complaintDoc = await getDoc(doc(db, "complaints", complaintId));
      if (complaintDoc.exists()) {
        const complaintData = complaintDoc.data();
        await addDoc(collection(db, "notifications"), {
          userId: complaintData.userId,
          message: `Your complaint "${complaintData.title}" is now ${newStatus}`,
          complaintId: complaintId,
          complaintTitle: complaintData.title,
          createdAt: new Date(),
          read: false,
          updatedBy: "Admin",
        });
      }

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
        lastUpdatedBy: "Admin",
        lastUpdatedByRole: "Admin",
      });
      toast.success("Complaint reopened successfully");
    } catch (error) {
      console.error("Error reopening complaint:", error);
      toast.error("Failed to reopen complaint");
    }
  };

  // Modal handlers
  const openViewModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
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
    return date.toLocaleDateString();
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
      <h3 className="text-gray-900 font-semibold mb-6">All Complaints</h3>

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Reopened">Reopened</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">All Categories</option>
          {uniqueCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
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
                Category
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
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{complaint.category}</div>
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
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => openViewModal(complaint)}
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
              <p className="text-sm text-gray-900 mb-1">
                <strong>Category:</strong> {complaint.category}
              </p>
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
                <select
                  value={complaint.status}
                  onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  onClick={() => openViewModal(complaint)}
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

      {/* View Modal */}
      {viewModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-opacity-20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-8 relative transform transition-all duration-300 ease-in-out scale-100">
            <button
              onClick={closeViewModal}
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
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Last Updated By</span>
                    <p className="text-gray-900 font-medium">
                      {selectedComplaint.supervisorName || selectedComplaint.lastUpdatedBy
                        ? `${selectedComplaint.supervisorName || selectedComplaint.lastUpdatedBy} (Supervisor)`
                        : "N/A"}
                    </p>
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
          </div>
        </div>
      )}


    </div>
  );
}