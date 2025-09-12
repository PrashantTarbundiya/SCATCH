import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const UserProtectedRoute = () => {
  const { isAuthenticated, authLoading } = useUser();

  if (authLoading) {
    return <div className="w-full min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default UserProtectedRoute;