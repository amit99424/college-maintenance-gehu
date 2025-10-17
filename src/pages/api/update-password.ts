import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  const trimmedNewPassword = newPassword.trim();

  if (trimmedNewPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Query Firestore for user with matching email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(trimmedNewPassword, 10);

    // Update the password in Firestore
    const userDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), {
      password: hashedPassword,
    });

    res.status(200).json({ message: 'Password updated successfully. Please log in.' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password. Please try again.' });
  }
}
