"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, DocumentData, Timestamp, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "@/firebase/config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Notification {
  id: string;
  userId: string;
  complaintId: string;
  complaintTitle: string;
  message: string;
  read: boolean;
  createdAt: Timestamp | Date | null;
  updatedBy: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsData: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        notificationsData.push({
          id: doc.id,
          userId: data.userId,
          complaintId: data.complaintId,
          complaintTitle: data.complaintTitle,
          message: data.message,
          read: data.read,
          createdAt: data.createdAt ?? null,
          updatedBy: data.updatedBy,
        });
      });
      setNotifications(notificationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: Notification["createdAt"]) => {
    if (!timestamp) return "N/A";
    const date =
      timestamp instanceof Date
        ? timestamp
        : "toDate" in timestamp
        ? timestamp.toDate()
        : new Date(timestamp as string | number);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const openDialog = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
    
    // Mark as read when opened
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const closeDialog = () => {
    setSelectedNotification(null);
    setIsDialogOpen(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(notification => 
        updateDoc(doc(db, "notifications", notification.id), { read: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
            <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>

            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No notifications found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    notification.read ? "border-gray-200 bg-white" : "border-blue-300 bg-blue-50"
                  }`}
                  onClick={() => openDialog(notification)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">
                      {notification.complaintTitle}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                        >
                          Mark as read
                        </button>
                      )}
                      {!notification.read && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2 line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="text-sm text-gray-500">
                    <span>Updated: {formatDate(notification.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog for Notification Details */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-blue-700 font-bold text-xl mb-4">
              Notification Details
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-3 text-gray-800">
              <p className="font-semibold text-lg">
                {selectedNotification.complaintTitle}
              </p>
              <p>
                {selectedNotification.message}
              </p>
              <p className="text-sm text-gray-500">
                Updated by: {selectedNotification.updatedBy}
              </p>
              <p className="text-sm text-gray-500">
                Time: {formatDate(selectedNotification.createdAt)}
              </p>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={closeDialog}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
