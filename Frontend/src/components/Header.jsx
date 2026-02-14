import logo from '../assets/logo2.png';

// ... (existing imports)

const Header = () => {
  // ... (existing code)

  {/* Logo Section */ }
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

  {/* Desktop Navigation */ }
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

  {/* Desktop Actions */ }
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

  {/* Mobile Menu Toggle */ }
  <button
    className="lg:hidden relative z-50 p-2 border-2 border-black bg-white shadow-neo active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
  >
    {isMobileMenuOpen ? <i className="ri-close-line text-2xl"></i> : <i className="ri-menu-4-line text-2xl"></i>}
  </button>
        </div >
      </header >

  {/* Mobile Menu Overlay */ }
  < AnimatePresence >
  { isMobileMenuOpen && (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-40 bg-white lg:hidden pt-24 px-6 pb-6 overflow-y-auto"
    >
      <div className="flex flex-col gap-6">

        {/* Mobile Nav Links */}
        <div className="flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.link}
              className="text-2xl font-black uppercase border-l-4 border-transparent hover:border-black pl-4 transition-all hover:bg-gray-50 py-2"
            >
              {link.name}
            </Link>
          ))}
          {!isAuthenticated && !isOwnerAuthenticated && (
            <>
              <Link to="/login" className="text-2xl font-black uppercase border-l-4 border-transparent hover:border-black pl-4 transition-all hover:bg-gray-50 py-2">Login</Link>
              <Link to="/register" className="text-2xl font-black uppercase border-l-4 border-transparent hover:border-black pl-4 transition-all hover:bg-gray-50 py-2">Register</Link>
              <Link to="/owner-login" className="text-lg font-bold uppercase border-l-4 border-transparent hover:border-black pl-4 transition-all hover:bg-gray-50 py-2 text-black">Owner Login</Link>
            </>
          )}
        </div>

        <div className="w-full h-1 bg-black opacity-10"></div>

        {/* Mobile Actions */}
        <div className="flex flex-col gap-4">

          {isAuthenticated && (
            <button
              onClick={handleUserLogout}
              className="w-full py-4 bg-black text-white font-black uppercase border-2 border-black shadow-neo active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              Logout
            </button>
          )}

          {isOwnerAuthenticated && (
            <button
              onClick={handleOwnerLogout}
              className="w-full py-4 bg-red-600 text-white font-black uppercase border-2 border-black shadow-neo active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              Owner Logout
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )}
      </AnimatePresence >

  {/* Spacer to prevent content from hiding behind fixed header */ }
  < div className = "h-20" ></div >
    </>
  );
};

export default Header;





