import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useOwner } from '../context/OwnerContext';
import { PageSkeleton } from './ui/SkeletonLoader.jsx';
import AdminSidebar from './AdminSidebar';

const OwnerProtectedRoute = () => {
  const { isOwnerAuthenticated, isLoading } = useOwner();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024); // Changed break point to lg (1024px) for better tablet experience

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarVisible(false); // Reset on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl">
          <PageSkeleton title={true} content={5} />
        </div>
      </div>
    );
  }

  if (!isOwnerAuthenticated) {
    return <Navigate to="/owner-login" replace />;
  }

  // If authenticated, render the sidebar and the child route content
  return (
    <div className="h-screen w-full bg-gray-50 font-sans flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar - fixed on mobile (overlay), static pinned on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${isMobile && !sidebarVisible ? '-translate-x-full' : 'translate-x-0'} transition-transform duration-300 lg:translate-x-0 lg:static lg:h-full shrink-0`}
      >
        <AdminSidebar />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isMobile && sidebarVisible && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarVisible(false)}
        />
      )}

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden transition-all duration-300 flex flex-col relative" id="admin-main-content">
        {/* Mobile menu button - sticky at top of scrollable area on mobile */}
        {isMobile && (
          <div className="bg-white border-b-4 border-black p-4 sticky top-0 z-30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarVisible(true)}
                className="p-2 bg-white border-2 border-black shadow-neo active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                aria-label="Open sidebar"
              >
                <i className="ri-menu-line text-xl font-bold"></i>
              </button>
              <h1 className="font-black uppercase text-xl">Admin Panel</h1>
            </div>
          </div>
        )}

        {/* The Outlet will render the specific admin page component */}
        <div className="p-4 md:p-6 lg:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OwnerProtectedRoute;




