"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/config";

interface DashboardHomeProps {
  category?: string;
  setActiveSection: (section: string) => void;
  setStatusFilter?: (status: string) => void;
}

interface Complaint {
  id: string;
  status: string;
  category: string;
  [key: string]: unknown;
}

export default function DashboardHome({ category, setActiveSection, setStatusFilter }: DashboardHomeProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComplaintsToday, setNewComplaintsToday] = useState(0);
  const [resolvedLast24h, setResolvedLast24h] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const [systemEfficiency, setSystemEfficiency] = useState(0);

  useEffect(() => {
    if (!category) return;

    const q = query(
      collection(db, "complaints"),
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const complaintsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complaint[];
      setComplaints(complaintsData);

      // Calculate stats
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      let newToday = 0;
      let resolved24h = 0;
      let totalCompleted = 0;
      const totalComplaints = complaintsData.length;
      const responseTimes: number[] = [];

      complaintsData.forEach(complaint => {
        const createdAt = complaint.createdAt instanceof Timestamp ? complaint.createdAt.toDate() : new Date(complaint.createdAt as string);
        const updatedAt = complaint.updatedAt instanceof Timestamp ? complaint.updatedAt.toDate() : new Date(complaint.updatedAt as string || createdAt);

        if (createdAt >= startOfDay) newToday++;
        if (complaint.status.toLowerCase() === 'completed' && updatedAt >= last24h) resolved24h++;
        if (complaint.status.toLowerCase() === 'completed') {
          totalCompleted++;
          const responseTime = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // hours
          responseTimes.push(responseTime);
        }
      });

      setNewComplaintsToday(newToday);
      setResolvedLast24h(resolved24h);
      setAvgResponseTime(responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0);
      setSystemEfficiency(totalComplaints > 0 ? Math.round((totalCompleted / totalComplaints) * 100) : 0);

      setLoading(false);
    });

    return () => unsubscribe();
  }, [category]);

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      "in-progress": 0,
      completed: 0,
      reopened: 0
    };

    complaints.forEach(complaint => {
      const status = complaint.status.toLowerCase().replace(" ", "-");
      if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case "electrical":
        return "bg-yellow-200 border-yellow-400 text-yellow-900 hover:bg-yellow-300";
      case "plumbing":
        return "bg-blue-200 border-blue-400 text-blue-900 hover:bg-blue-300";
      case "cleaning":
        return "bg-green-200 border-green-400 text-green-900 hover:bg-green-300";
      default:
        return "bg-gray-200 border-gray-400 text-gray-900";
    }
  };

  const statusCounts = getStatusCounts();

  const summaryCards = [
    {
      title: "Pending",
      count: statusCounts.pending,
      status: "pending",
      color: "bg-red-200 border-red-400 text-red-900 hover:bg-red-300",
      icon: "⏳"
    },
    {
      title: "In Progress",
      count: statusCounts["in-progress"],
      status: "in progress",
      color: "bg-yellow-20 border-yellow-400 text-yellow-900 hover:bg-yellow-300",
      icon: "🔄"
    },
    {
      title: "Completed",
      count: statusCounts.completed,
      status: "completed",
      color: "bg-green-200 border-green-400 text-green-900 hover:bg-green-300",
      icon: "✅"
    },
    {
      title: "Reopened",
      count: statusCounts.reopened,
      status: "reopened",
      color: "bg-orange-200 border-orange-400 text-orange-900 hover:bg-orange-300",
      icon: "🔄"
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Loading Skeleton for Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
                <div className="h-4 w-16 bg-gray-300 rounded"></div>
              </div>
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>

        {/* Loading Skeleton for Recent Complaints */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-poppins text-gray-900">Recent Complaints</h3>
            <button
              className="text-blue-600 hover:underline"
              onClick={() => setActiveSection("my-complaints")}
            >
              View All →
            </button>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Today’s Overview Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white shadow-lg hover:scale-105 transition-transform duration-300">
        <h2 className="text-2xl font-bold font-poppins mb-2">Today’s Overview</h2>
        <p className="text-blue-100 mb-6">Here’s a quick insight into today’s system activity</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-1">📊</div>
            <p className="text-sm opacity-90">New Complaints Today</p>
            <p className="text-2xl font-bold">{newComplaintsToday}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">⚙️</div>
            <p className="text-sm opacity-90">Resolved in last 24 hours</p>
            <p className="text-2xl font-bold">{resolvedLast24h}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">⏱️</div>
            <p className="text-sm opacity-90">Avg Response Time</p>
            <p className="text-2xl font-bold">{avgResponseTime.toFixed(1)} hrs</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">💡</div>
            <p className="text-sm opacity-90">System Efficiency</p>
            <p className="text-2xl font-bold">{systemEfficiency}%</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <div
            key={card.status}
            className={`bg-white p-6 rounded-xl shadow-lg border-l-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 transform ${card.color}`}
            onClick={() => {
              setStatusFilter && setStatusFilter(card.status);
              setActiveSection("my-complaints");
            }}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-sm font-medium opacity-75">View Details</span>
            </div>
            <h3 className="text-lg font-semibold font-poppins mb-2">{card.title}</h3>
            <p className="text-3xl font-bold font-poppins">{card.count}</p>
            <div className="mt-2 flex items-center text-sm">
              <span className="opacity-75">Complaints</span>
              <svg className="w-4 h-4 ml-1 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Complaints Preview */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-poppins text-gray-900">Recent Complaints</h3>
          <button
            onClick={() => setActiveSection("my-complaints")}
            className="text-blue-600 hover:underline"
          >
            View All →
          </button>
        </div>
        {complaints.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500 font-medium">No complaints found for your category.</p>
            <p className="text-sm text-gray-400 mt-1">New complaints will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.slice(0, 5).map((complaint, index) => (
              <div
                key={complaint.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">{complaint.title as string}</p>
                  <p className="text-sm text-gray-600">
                    {complaint.building as string} - {complaint.room as string} • {complaint.status}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(() => {
                      const createdAt = complaint.createdAt as Timestamp | Date | undefined;
                      if (createdAt instanceof Timestamp) {
                        return createdAt.toDate().toLocaleDateString();
                      } else if (createdAt instanceof Date) {
                        return createdAt.toLocaleDateString();
                      } else {
                        return 'Recent';
                      }
                    })()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(category || "")}`}>
                  {complaint.status}
                </span>
              </div>
            ))}
            {complaints.length > 5 && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setActiveSection("my-complaints")}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  View All Complaints
                  <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
