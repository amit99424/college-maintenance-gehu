import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../firebase/config';
import { doc, updateDoc, getDoc, addDoc, collection, Timestamp, query, where, getDocs, DocumentReference } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { complaintId, newStatus, message } = req.body;

  if (!complaintId || !newStatus) {
    return res.status(400).json({ error: 'Complaint ID and new status are required' });
  }

  try {
    // Update the complaint status
    const complaintRef = doc(db, 'complaints', complaintId);
    const complaintSnap = await getDoc(complaintRef);

    if (!complaintSnap.exists()) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaintData = complaintSnap.data();

    await updateDoc(complaintRef, {
      status: newStatus,
      updatedAt: new Date(),
      lastUpdatedBy: 'Admin',
      lastUpdatedByRole: 'Admin',
    });

    // Create notification for the student (creator)
    if (message && message.trim()) {
      await addDoc(collection(db, 'notifications'), {
        complaintId: complaintId,
        message: message.trim(),
        roles: ["student", "staff"],
        category: complaintData.category,
        targetUid: complaintData.userId,
        seen: false,
        timestamp: new Date(),
      });
    } else {
      // Always create a notification for status update
      await addDoc(collection(db, 'notifications'), {
        complaintId: complaintId,
        message: `Your complaint "${complaintData.title}" status has been updated to ${newStatus}`,
        roles: ["student", "staff"],
        category: complaintData.category,
        targetUid: complaintData.userId,
        seen: false,
        timestamp: new Date(),
      });
    }

    // Create notifications for supervisors matching the complaint category
    const supervisorQuery = query(collection(db, 'users'), where('role', '==', 'supervisor'), where('department', '==', complaintData.category));
    const supervisorSnapshot = await getDocs(supervisorQuery);
    const supervisorNotifications: Promise<DocumentReference>[] = [];
    supervisorSnapshot.forEach((docSnap) => {
      supervisorNotifications.push(addDoc(collection(db, 'notifications'), {
        complaintId: complaintId,
        message: `Complaint "${complaintData.title}" in your department status updated to ${newStatus}`,
        roles: ["supervisor"],
        category: complaintData.category,
        targetUid: docSnap.id,
        seen: false,
        timestamp: new Date(),
      }));
    });
    await Promise.all(supervisorNotifications);

    res.status(200).json({ success: true, message: 'Complaint status updated successfully' });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
}
