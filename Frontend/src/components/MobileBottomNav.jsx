import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useWishlist } from '../context/WishlistContext';
import { useOwner } from '../context/OwnerContext';

const MobileBottomNav = () => {
    const { isAuthenticated } = useUser();
    const { isOwnerAuthenticated } = useOwner();
    const { wishlistItems } = useWishlist();
    const location = useLocation();

    const authenticatedNavItems = [
        {
            path: "/",
            icon: "ri-home-line",
            activeIcon: "ri-home-fill",
            label: "Home"
        },
        {
            path: "/shop",
            icon: "ri-store-2-line",
            activeIcon: "ri-store-2-fill",
            label: "Shop"
        },
        {
            path: "/shop?filter=wishlist&sortBy=newest",
            icon: "ri-heart-line",
            activeIcon: "ri-heart-fill",
            label: "Wishlist",
            badge: wishlistItems.length > 0
        },
        {
            path: "/cart",
            icon: "ri-shopping-cart-line",
            activeIcon: "ri-shopping-cart-fill",
            label: "Cart"
        },
        {
            path: "/profile",
            icon: "ri-user-line",
            activeIcon: "ri-user-fill",
            label: "Profile"
        },
    ];

    const unauthenticatedNavItems = [
        {
            path: "/",
            icon: "ri-home-line",
            activeIcon: "ri-home-fill",
            label: "Home"
        },
        {
            path: "/login",
            icon: "ri-login-box-line",
            activeIcon: "ri-login-box-fill",
            label: "Login"
        },
        {
            path: "/register",
            icon: "ri-user-add-line",
            activeIcon: "ri-user-add-fill",
            label: "Register"
        },
        {
            path: "/owner-login",
            icon: "ri-shield-user-line",
            activeIcon: "ri-shield-user-fill",
            label: "Owner"
        },
    ];

    const ownerNavItems = [
        {
            path: "/admin",
            icon: "ri-dashboard-line",
            activeIcon: "ri-dashboard-fill",
            label: "Dash"
        },
        {
            path: "/admin/sales",
            icon: "ri-funds-line",
            activeIcon: "ri-funds-fill",
            label: "Sales"
        },
        {
            path: "/create-product",
            icon: "ri-add-circle-line",
            activeIcon: "ri-add-circle-fill",
            label: "Create"
        },
        {
            path: "/admin/orders",
            icon: "ri-list-ordered",
            activeIcon: "ri-file-list-fill",
            label: "Orders"
        },
        {
            path: "/admin/coupons",
            icon: "ri-ticket-line",
            activeIcon: "ri-ticket-fill",
            label: "Coupons"
        },
    ];

    let navItems;
    if (isOwnerAuthenticated) {
        navItems = ownerNavItems;
    } else if (isAuthenticated) {
        navItems = authenticatedNavItems;
    } else {
        navItems = unauthenticatedNavItems;
    }

    // Helper to check if link is active
    // For exact paths like "/", basic isActive is fine.
    // For query params, we might need custom logic, but NavLink handles basic path matching.
    const isLinkActive = (itemPath) => {
        if (itemPath === "/") return location.pathname === "/";
        // Ensure /admin (Dash) doesn't match other admin routes like /admin/sales
        if (itemPath === "/admin") return location.pathname === "/admin";

        // Handle query params for wishlist
        if (itemPath.includes("?")) {
            return location.pathname + location.search === itemPath;
        }
        return location.pathname.startsWith(itemPath);
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-black h-16 flex items-center justify-around lg:hidden shadow-neo-up safe-area-pb">
                {navItems.map((item, index) => {
                    // If checking active state with query params is tricky with NavLink, 
                    // we can use standard Link and custom formatting.
                    const isActive = isLinkActive(item.path);

                    return (
                        <NavLink
                            key={index}
                            to={item.path}
                            className="flex flex-col items-center justify-center w-full h-full relative"
                        >
                            {({ isActive: navLinkActive }) => {
                                // For /admin, we MUST use our custom check to avoid matching sub-routes.
                                // For other routes, we can use navLinkActive, but sticking to one logic is safer.
                                // Let's use isLinkActive for everything.
                                const active = isLinkActive(item.path);

                                return (
                                    <>
                                        <div className={`transition-transform duration-200 ${active ? '-translate-y-1' : ''}`}>
                                            <i className={`text-2xl ${active ? item.activeIcon : item.icon} ${active ? 'text-black' : 'text-gray-400'}`}></i>
                                        </div>

                                        {/* Active Indicator Dot */}
                                        {active && (
                                            <span className="absolute bottom-2 w-1.5 h-1.5 bg-black rounded-full"></span>
                                        )}

                                        {/* Badge for Wishlist */}
                                        {item.badge && (
                                            <span className="absolute top-3 right-[25%] w-2.5 h-2.5 bg-red-500 border border-black rounded-full"></span>
                                        )}
                                    </>
                                );
                            }}
                        </NavLink>
                    );
                })}
            </div>
            <div className="h-16 lg:hidden block w-full bg-transparent pointer-events-none" aria-hidden="true" />
        </>
    );
};

export default MobileBottomNav;
