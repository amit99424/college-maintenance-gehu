"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell
} from "recharts";
import { jsPDF } from "jspdf";
import { CSVLink } from "react-csv";

interface AnalyticsProps {
  category?: string;
}

interface Complaint {
  id: string;
  status: string;
  category: string;
  createdAt: Timestamp | Date;
  [key: string]: unknown;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

export default function Analytics({ category }: AnalyticsProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category) return;

    const q = query(
      collection(db, "complaints"),
      where("category", "==", category)
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
  }, [category]);

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

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Supervisor Dashboard Analytics", 10, 10);
    doc.text("Bar Chart: Complaints by Status", 10, 20);
    doc.text(JSON.stringify(barData, null, 2), 10, 30);
    doc.text("Line Chart: Complaints Resolved Over Time", 10, 60);
    doc.text(JSON.stringify(lineData, null, 2), 10, 70);
    doc.text("Pie Chart: Category-wise Complaint Ratio", 10, 100);
    doc.text(JSON.stringify(pieData, null, 2), 10, 110);
    doc.save("analytics.pdf");
  };

  // CSV data
  const csvData = complaints.map(c => ({
    id: c.id,
    status: c.status,
    category: c.category,
    createdAt: (c.createdAt instanceof Timestamp ? c.createdAt.toDate() : c.createdAt).toISOString()
  }));

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
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">Analytics</h2>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-2 text-gray-800">Complaints by Status</h3>
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
          <h3 className="text-lg font-medium mb-2 text-gray-800">Complaints Resolved Over Time</h3>
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
        <h3 className="text-lg font-medium mb-2 text-gray-800">Category-wise Complaint Ratio</h3>
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

      <div className="flex space-x-4">
        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export PDF
        </button>
        <CSVLink
          data={csvData}
          filename={"analytics.csv"}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Export CSV
        </CSVLink>
      </div>
    </div>
  );
}
