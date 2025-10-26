"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell
} from "recharts";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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

  const barData = Object.entries(statusCounts).filter(([status]) => status.toLowerCase() !== "in-progress").map(([status, count]) => ({
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
      <h2 className="text-2xl font-semibold mb-4 text-gray-900">{t("Analytics")}</h2>

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


    </div>
  );
}
