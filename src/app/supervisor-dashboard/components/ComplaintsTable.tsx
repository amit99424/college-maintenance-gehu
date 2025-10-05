"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, Timestamp, getDoc } from "firebase/firestore";
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
  submittedBy: string;
  createdAt: Timestamp | Date;
  category: string;
  [key: string]: unknown;
}

export default function ComplaintsTable({ category }: ComplaintsTableProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [submittedByFilter, setSubmittedByFilter] = useState("");

  useEffect(() => {
    if (!category) return;

    let isSubscribed = true;

    // Build dynamic where clauses for filters (excluding submittedBy for client-side filtering)
    let whereClauses = [];

    if (category) {
      whereClauses.push(where("category", "==", category));
    }

    if (statusFilter) {
      whereClauses.push(where("status", "==", statusFilter));
    }

    if (buildingFilter) {
      whereClauses.push(where("building", "==", buildingFilter));
    }

    let q = query(collection(db, "complaints"), ...whereClauses, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isSubscribed) return;
      const complaintsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complaint[];
      setComplaints(complaintsData);
      setLoading(false);
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [category, statusFilter, buildingFilter]);

  useEffect(() => {
    let filtered = complaints;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(complaint =>
        complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Submitted By filter
    if (submittedByFilter) {
      const normalizedSubmittedByFilter = submittedByFilter.toLowerCase();
      filtered = filtered.filter(complaint =>
        complaint.submittedBy?.toLowerCase() === normalizedSubmittedByFilter
      );
    }

    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, submittedByFilter]);


  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "complaints", complaintId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success(`Complaint status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update complaint status");
    }
  };

  const handleReopen = async (complaintId: string) => {
    try {
      await updateDoc(doc(db, "complaints", complaintId), {
        status: "Reopened",
        updatedAt: new Date()
      });
      toast.success("Complaint reopened successfully");
    } catch (error) {
      console.error("Error reopening complaint:", error);
      toast.error("Failed to reopen complaint");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUniqueValues = (key: keyof Complaint) => {
    return [...new Set(complaints.map(c => c[key] as string).filter(Boolean))];
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
      <h3 className="text-gray-900 font-semibold mb-6">My Complaints</h3>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search complaints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        {/* Status Filter */}
        <div>
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
        </div>

      {/* Building Filter */}
      <div>
        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">All Buildings</option>
          {getUniqueValues("building").map(building => (
            <option key={building} value={building}>{building}</option>
          ))}
        </select>
      </div>

      {/* Submitted By Filter */}
      <div>
        <select
          value={submittedByFilter}
          onChange={(e) => setSubmittedByFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">All Submitted By</option>
          <option value="Student">Student</option>
          <option value="Staff">Staff</option>
        </select>
      </div>
    </div>

      {/* Table for md and above */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Building</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Room</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No complaints found matching your filters.
                </td>
              </tr>
            ) : (
              filteredComplaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{complaint.description}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{complaint.building}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{complaint.room}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </td>
                  {/* Removed Submitted By data cell */}
                  {/* <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{complaint.submittedBy}</div>
                  </td> */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(complaint.createdAt)}</div>
                  </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex space-x-2">
                      {complaint.status !== "Completed" && (
                        <select
                          value={complaint.status}
                          onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      )}
                      {complaint.status === "Completed" && (
                        <button
                          onClick={() => handleReopen(complaint.id)}
                          className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
              </tbody>
            </table>
          </div>
      {/* Removed duplicate table block */}

      {/* Card layout for mobile */}
      <div className="md:hidden space-y-4">
        {filteredComplaints.length === 0 ? (
          <div className="text-center text-gray-500">No complaints found matching your filters.</div>
        ) : (
          filteredComplaints.map((complaint) => (
            <div key={complaint.id} className="bg-gray-50 p-4 rounded-lg shadow hover:bg-gray-100 transition-colors duration-200">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-gray-900">{complaint.title}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                  {complaint.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-1 truncate">{complaint.description}</p>
              <p className="text-xs text-gray-600 mb-1">
                <strong>Building:</strong> {complaint.building} &nbsp; <strong>Room:</strong> {complaint.room}
              </p>
              <p className="text-xs text-gray-600 mb-1">
                <strong>Submitted By:</strong> <span className="capitalize">{complaint.submittedBy}</span>
              </p>
              <p className="text-xs text-gray-600 mb-2">
                <strong>Date:</strong> {formatDate(complaint.createdAt)}
              </p>
              <div className="flex space-x-2">
                {complaint.status !== "Completed" && (
                  <select
                    value={complaint.status}
                    onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                )}
                {complaint.status === "Completed" && (
                  <button
                    onClick={() => handleReopen(complaint.id)}
                    className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 w-full"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredComplaints.length} of {complaints.length} complaints
      </div>
    </div>
  );
}
