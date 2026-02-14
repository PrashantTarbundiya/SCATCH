import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useOwner } from '../context/OwnerContext';
import logo from '../assets/logo2.png';

import { cn } from '../utils/cn';
import NotificationBell from './NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';

// Neo-brutalist Button Component for the Header
const NavbarButton = ({ children, onClick, to, variant = 'primary', className = '', icon }) => {
  const baseStyle = "font-black uppercase border-2 border-black px-4 py-2 transition-all shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none flex items-center justify-center gap-2 text-sm tracking-wider";

  const variants = {
    primary: "bg-blue-600 text-white",
    secondary: "bg-white text-black hover:bg-gray-100",
    danger: "bg-red-500 text-white",
    success: "bg-green-500 text-white",
    warning: "bg-yellow-400 text-black",
    ghost: "bg-transparent border-transparent shadow-none hover:shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-gray-100",
  };

  const content = (
    <>
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cn(baseStyle, variants[variant], className)}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cn(baseStyle, variants[variant], className)}>
      {content}
    </button>
  );
};

const Header = () => {
  const { currentUser, isAuthenticated, logoutUser } = useUser();
  const { currentOwner, isOwnerAuthenticated, logoutOwnerContext } = useOwner();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleUserLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      navigate('/login');
    }
  };

  const handleOwnerLogout = async () => {
    const result = await logoutOwnerContext();
    if (result.success) {
      navigate('/owner-login');
    }
  };

  // Determine Logo Link
  let logoLink = "/";
  if (isOwnerAuthenticated) {
    logoLink = "/admin";
  }

  // Determine Navigation Links
  const navLinks = [];
  if (isOwnerAuthenticated) {
    navLinks.push({ name: "Admin Panel", link: "/admin" });
    navLinks.push({ name: "Sales", link: "/admin/sales" });
    navLinks.push({ name: "Create Product", link: "/create-product" });
  } else if (isAuthenticated) {
    navLinks.push({ name: "Shop", link: "/shop" });
    navLinks.push({ name: "Cart", link: "/cart" });
    navLinks.push({ name: "Profile", link: "/profile" });
    navLinks.push({ name: "Contact", link: "/contact" });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b-4 border-black font-sans">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">

          {/* Logo Section */}
          <Link to={logoLink} className="flex items-center gap-3 group relative z-50">
            <img
              src={logo}
              alt="Scatch Logo"
              className="h-12 w-12 object-contain border-2 border-black shadow-neo-sm group-hover:-translate-y-1 group-hover:shadow-none transition-all bg-white"
            />
            <span className="text-3xl font-black uppercase tracking-tighter italic group-hover:-skew-x-12 transition-transform select-none">
              Scatch
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.link}
                className={cn(
                  "font-black uppercase text-sm tracking-widest border-b-4 border-transparent hover:border-black transition-all py-1",
                  isActive(link.link) ? "border-black" : ""
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">


            {isAuthenticated && (
              <div className="relative z-50">
                <NotificationBell />
              </div>
            )}

            {!isAuthenticated && !isOwnerAuthenticated && (
              <>
                <NavbarButton to="/login" variant="secondary">Login</NavbarButton>
                <NavbarButton to="/register" variant="primary">Register</NavbarButton>
                <NavbarButton to="/owner-login" variant="warning" icon={<i className="ri-shield-user-line"></i>}>Owner Login</NavbarButton>
              </>
            )}

            {isAuthenticated && (
              <NavbarButton onClick={handleUserLogout} variant="secondary" icon={<i className="ri-logout-box-line"></i>}>
                Logout
              </NavbarButton>
            )}

            {isOwnerAuthenticated && (
              <NavbarButton onClick={handleOwnerLogout} variant="danger" icon={<i className="ri-shut-down-line"></i>}>
                Owner Logout
              </NavbarButton>
            )}
          </div>

        </div>
      </header>

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div className="h-20"></div>
    </>
  );
};

export default Header;
