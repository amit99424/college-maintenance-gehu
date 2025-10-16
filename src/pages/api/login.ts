import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcrypt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Query Firestore users collection for email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Compare the entered password with the hashed password from Firestore
    const match = await bcrypt.compare(password.trim(), userData.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = userData;
    const fullUserData = { ...userWithoutPassword, uid: userDoc.id };

    res.status(200).json({
      message: 'Login successful',
      user: fullUserData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
