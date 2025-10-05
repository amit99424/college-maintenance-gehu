"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "firebase/firestore";
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
  createdAt: any;
  category: string;
  [key: string]: any;
}

export default function ComplaintsTable({ category }: ComplaintsTableProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");

  useEffect(() => {
    if (!category) return;

    let isSubscribed = true;

    const q = query(
      collection(db, "complaints"),
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );

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
  }, [category]);

  useEffect(() => {
    let filtered = complaints;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(complaint =>
        complaint.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(complaint => complaint.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Building filter
    if (buildingFilter) {
      filtered = filtered.filter(complaint => complaint.building === buildingFilter);
    }

    // Room filter
    if (roomFilter) {
      filtered = filtered.filter(complaint => complaint.room === roomFilter);
    }

    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, statusFilter, buildingFilter, roomFilter]);

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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUniqueValues = (key: keyof Complaint) => {
    return [...new Set(complaints.map(c => c[key]).filter(Boolean))];
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

        {/* Room Filter */}
        <div>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">All Rooms</option>
            {getUniqueValues("room").map(room => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
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
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{complaint.submittedBy}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(complaint.createdAt)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
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

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredComplaints.length} of {complaints.length} complaints
      </div>
    </div>
  );
}
