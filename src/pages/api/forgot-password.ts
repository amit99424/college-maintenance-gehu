import { NextApiRequest, NextApiResponse } from 'next';
import { auth, db } from '@/firebase/config';
import { updatePassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, dob } = req.body;

  if (!email || !dob) {
    return res.status(400).json({ error: 'Email and Date of Birth are required' });
  }

  try {
    // Query Firestore for user with matching email and dob
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), where('dob', '==', dob));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'User not found or Date of Birth does not match' });
    }

    // Generate a new random password
    const newPassword = crypto.randomBytes(8).toString('hex');

    // Get the user document
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Update the password in Firestore (if stored there)
    await updateDoc(doc(db, 'users', userDoc.id), {
      password: newPassword, // Note: In production, passwords should be hashed
    });

    // For Firebase Auth, we would need to update the password, but since we don't have the user signed in,
    // we can only update the Firestore record. In a real app, you might need to handle this differently.

    res.status(200).json({
      message: 'Password reset successful. Your new password is: ' + newPassword,
      newPassword: newPassword
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
}
