import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useOwner } from '../context/OwnerContext';

const AdminSidebar = () => {
    const { logoutOwnerContext } = useOwner();
    const navigate = useNavigate();
    
    const linkStyle = 'flex items-center px-3 py-2 mx-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors';
    const activeLinkStyle = 'bg-blue-600 text-white';

    const handleMobileNavClick = () => {
        if (window.innerWidth < 768) {
            window.dispatchEvent(new CustomEvent('hideMobileSidebar'));
        }
    };

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            const result = await logoutOwnerContext();
            if (result.success) {
                navigate('/owner-login');
            } else {
                console.error('Owner logout failed:', result.error);
                alert('Logout failed. Please try again.');
            }
        }
    };

    return (
        <aside className="w-64 min-h-screen bg-gray-800 text-gray-100 shadow-xl fixed top-0 left-0 transition-all duration-300 z-50 border-r border-gray-700 translate-x-0">
            {/* Header with logo */}
            <div className="flex items-center p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">SCATCH Admin</h2>
            </div>

            {/* Navigation Menu */}
            <nav className="p-4">
                <ul className="space-y-2">
                    <li>
                        <NavLink 
                            to="/admin" 
                            end
                            className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}
                        >
                            <i className="ri-dashboard-line text-lg mr-3"></i>
                            <span>All Products</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/admin/sales" 
                            className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}
                        >
                            <i className="ri-bar-chart-line text-lg mr-3"></i>
                            <span>Sales Analytics</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/admin/coupons" 
                            className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}
                        >
                            <i className="ri-coupon-line text-lg mr-3"></i>
                            <span>Manage Coupons</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/admin/orders" 
                            className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}
                        >
                            <i className="ri-truck-line text-lg mr-3"></i>
                            <span>Manage Orders</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink 
                            to="/create-product" 
                            className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}
                        >
                            <i className="ri-add-box-line text-lg mr-3"></i>
                            <span>Create New Product</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>

            {/* Logout Button at Bottom */}
            <div className="absolute bottom-4 left-0 right-0 px-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center py-3 px-4 text-sm text-gray-300 hover:bg-red-600 hover:text-white rounded-md transition-colors"
                >
                    <i className="ri-logout-box-line text-lg mr-3"></i>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;