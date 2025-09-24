# Authentication Components

This directory contains clean React components for authentication with Firebase integration.

## Components

### AuthSignup.jsx
A complete signup component that:
- Uses Firebase Authentication (Email/Password)
- Saves user details (name, rollno, department, role, email) to Firestore under `users/{uid}`
- Redirects to login page after successful signup
- Includes form validation and error handling
- Supports multiple user roles (student, staff, supervisor, admin)

### AuthLogin.jsx
A complete login component that:
- Verifies email & password with Firebase Authentication
- Fetches user role from Firestore (`users/{uid}.role`)
- Redirects based on role:
  - Student → `/student-dashboard`
  - Staff → `/staff-dashboard`
  - Supervisor → `/supervisor-dashboard`
  - Admin → `/admin-dashboard`
- Includes error handling for various authentication errors
- Shows role-based redirect information

## Usage

### In Next.js Pages
```jsx
import AuthSignup from '@/components/AuthSignup';
import AuthLogin from '@/components/AuthLogin';

export default function SignupPage() {
  return <AuthSignup />;
}

export default function LoginPage() {
  return <AuthLogin />;
}
```

### In React Router
```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthSignup from './components/AuthSignup';
import AuthLogin from './components/AuthLogin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<AuthSignup />} />
        <Route path="/login" element={<AuthLogin />} />
      </Routes>
    </Router>
  );
}
```

## Features

- ✅ Firebase Authentication integration
- ✅ Firestore data persistence
- ✅ Role-based redirection
- ✅ Form validation
- ✅ Error handling with user-friendly messages
- ✅ Responsive design
- ✅ Loading states
- ✅ Clean, modern UI

## Firebase Configuration

Make sure your Firebase config is properly set up in `src/firebase/config.js`:

```js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## Database Structure

The components expect the following Firestore structure:

```
users/{uid}: {
  name: string,
  rollno: string,
  department: string,
  role: string,
  email: string,
  createdAt: string,
  uid: string
}
```

## Error Handling

Both components handle common Firebase authentication errors:
- Email already in use
- Invalid email
- Weak password
- User not found
- Wrong password
- Too many requests
- And more...

## Styling

The components use Tailwind CSS for styling. Make sure Tailwind is properly configured in your project.
