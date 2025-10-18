import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../firebase/config';
import { doc, updateDoc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';

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

    // Create notification if message is provided
    if (message && message.trim()) {
      await addDoc(collection(db, 'notifications'), {
        userId: complaintData.userId,
        complaintId: complaintId,
        complaintTitle: complaintData.title,
        message: message.trim(),
        createdAt: new Date(),
        read: false,
        updatedBy: 'Admin',
      });
    } else {
      // Always create a notification for status update
      await addDoc(collection(db, 'notifications'), {
        userId: complaintData.userId,
        complaintId: complaintId,
        complaintTitle: complaintData.title,
        message: `Your complaint "${complaintData.title}" status has been updated to ${newStatus}`,
        createdAt: new Date(),
        read: false,
        updatedBy: 'Admin',
      });
    }

    res.status(200).json({ success: true, message: 'Complaint status updated successfully' });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
}
