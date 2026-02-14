import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useOwner } from '../context/OwnerContext';
import { PageSkeleton } from './ui/SkeletonLoader.jsx';
import AdminSidebar from './AdminSidebar';

const OwnerProtectedRoute = () => {
  const { isOwnerAuthenticated, isLoading, logoutOwnerContext } = useOwner();
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
      {/* Sidebar - Hidden on mobile, static pinned on desktop */}
      <div
        className={`hidden lg:block lg:static lg:h-full shrink-0`}
      >
        <AdminSidebar />
      </div>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden transition-all duration-300 flex flex-col relative" id="admin-main-content">

        {/* Mobile Header for Admin */}
        {isMobile && (
          <div className="bg-yellow-300 border-b-4 border-black p-4 sticky top-0 z-30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="font-black uppercase text-xl italic tracking-tighter">SCATCH <span className="text-sm not-italic ml-1 bg-black text-white px-1">ADMIN</span></h1>
            </div>
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to logout?')) {
                  const result = await logoutOwnerContext();
                  if (result.success) {
                    window.location.href = '/owner-login';
                  }
                }
              }}
              className="p-2 bg-red-500 text-white border-2 border-black shadow-neo-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all font-black uppercase text-xs flex items-center gap-1"
            >
              <i className="ri-logout-box-line text-lg"></i>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}

        {/* The Outlet will render the specific admin page component */}
        <div className="p-4 md:p-6 lg:p-8 flex-1 pb-24">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OwnerProtectedRoute;




