import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
      return res.status(404).json({ error: 'User details not found or incorrect.' });
    }

    // User found
    res.status(200).json({ message: 'User verified successfully.' });
  } catch (error) {
    console.error('Error verifying user:', error);
    res.status(500).json({ error: 'Failed to verify user. Please try again.' });
  }
}
