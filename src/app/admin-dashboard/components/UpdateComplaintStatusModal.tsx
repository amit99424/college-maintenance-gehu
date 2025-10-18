"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  userId: string;
  [key: string]: unknown;
}

interface UpdateComplaintStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: Complaint | null;
  onStatusUpdate: (complaintId: string, newStatus: string) => void;
}

export default function UpdateComplaintStatusModal({
  isOpen,
  onClose,
  complaint,
  onStatusUpdate,
}: UpdateComplaintStatusModalProps) {
  const [status, setStatus] = useState(complaint?.status || "pending");
  const [message, setMessage] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!complaint) return;

    if (status === "in progress" && !message.trim()) {
      toast.error("Please provide a reason for marking as In Progress");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch("/api/update-complaint-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          complaintId: complaint.id,
          newStatus: status,
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Complaint status updated successfully");
        onStatusUpdate(complaint.id, status);
        onClose();
      } else {
        toast.error(data.error || "Failed to update complaint status");
      }
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast.error("Failed to update complaint status");
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen || !complaint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold mb-4">Update Complaint Status</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {status === "in progress" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for In Progress (Required)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide a reason for marking this complaint as In Progress..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                rows={3}
                required
              />
            </div>
          )}
          {status !== "in progress" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Optional Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a custom message (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                rows={3}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors duration-200"
            disabled={updating}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}
