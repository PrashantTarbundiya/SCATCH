import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useOwner } from '../context/OwnerContext';

const OwnerProtectedRoute = () => {
  const { isOwnerAuthenticated, isLoading } = useOwner(); // Add isLoading

  // console.log("OwnerProtectedRoute: isLoading =", isLoading, "isOwnerAuthenticated =", isOwnerAuthenticated);

  if (isLoading) {
    // You can return a loading spinner or a simple message here
    return <div className="w-full min-h-screen flex items-center justify-center">Loading session...</div>;
  }

  if (!isOwnerAuthenticated) {
    // Redirect them to the /owner-login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/owner-login" replace />;
  }

  return <Outlet />; // Render the child route (e.g., Admin page)
};

export default OwnerProtectedRoute;