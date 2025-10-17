import { db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const trimmedPassword = password.trim();

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", normalizedEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return res.status(401).json({ error: 'Email not found' });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (!userData.password || typeof userData.password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let match = false;
    if (userData.password.startsWith('$2b$') || userData.password.startsWith('$2a$')) {
      match = await bcrypt.compare(trimmedPassword, userData.password);
    } else {
      match = trimmedPassword === userData.password;
    }

    if (!match) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const { password: _, ...userWithoutPassword } = userData;
    const fullUserData = { ...userWithoutPassword, uid: userDoc.id };

    res.status(200).json({
      ok: true,
      userData: fullUserData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}
