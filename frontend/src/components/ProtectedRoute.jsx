// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ user, children }) {
  const [mounted, setMounted] = useState(false);
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user && !token) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
