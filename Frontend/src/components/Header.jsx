"use client";;
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useOwner } from '../context/OwnerContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/cn';
import { IconMenu2, IconX } from "@tabler/icons-react";
import { LimelightNav } from './ui/limelight-nav';
import NotificationBell from './NotificationBell';

import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";

// Navbar Components (from user prompt)

export const Navbar = ({
  children,
  className
}) => {
  const ref = useRef(null);
  // Use window for scrollY if target is not specific to an element
  const { scrollY } = useScroll(); // Removed target for global scroll tracking
  const [visible, setVisible] = useState(false); // Default to not visible (or true if preferred initially)

  // Set initial visibility based on scroll position, e.g., visible if already scrolled
  useEffect(() => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, []);


  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) { // Threshold for navbar change
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div
      ref={ref}
      className={cn("fixed inset-x-0 top-0 z-40 w-full", className)} // Changed to fixed top-0
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { visible })
          : child)}
    </motion.div>
  );
};

export const NavBody = ({
  className,
  visible,
  unifiedDesktopItems, // New prop
  logoItem, // New prop for the logo
  limelightNavItems, // New prop for LimelightNav
  activeNavIndex, // New prop for active index
  onItemClick // Prop for nav link clicks
}) => {
  const location = useLocation();
  const [isHovering, setIsHovering] = useState(false); // For overall NavBody blur
  const [hoveredKey, setHoveredKey] = useState(null); // For unified item hover animation
  const isHomePage = location.pathname === '/';

  // --- Dynamically adjust items for navLinks and actions based on 'visible' and logged-out state ---
  let currentNavLinks = unifiedDesktopItems.filter(item => item.section === 'navLinks');
  let currentActions = unifiedDesktopItems.filter(item => item.section === 'actions');

  // Infer logged-out state by checking if 'User Login' is an action item
  const isLoggedOutForConditionalRendering = currentActions.some(item => item.label === 'User Login');

  if (visible && isLoggedOutForConditionalRendering) {
    const authActionLabels = ['User Login', 'Owner Login', 'Register'];
    
    const authActionsToMove = currentActions.filter(item => authActionLabels.includes(item.label));
    currentNavLinks = [...currentNavLinks, ...authActionsToMove]; // Add them to nav links
    currentActions = currentActions.filter(item => !authActionLabels.includes(item.label)); // Remove them from actions
  }

  return (
    <motion.div
      onMouseEnter={() => setIsHovering(true)} // For NavBody's own blur
      onMouseLeave={() => {
        setIsHovering(false);
        setHoveredKey(null); // Clear item hover on leaving NavBody
      }}
      animate={{
        backdropFilter: (visible || isHovering) ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "none",
        width: visible ? "45%" : "100%", 
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      style={{
        minWidth: "300px", 
      }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl flex-row items-center self-start rounded-full bg-transparent px-4 py-2 lg:flex dark:bg-transparent",
        visible && "bg-white/90 dark:bg-neutral-900/90 border border-gray-200/20 dark:border-gray-700/20",
        className
      )}>
      {/* Render Logo */}
      <NavbarLogo
        to={logoItem.to}
        logoText={logoItem.logoText}
        className="mr-4" // Add some margin
        // No hover animation for logo itself, or add if desired with a unique key
      />

      {/* Render LimelightNav or Unified NavLinks (center) */}
      <div className="flex flex-1 items-center justify-center space-x-1">
        {limelightNavItems.length > 0 ? (
          <LimelightNav 
            items={limelightNavItems}
            defaultActiveIndex={activeNavIndex}
            className="bg-transparent"
          />
        ) : (
          currentNavLinks.map((item) => (
            <NavbarButton
              key={item.key}
              as={Link}
              to={item.to}
              onClick={onItemClick}
              variant="secondary"
              className={cn("px-3 py-2 text-white")}
              onMouseEnterHandler={() => setHoveredKey(item.key)}
              isHoveredForAnimation={hoveredKey === item.key}
              animationLayoutId="desktop-unified-hover"
            >
              {item.label}
            </NavbarButton>
          ))
        )}
      </div>

      {/* Render Unified Action Buttons (right) */}
      <div className="flex items-center gap-x-1">
        {currentActions.map((item) => {
          if (item.type === 'component') {
            return <div key={item.key}>{item.label}</div>;
          }
          return (
            <NavbarButton
              key={item.key}
              as={item.type === 'link' ? Link : (item.type === 'themeToggle' ? 'button' : 'button')} // Handle different action types
              to={item.to}
              onClick={item.onClick}
              variant={item.variant || 'secondary'}
              className={cn("p-2", item.className)}
              aria-label={item.ariaLabel}
              onMouseEnterHandler={() => setHoveredKey(item.key)}
              isHoveredForAnimation={hoveredKey === item.key}
              animationLayoutId="desktop-unified-hover"
            >
              {item.label}
            </NavbarButton>
          );
        })}
      </div>
    </motion.div>
  );
};

// NavItems component is no longer needed as its functionality is merged into NavBody for desktop unified hover.
// If you still need it for other purposes, it can remain, but it won't be used for the main desktop nav links in Header.

export const MobileNav = ({
  children,
  className,
  visible
}) => {
  const [isHovering, setIsHovering] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      animate={{
        backdropFilter: (visible || isHovering) ? "blur(10px)" : "none",
        // boxShadow and background changes are still tied only to 'visible' (scroll)
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
          : "none",
        width: visible ? "90%" : "100%",
        paddingRight: visible ? "12px" : "0px",
        paddingLeft: visible ? "12px" : "0px",
        borderRadius: visible ? "9999px" : "0rem", // Make it pill shaped like NavBody when visible
        y: visible ? 20 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between bg-transparent px-0 py-2 lg:hidden",
        visible && "bg-white/90 dark:bg-neutral-900/90 border border-gray-200/20 dark:border-gray-700/20",
        className
      )}>
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className
}) => {
  return (
    <div
      className={cn("flex w-full flex-row items-center justify-between px-4", className)}> {/* Added px-4 for padding */}
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
  // onClose // Original prop, can be used if needed
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-[calc(100%-2rem)] mx-auto flex-col items-start justify-start gap-4 rounded-lg bg-white px-4 py-8 shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] dark:bg-neutral-950",
            className
          )}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick
}) => {
  return isOpen ? (
    <IconX className="h-6 w-6 text-black dark:text-white" onClick={onClick} />
  ) : (
    <IconMenu2 className="h-6 w-6 text-black dark:text-white" onClick={onClick} />
  );
};

// Modified NavbarLogo to use Link and accept props
export const NavbarLogo = ({ to, logoText, logoSrc, className }) => {
  return (
    <Link
      to={to || "/"}
      className={cn("relative z-20 flex items-center space-x-2 text-sm font-normal text-black dark:text-white", 
        className)}>
      {logoSrc && <img
        src={logoSrc}
        alt="logo"
        width={30}
        height={30} />}
      <span className="font-medium text-lg text-black dark:text-white">{logoText || "AppLogo"}</span>
    </Link>
  );
};

export const NavbarButton = ({
  href,
  to, // Added for react-router Link
  as: Tag = "button", // Default to button if not a link
  children,
  className,
  variant = "primary",
  onClick, // Added onClick
  onMouseEnterHandler, // New prop for group hover
  isHoveredForAnimation, // New prop
  animationLayoutId, // New prop
  ...props
}) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const baseStyles =
    "px-4 py-2 rounded-full text-sm font-bold relative cursor-pointer transition duration-200 inline-block text-center"; // Static hover removed

  const variantStyles = {
    primary:
      "bg-white text-black shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] dark:bg-neutral-800 dark:text-white",
    secondary: "bg-transparent shadow-none text-black dark:text-white",
    dark: "bg-black text-white shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]",
    gradient:
      "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]",
  };

  const textColorClass = variant === 'secondary' ? 'text-black dark:text-white' : '';

  const commonProps = {
    className: cn(baseStyles, variantStyles[variant], textColorClass, className),
    onClick,
    onMouseEnter: onMouseEnterHandler, // Use the new prop
    ...props,
  };

  const content = (
    <>
      {isHoveredForAnimation && animationLayoutId && (
        <motion.div
          layoutId={animationLayoutId}
          className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </>
  );

  if (Tag === "a" && href) {
    return <a href={href} {...commonProps}>{content}</a>;
  }
  if (Tag === Link && to) {
    return <Link to={to} {...commonProps}>{content}</Link>;
  }
  // Default to button or custom Tag
  return <Tag {...commonProps}>{content}</Tag>;
};


// Main Header Component
const Header = () => {
  const { currentUser, isAuthenticated, logoutUser } = useUser();
  const { currentOwner, isOwnerAuthenticated, logoutOwnerContext } = useOwner();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleUserLogout = async () => {
    const result = await logoutUser();
    setIsMobileMenuOpen(false);
    if (result.success) {
      navigate('/login');
    } else {
      console.error('User logout failed:', result.error);
    }
  };

  const handleOwnerLogout = async () => {
    const result = await logoutOwnerContext();
    setIsMobileMenuOpen(false);
    if (result.success) {
      navigate('/owner-login');
    } else {
      console.error('Owner logout failed:', result.error);
    }
  };

  let logoLink = "/";
  if (isOwnerAuthenticated) {
    logoLink = "/admin";
  } else if (isAuthenticated) {
    logoLink = "/";
  }

  const desktopNavLinks = [];
  const mobileNavLinks = []; // For mobile menu items

  if (isOwnerAuthenticated && currentOwner) {
    desktopNavLinks.push({ name: "Admin Panel", link: "/admin" });
    desktopNavLinks.push({ name: "Sales Analytics", link: "/admin/sales" }); // Added Sales Analytics for desktop
    desktopNavLinks.push({ name: "Create Product", link: "/create-product" });
    // mobileNavLinks.push({ name: `Owner: ${currentOwner.fullname || currentOwner.email}`, link: "#" });
    mobileNavLinks.push({ name: "Admin Panel", link: "/admin" });
    mobileNavLinks.push({ name: "Sales Analytics", link: "/admin/sales" }); // Added Sales Analytics link
    mobileNavLinks.push({ name: "Create Product", link: "/create-product" });
  } else if (isAuthenticated && currentUser) {
    desktopNavLinks.push({ name: "Shop", link: "/shop" });
    desktopNavLinks.push({ name: "Cart", link: "/cart" });
    desktopNavLinks.push({ name: "Profile", link: "/profile" });
    desktopNavLinks.push({ name: "Contact", link: "/contact" }); // Added Contact link for desktop
    // mobileNavLinks.push({ name: `Hi, ${currentUser.fullname || currentUser.email}!`, link: "#" });
    mobileNavLinks.push({ name: "Shop", link: "/shop" });
    mobileNavLinks.push({ name: "Cart", link: "/cart" });
    mobileNavLinks.push({ name: "Profile", link: "/profile" });
    mobileNavLinks.push({ name: "Contact", link: "/contact" }); // Added Contact link for mobile
  } else {
    // No specific nav links for logged-out users, buttons will handle login/register
  }


  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  // const [hoveredDesktopActionIndex, setHoveredDesktopActionIndex] = useState(null); // Moved to NavBody as hoveredKey
  const [hoveredMobileActionIndex, setHoveredMobileActionIndex] = useState(null); // Mobile remains separate

  // --- Unified Desktop Items ---
  const unifiedDesktopItems = [];
  let desktopItemKeyCounter = 0;

  // Nav Links for unified list
  desktopNavLinks.forEach(navLink => {
    unifiedDesktopItems.push({
      key: `nav-${desktopItemKeyCounter++}`,
      type: 'navLink',
      label: navLink.name,
      to: navLink.link,
      section: 'navLinks',
      // variant: 'secondary', // Handled by NavbarButton styling for links
      // className: "px-3 py-2 text-neutral-600 dark:text-neutral-300" // Handled in NavBody
    });
  });

  // Action Buttons for unified list
  if (isOwnerAuthenticated) {
    unifiedDesktopItems.push({ key: `action-${desktopItemKeyCounter++}`, type: 'button', label: 'Owner Logout', onClick: handleOwnerLogout, variant: 'secondary', section: 'actions' });
  } else if (isAuthenticated) {
    unifiedDesktopItems.push({ key: `action-${desktopItemKeyCounter++}`, type: 'component', label: <NotificationBell />, section: 'actions' });
    unifiedDesktopItems.push({ key: `action-${desktopItemKeyCounter++}`, type: 'button', label: 'Logout', onClick: handleUserLogout, variant: 'secondary', section: 'actions' });
  } else {
    unifiedDesktopItems.push({ key: `action-${desktopItemKeyCounter++}`, type: 'link', label: 'User Login', to: '/login', variant: 'secondary', section: 'actions' });
    unifiedDesktopItems.push({ key: `action-${desktopItemKeyCounter++}`, type: 'link', label: 'Owner Login', to: '/owner-login', variant: 'secondary', section: 'actions' });
    unifiedDesktopItems.push({ key: `action-${desktopItemKeyCounter++}`, type: 'link', label: 'Register', to: '/register', variant: 'secondary', section: 'actions' });
  }
  // Theme Toggle for unified list
  unifiedDesktopItems.push({
    key: `action-${desktopItemKeyCounter++}`,
    type: 'themeToggle',
    label: theme === 'light' ? <i className="ri-moon-fill text-xl text-gray-700 dark:text-yellow-400"></i> : <i className="ri-sun-fill text-xl text-yellow-400 dark:text-yellow-300"></i>,
    onClick: toggleTheme,
    ariaLabel: "Toggle theme",
    variant: 'secondary', // To match other buttons in the group
    className: "p-2", // Keep padding for icon
    section: 'actions'
  });

  const logoDesktopItem = { key: 'logo', type: 'logo', to: logoLink, logoText: 'Scatch' };

  // LimelightNav items based on authentication state
  const limelightNavItems = useMemo(() => {
    if (isOwnerAuthenticated) {
      return [
        { id: 'admin', icon: <span>Admin Panel</span>, label: 'Admin Panel', onClick: () => navigate('/admin') },
        { id: 'sales', icon: <span>Sales</span>, label: 'Sales', onClick: () => navigate('/admin/sales') },
        { id: 'create', icon: <span>Create Product</span>, label: 'Create Product', onClick: () => navigate('/create-product') },
      ];
    } else if (isAuthenticated) {
      return [
        { id: 'shop', icon: <span>Shop</span>, label: 'Shop', onClick: () => navigate('/shop') },
        { id: 'cart', icon: <span>Cart</span>, label: 'Cart', onClick: () => navigate('/cart') },
        { id: 'profile', icon: <span>Profile</span>, label: 'Profile', onClick: () => navigate('/profile') },
        { id: 'contact', icon: <span>Contact</span>, label: 'Contact', onClick: () => navigate('/contact') },
      ];
    }
    return [];
  }, [isOwnerAuthenticated, isAuthenticated, navigate]);

  // Get active index based on current path
  const activeNavIndex = useMemo(() => {
    const currentPath = location.pathname;
    
    if (isOwnerAuthenticated) {
      if (currentPath.includes('/admin/sales')) return 1;
      if (currentPath.includes('/create-product')) return 2;
      if (currentPath.includes('/admin')) return 0;
    } else if (isAuthenticated) {
      if (currentPath.includes('/cart')) return 1;
      if (currentPath.includes('/profile')) return 2;
      if (currentPath.includes('/contact')) return 3;
      if (currentPath.includes('/shop')) return 0;
    }
    return 0;
  }, [location.pathname, isOwnerAuthenticated, isAuthenticated]);


  const mobileActionItems = [];
   if (isOwnerAuthenticated) {
    mobileActionItems.push({ type: 'button', label: 'Owner Logout', onClick: handleOwnerLogout, variant: 'secondary', index: 0, className: "w-full" });
  } else if (isAuthenticated) {
    mobileActionItems.push({ type: 'button', label: 'Logout', onClick: handleUserLogout, variant: 'secondary', index: 0, className: "w-full" });
  } else {
    mobileActionItems.push({ type: 'link', label: 'User Login', to: '/login', onClick: closeMobileMenu, variant: 'secondary', index: 0, className: "w-full" });
    mobileActionItems.push({ type: 'link', label: 'Owner Login', to: '/owner-login', onClick: closeMobileMenu, variant: 'secondary', index: 1, className: "w-full" });
    mobileActionItems.push({ type: 'link', label: 'Register', to: '/register', onClick: closeMobileMenu, variant: 'secondary', index: 2, className: "w-full" }); // Changed to secondary
  }
  const themeToggleMobileIndex = mobileActionItems.length;
  mobileActionItems.push({
    type: 'themeToggleMobile',
    index: themeToggleMobileIndex,
    label: theme === 'light' ? <><i className="ri-moon-fill text-xl"></i> Toggle Theme</> : <><i className="ri-sun-fill text-xl"></i> Toggle Theme</>,
    onClick: () => { toggleTheme(); closeMobileMenu(); },
    className: "mt-4 p-2 w-full rounded-md transition-colors flex items-center justify-center gap-2 text-neutral-700 dark:text-neutral-300",
    ariaLabel: "Toggle theme"
  });


  return (
    <Navbar>
      <NavBody
        unifiedDesktopItems={unifiedDesktopItems}
        logoItem={logoDesktopItem}
        limelightNavItems={limelightNavItems}
        activeNavIndex={activeNavIndex}
        onItemClick={closeMobileMenu}
      >
        {/* Content is now rendered inside NavBody based on unifiedDesktopItems */}
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo to={logoLink} logoText="Scatch" className="text-white" />
          <MobileNavToggle isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        </MobileNavHeader>
        <MobileNavMenu isOpen={isMobileMenuOpen} onClose={closeMobileMenu}>
          {mobileNavLinks.map((item) => (
            <Link
              key={item.name}
              to={item.link}
              onClick={closeMobileMenu}
              className="block w-full px-4 py-2 text-lg text-neutral-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md text-center"
            >
              {item.name}
            </Link>
          ))}
          <motion.div
            className="mt-4 flex flex-col gap-2 w-full items-stretch px-4 relative"
            onMouseLeave={() => setHoveredMobileActionIndex(null)}
          >
            {mobileActionItems.map((item) => {
               if (item.type === 'themeToggleMobile') {
                // For mobile theme toggle, we use a regular button with internal motion for now
                // or convert it to NavbarButton if styling aligns
                return (
                  <button
                    key={item.index}
                    onClick={item.onClick}
                    aria-label={item.ariaLabel}
                    onMouseEnter={() => setHoveredMobileActionIndex(item.index)}
                    className={cn(item.className, "relative")} // Ensure relative for motion.div
                  >
                    {hoveredMobileActionIndex === item.index && (
                       <motion.div
                          layoutId="mobile-action-hover"
                          className="absolute inset-0 h-full w-full rounded-md bg-gray-100 dark:bg-neutral-800"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-2">{item.label}</span>
                  </button>
                );
              }
              return (
                <NavbarButton
                  key={item.index}
                  as={item.type === 'link' ? Link : 'button'}
                  to={item.to}
                  onClick={item.onClick}
                  variant={item.variant}
                  className={item.className}
                  onMouseEnterHandler={() => setHoveredMobileActionIndex(item.index)}
                  isHoveredForAnimation={hoveredMobileActionIndex === item.index}
                  animationLayoutId="mobile-action-hover"
                >
                  {item.label}
                </NavbarButton>
              );
            })}
          </motion.div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
};

export default Header;
