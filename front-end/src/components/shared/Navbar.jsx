import React, { useState, useRef, useEffect, useCallback } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import { SignInButton } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import MFASetup from "../auth/MFASetup";

const Navbar = () => {
  const clerk = useClerk();
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const handleManagerClick = useCallback(async () => {
    if (!isLoaded) {
      toast.info('Loading user data...');
      return;
    }

    setIsNavigating(true);
    
    try {
      if (isSignedIn) {
        if (location.pathname === '/') {
          toast.info('You are already on the manager page');
        } else {
          navigate('/');
        }
        setMobileMenuOpen(false);
      } else {
        await clerk.redirectToSignIn({
          fallbackRedirectUrl: '/',
        });
      }
    } catch (error) {
      console.error('Navigation failed:', error);
      toast.error('Failed to navigate. Please try again.');
    } finally {
      setIsNavigating(false);
    }
  }, [isLoaded, isSignedIn, navigate, clerk, location.pathname]);

  const handleLoginClick = useCallback(async () => {
    try {
      setIsNavigating(true);
      await clerk.redirectToSignIn();
    } catch (error) {
      console.error('Login redirect failed:', error);
      toast.error('Failed to redirect to login');
      setIsNavigating(false);
    }
  }, [clerk]);

  const handleLogoutClick = useCallback(async () => {
    try {
      setIsNavigating(true);
      await clerk.signOut();
      navigate('/landing');
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout. Please try again.');
    } finally {
      setIsNavigating(false);
    }
  }, [clerk, navigate]);

  const handleProfileClick = useCallback(() => {
    navigate("/dashboard");
    setShowDropdown(false);
    setMobileMenuOpen(false);
  }, [navigate]);

  const handleNavigation = useCallback((path) => {
    if (location.pathname === path) {
      toast.info(`You are already on the ${path === '/landing' ? 'home' : path.replace('/', '')} page`);
      return;
    }
    
    navigate(path);
    setMobileMenuOpen(false);
    setShowDropdown(false);
  }, [navigate, location.pathname]);

  const handleMFASetupOpen = useCallback(() => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    
    setShowMFASetup(true);
    setShowDropdown(false);
    setMobileMenuOpen(false);
  }, [user]);

  const handleMFASetupComplete = useCallback(async () => {
    setShowMFASetup(false);
    
    try {
      if (user) {
        await user.reload();
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [user]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      setShowDropdown(false);
      setMobileMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen, handleKeyDown]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
        setShowDropdown(false);
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      setShowMFASetup(false);
      setShowDropdown(false);
      setMobileMenuOpen(false);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowDropdown(false);
  }, [location.pathname]);

  return (
    <>
      <nav className="bg-slate-800 text-white shadow-lg relative z-40">
        <div className="flex justify-between items-center px-4 py-4">
          {/* Logo */}
          <div 
            className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleNavigation('/landing')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigation('/landing')}
            aria-label="PassOP Home"
          >
            <span className="text-green-500">&lt;</span>Pass
            <span className="text-green-500">OP/&gt;</span>
          </div>

          {/* Hamburger menu button (mobile) */}
          <button
            ref={mobileMenuRef}
            className="md:hidden text-white focus:outline-none hover:bg-slate-700 p-2 rounded transition-colors focus:ring-2 focus:ring-green-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <button 
              className="hover:text-green-500 hover:font-bold cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1" 
              onClick={() => handleNavigation('/landing')}
            >
              Home
            </button>
            {/* ✅ FIXED: Changed from hash link to proper route */}
            <button 
              className="hover:text-green-500 hover:font-bold cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1" 
              onClick={() => handleNavigation('/about')}
            >
              About
            </button>
            {/* ✅ FIXED: Changed from hash link to proper route */}
            <button 
              className="hover:text-green-500 hover:font-bold cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1" 
              onClick={() => handleNavigation('/contact')}
            >
              Contact
            </button>
            
            {/* Smart Manager Button */}
            <button 
              className={`hover:text-green-500 hover:font-bold cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1 ${
                !isLoaded || isNavigating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleManagerClick}
              disabled={!isLoaded || isNavigating}
            >
              {isNavigating ? 'Loading...' : 
               !isLoaded ? 'Loading...' : 
               isSignedIn ? 'Manager' : 'Manager (Sign In)'}
            </button>

            {/* Authentication Section */}
            {!isSignedIn ? (
              <div className="flex items-center space-x-4">
                <SignInButton fallbackRedirectUrl="/">
                  <button 
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 px-3 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={isNavigating}
                  >
                    <img 
                      className="w-8 h-8 rounded-full opacity-80" 
                      src="/icons/person.png" 
                      alt="Login icon" 
                    />
                    <span>{isNavigating ? 'Loading...' : 'Login'}</span>
                  </button>
                </SignInButton>
              </div>
            ) : (
              <div
                ref={dropdownRef}
                className="relative"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <button 
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 px-3 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500" 
                  onClick={handleProfileClick}
                  aria-expanded={showDropdown}
                  aria-haspopup="true"
                >
                  <img 
                    className="w-8 h-8 rounded-full border-2 border-green-500" 
                    src={user?.imageUrl || '/icons/person.png'} 
                    alt={`${user?.firstName || 'User'} profile`}
                  />
                  <span className="font-medium">{user?.firstName || "User"}</span>
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Desktop Dropdown */}
                {showDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg z-50 border border-gray-200"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="font-medium text-gray-900">{user?.fullName || user?.firstName || "User"}</p>
                        <p className="text-sm text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
                      </div>
                      
                      <button 
                        onClick={handleProfileClick}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center space-x-2 focus:outline-none focus:bg-gray-100"
                        role="menuitem"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 002 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Dashboard</span>
                      </button>
                      
                      <button 
                        onClick={() => handleNavigation('/')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center space-x-2 focus:outline-none focus:bg-gray-100"
                        role="menuitem"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>Manager</span>
                      </button>

                      {/* MFA Setup Button in Dropdown */}
                      <button
                        onClick={handleMFASetupOpen}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center space-x-2 focus:outline-none focus:bg-gray-100"
                        role="menuitem"
                      >
                        <span className="text-lg" aria-hidden="true">🔐</span>
                        <span>{user?.twoFactorEnabled ? 'Manage MFA' : 'Setup MFA'}</span>
                      </button>
                      
                      <hr className="my-2" />
                      
                      <button 
                        onClick={handleLogoutClick}
                        disabled={isNavigating}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors flex items-center space-x-2 focus:outline-none focus:bg-red-50 disabled:opacity-50"
                        role="menuitem"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>{isNavigating ? 'Logging out...' : 'Logout'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-3 border-t border-slate-700 bg-slate-800">
            <button 
              className="block hover:text-green-500 hover:font-bold cursor-pointer py-2 transition-all duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2" 
              onClick={() => handleNavigation('/landing')}
            >
              Home
            </button>
            {/* ✅ FIXED: Mobile About link */}
            <button 
              className="block hover:text-green-500 hover:font-bold cursor-pointer py-2 transition-all duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2" 
              onClick={() => handleNavigation('/about')}
            >
              About
            </button>
            {/* ✅ FIXED: Mobile Contact link */}
            <button 
              className="block hover:text-green-500 hover:font-bold cursor-pointer py-2 transition-all duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2" 
              onClick={() => handleNavigation('/contact')}
            >
              Contact
            </button>
            
            {/* Mobile Manager Button */}
            <button 
              className={`block hover:text-green-500 hover:font-bold cursor-pointer py-2 transition-all duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 ${
                !isLoaded || isNavigating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={handleManagerClick}
              disabled={!isLoaded || isNavigating}
            >
              {isNavigating ? 'Loading...' :
               !isLoaded ? 'Loading...' : 
               isSignedIn ? 'Manager' : 'Manager (Sign In Required)'}
            </button>

            {/* Mobile Authentication */}
            {!isSignedIn ? (
              <div className="pt-2 border-t border-slate-700">
                <SignInButton fallbackRedirectUrl="/">
                  <button 
                    className="flex items-center gap-2 cursor-pointer py-2 hover:text-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                    disabled={isNavigating}
                  >
                    <img 
                      className="w-8 h-8 rounded-full opacity-80" 
                      src="/icons/person.png" 
                      alt="Login icon" 
                    />
                    <span>{isNavigating ? 'Loading...' : 'Login'}</span>
                  </button>
                </SignInButton>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-700 space-y-2">
                <button
                  onClick={handleProfileClick} 
                  className="flex items-center gap-2 cursor-pointer py-2 hover:text-green-500 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                >
                  <img 
                    className="w-8 h-8 rounded-full border-2 border-green-500" 
                    src={user?.imageUrl || '/icons/person.png'} 
                    alt={`${user?.firstName || 'User'} profile`}
                  />
                  <div>
                    <span className="font-medium block">{user?.firstName || "User"}</span>
                    <span className="text-xs text-gray-400">Go to Dashboard</span>
                  </div>
                </button>

                {/* Mobile MFA Setup Button */}
                <button
                  onClick={handleMFASetupOpen}
                  className="flex items-center gap-2 cursor-pointer py-2 hover:text-green-500 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                >
                  <span className="text-lg" aria-hidden="true">🔐</span>
                  <span>{user?.twoFactorEnabled ? 'Manage MFA' : 'Setup MFA'}</span>
                </button>
                
                <button 
                  onClick={handleLogoutClick}
                  disabled={isNavigating}
                  className="block text-red-400 hover:text-red-300 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded disabled:opacity-50"
                >
                  {isNavigating ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* MFA Setup Modal */}
      {showMFASetup && (
        <MFASetup 
          onComplete={handleMFASetupComplete}
          showSetup={showMFASetup}
        />
      )}
    </>
  );
};

export default Navbar;
