"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot, Timestamp, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell
} from "recharts";
import { CSVLink } from "react-csv";
import { useTranslation } from "react-i18next";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { toast } from "sonner";

type AnalyticsProps = Record<string, never>;

interface Complaint {
  id: string;
  status: string;
  category: string;
  createdAt: Timestamp | Date;
  [key: string]: unknown;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

export default function Analytics({ }: AnalyticsProps) {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [buildingFilter, setBuildingFilter] = useState<string>("");
  const [submittedByFilter, setSubmittedByFilter] = useState<string>("");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [supervisors, setSupervisors] = useState<string[]>([]);

  useEffect(() => {
    const q = query(collection(db, "complaints"));

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

  // Fetch unique supervisors from complaints
  useEffect(() => {
    const uniqueSupervisors = Array.from(
      new Set(
        complaints
          .map(c => c.supervisorName as string)
          .filter(name => name && name !== 'Not Assigned')
      )
    );
    setSupervisors(uniqueSupervisors);
  }, [complaints]);

  // Data for Bar Chart: Complaints by Status
  const statusCounts = complaints.reduce((acc, complaint) => {
    const status = complaint.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count
  }));

  // Data for Line Chart: Complaints Resolved Over Time
  // Group by date (YYYY-MM-DD) and count completed complaints
  const completedComplaints = complaints.filter(c => c.status.toLowerCase() === "completed");
  const resolvedByDate: Record<string, number> = {};
  completedComplaints.forEach(c => {
    const date = c.createdAt instanceof Timestamp ? c.createdAt.toDate() : c.createdAt;
    const dateStr = date.toISOString().split("T")[0];
    resolvedByDate[dateStr] = (resolvedByDate[dateStr] || 0) + 1;
  });
  const lineData = Object.entries(resolvedByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Data for Pie Chart: Category-wise Complaint Ratio
  const categoryCounts = complaints.reduce((acc, complaint) => {
    const cat = complaint.category || "Unknown";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value
  }));



  // Helper to determine user type from email domain
  const getUserTypeFromEmail = (email: string): string => {
    if (!email) return "Unknown";
    if (email.toLowerCase().endsWith("@gmail.com")) return "Student";
    if (email.toLowerCase().endsWith("@staff.com")) return "Staff";
    return "Unknown";
  };

  // Format date from Timestamp or Date
  const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return date.toLocaleString();
  };

  // Filtered complaints for export
  const filteredComplaints = useMemo(() => {
    let filtered = complaints;

    if (categoryFilter) {
      filtered = filtered.filter(c => c.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (statusFilter) {
      filtered = filtered.filter(c => c.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    if (buildingFilter) {
      filtered = filtered.filter(c => (c.building as string)?.toLowerCase().includes(buildingFilter.toLowerCase()));
    }

    if (submittedByFilter) {
      filtered = filtered.filter(c => getUserTypeFromEmail(c.userEmail as string).toLowerCase() === submittedByFilter.toLowerCase());
    }

    if (assignedToFilter) {
      filtered = filtered.filter(c => (c.supervisorName as string)?.toLowerCase().includes(assignedToFilter.toLowerCase()));
    }

    if (startDate || endDate) {
      filtered = filtered.filter(c => {
        const complaintDate = c.createdAt instanceof Timestamp ? c.createdAt.toDate() : c.createdAt;
        if (startDate && complaintDate < startDate) return false;
        if (endDate && complaintDate > endDate) return false;
        return true;
      });
    }

    return filtered;
  }, [complaints, categoryFilter, statusFilter, buildingFilter, submittedByFilter, assignedToFilter, startDate, endDate]);

  // Get unique buildings for filter dropdown
  const uniqueBuildings = useMemo(() => {
    return Array.from(new Set(complaints.map(c => c.building as string).filter(Boolean)));
  }, [complaints]);

  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter("");
    setStatusFilter("");
    setBuildingFilter("");
    setSubmittedByFilter("");
    setAssignedToFilter("");
    setStartDate(null);
    setEndDate(null);
  };

  // Export to Excel function
  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const data = filteredComplaints.map((complaint) => ({
        'Complaint ID': complaint.id,
        'Title': complaint.title as string,
        'Description': complaint.description as string,
        'Building / Block': complaint.building as string,
        'Room / Location': complaint.room as string,
        'Category': complaint.category,
        'Status': complaint.status,
        'Date Submitted': formatDate(complaint.createdAt),
        'Time Slot': (complaint.preferredTime as string) || 'N/A',
        'Submitted By': getUserTypeFromEmail(complaint.userEmail as string),
        'Submitted By (Email)': complaint.userEmail as string,
        'Assigned To': (complaint.supervisorName as string) || 'Not Assigned',
        'Last Updated On': complaint.updatedAt ? formatDate(complaint.updatedAt as Timestamp | Date) : 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Complaints');

      // Make headers bold
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true }
          };
        }
      }

      const today = new Date();
      const dateStr = today.toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY format
      const fileName = `Filtered_Complaints_Report_${dateStr}.xlsx`;

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);

      toast.success("Filtered complaints exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export complaints. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded mb-6"></div>
        <div className="h-64 bg-gray-200 rounded mb-6"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded shadow-md space-y-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">{t("analytics")}</h2>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-2 text-gray-800">{t("Complaints By Status")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium mb-2 text-gray-800">{t("Complaints Resolved Over Time")}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2 text-gray-800">{t("Category Wise Complaint Ratio")}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Filter Panel */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="text-lg font-medium mb-4 text-gray-800">{t("Filter Complaints Before Export")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("Category")}</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">{t("All Categories")}</option>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="cleaning">Cleaning</option>
              <option value="security">Security</option>
              <option value="internet">Internet</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("Status")}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">{t("All Statuses")}</option>
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="reopened">Reopened</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Building Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("Building / Block")}</label>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">{t("All Buildings")}</option>
              {uniqueBuildings.map((building) => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
          </div>

          {/* Submitted By Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("Submitted By")}</label>
            <select
              value={submittedByFilter}
              onChange={(e) => setSubmittedByFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">{t("All")}</option>
              <option value="staff">{t("Staff")}</option>
              <option value="student">{t("Student")}</option>
            </select>
          </div>

          {/* Assigned To Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("Assigned To")}</label>
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">{t("All Supervisors")}</option>
              {supervisors.map((supervisor) => (
                <option key={supervisor} value={supervisor}>
                  {supervisor}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("Start Date")}</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholderText={t("Select start date")}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("End Date")}</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholderText={t("Select end date")}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            {t("Clear Filters")}
          </button>
          <button
            onClick={exportToExcel}
            disabled={exportLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exportLoading ? t("Exporting...") : `${t("Export Filtered Data")} (${filteredComplaints.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
