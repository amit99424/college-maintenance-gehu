import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Email, current password, and new password are required' });
  }

  const trimmedNewPassword = newPassword.trim();

  if (trimmedNewPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    // Query Firestore for user with matching email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword.trim(), userData.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(trimmedNewPassword, 10);

    // Update the password in Firestore
    await updateDoc(doc(db, 'users', userDoc.id), {
      password: hashedNewPassword,
    });

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password. Please try again.' });
  }
}
