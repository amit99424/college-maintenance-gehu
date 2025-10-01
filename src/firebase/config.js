import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAoxJ8n-p0J2xfsNIKn0lbA-0HxuOP7dT0",
  authDomain: "college-maintenance-69e16.firebaseapp.com",
  projectId: "college-maintenance-69e16",
  storageBucket: "college-maintenance-69e16.appspot.com",
  messagingSenderId: "695095632678",
  appId: "1:695095632678:web:4ef95b2f4e5210b44957e7",
  measurementId: "G-VWBM5JP0NH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
