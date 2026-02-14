import React from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useOwner } from '../context/OwnerContext';

const AdminSidebar = () => {
    const { logoutOwnerContext } = useOwner();
    const navigate = useNavigate();
    const location = useLocation();

    // Neo-brutalist Link Styles
    const linkStyle = 'flex items-center px-4 py-3 mx-2 mb-2 font-black uppercase text-sm border-2 border-transparent transition-all hover:border-black hover:bg-yellow-300 hover:shadow-neo-sm hover:-translate-y-[2px] hover:-translate-x-[2px] text-gray-800';
    const activeLinkStyle = 'bg-black text-white border-black shadow-neo-sm -translate-y-[2px] -translate-x-[2px] hover:bg-black hover:text-white hover:shadow-neo-sm hover:-translate-y-[2px] hover:-translate-x-[2px]';

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
        <aside className="w-64 min-h-full bg-white text-black flex flex-col border-r-4 border-black">
            {/* Header with logo */}
            <div className="h-20 flex items-center justify-center border-b-4 border-black bg-yellow-300">
                <Link to="/admin" className="text-2xl font-black uppercase tracking-tighter italic">
                    SCATCH <span className="text-sm not-italic ml-1 bg-black text-white px-1">ADMIN</span>
                </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="p-4 flex-grow overflow-y-auto">
                <ul className="space-y-1">
                    <li>
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => {
                                // Custom check: Active only if exactly /admin or starting with /admin/edit-product
                                // This prevents it from being active on /admin/sales, /admin/orders, etc.
                                const isProductsActive = location.pathname === '/admin' || location.pathname.startsWith('/admin/edit-product');
                                return isProductsActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle;
                            }}
                        >
                            <i className="ri-dashboard-line text-xl mr-3"></i>
                            <span>Products</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/sales"
                            className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}
                        >
                            <i className="ri-bar-chart-line text-xl mr-3"></i>
                            <span>Analytics</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/create-product"
                            className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}
                        >
                            <i className="ri-add-box-line text-xl mr-3"></i>
                            <span>Create Product</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/orders"
                            className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}
                        >
                            <i className="ri-truck-line text-xl mr-3"></i>
                            <span>Orders</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/coupons"
                            className={({ isActive }) => isActive ? `${linkStyle} ${activeLinkStyle}` : linkStyle}
                        >
                            <i className="ri-coupon-line text-xl mr-3"></i>
                            <span>Coupons</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>

            {/* Logout Button at Bottom */}
            <div className="p-4 border-t-4 border-black bg-gray-50">
                <div className="mb-4 px-2">
                    <p className="text-xs font-bold uppercase text-gray-500">Logged in as Owner</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center py-3 px-4 font-black uppercase text-sm text-white bg-red-600 border-2 border-black shadow-neo-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                    <i className="ri-logout-box-line text-lg mr-2"></i>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;




