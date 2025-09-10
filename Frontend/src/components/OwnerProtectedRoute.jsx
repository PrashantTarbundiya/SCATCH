import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useOwner } from '../context/OwnerContext';
import AdminSidebar from './AdminSidebar'; // Import the AdminSidebar

const OwnerProtectedRoute = () => {
  const { isOwnerAuthenticated, isLoading } = useOwner(); 
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return <div className="w-full min-h-screen flex items-center justify-center">Loading session...</div>;
  }

  if (!isOwnerAuthenticated) {
    return <Navigate to="/owner-login" replace />;
  }

  // If authenticated, render the sidebar and the child route content
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar - show on desktop always, on mobile when toggled */}
      <div className={`${isMobile && !sidebarVisible ? 'hidden' : 'block'}`}>
        <AdminSidebar />
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && sidebarVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarVisible(false)}
        />
      )}
      
      <main className="transition-all duration-300 ml-0 md:ml-64">
        {/* Mobile menu button - show on mobile when sidebar is hidden */}
        {!sidebarVisible && isMobile && (
          <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <button
              onClick={() => setSidebarVisible(true)}
              className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
              aria-label="Open sidebar"
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1.5">
                <div className="w-full h-0.5 bg-slate-600 dark:bg-slate-300 rounded-full"></div>
                <div className="w-full h-0.5 bg-slate-600 dark:bg-slate-300 rounded-full"></div>
                <div className="w-full h-0.5 bg-slate-600 dark:bg-slate-300 rounded-full"></div>
              </div>
            </button>
          </div>
        )}
        
        {/* The Outlet will render the specific admin page component */}
        <div className="p-4 md:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OwnerProtectedRoute;