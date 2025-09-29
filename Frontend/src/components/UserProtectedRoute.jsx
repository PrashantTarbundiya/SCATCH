import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { PageSkeleton } from './ui/SkeletonLoader.jsx';

const UserProtectedRoute = () => {
  const { isAuthenticated, authLoading } = useUser();

  if (authLoading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <PageSkeleton title={true} content={5} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default UserProtectedRoute;