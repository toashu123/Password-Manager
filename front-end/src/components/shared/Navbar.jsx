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
      toast.info("Loading user data...");
      return;
    }

    setIsNavigating(true);

    try {
      if (isSignedIn) {
        if (location.pathname === "/") {
          toast.info("You are already on the manager page");
        } else {
          navigate("/");
        }
        setMobileMenuOpen(false);
      } else {
        await clerk.redirectToSignIn({
          fallbackRedirectUrl: "/",
        });
      }
    } catch (error) {
      console.error("Navigation failed:", error);
      toast.error("Failed to navigate. Please try again.");
    } finally {
      setIsNavigating(false);
    }
  }, [isLoaded, isSignedIn, navigate, clerk, location.pathname]);

  const handleLoginClick = useCallback(async () => {
    try {
      setIsNavigating(true);
      await clerk.redirectToSignIn();
    } catch (error) {
      console.error("Login redirect failed:", error);
      toast.error("Failed to redirect to login");
      setIsNavigating(false);
    }
  }, [clerk]);

  const handleLogoutClick = useCallback(async () => {
    try {
      setIsNavigating(true);
      await clerk.signOut();
      navigate("/landing");
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout. Please try again.");
    } finally {
      setIsNavigating(false);
    }
  }, [clerk, navigate]);

  const handleProfileClick = useCallback(() => {
    navigate("/dashboard");
    setShowDropdown(false);
    setMobileMenuOpen(false);
  }, [navigate]);

  const handleNavigation = useCallback(
    (path) => {
      if (location.pathname === path) {
        toast.info(
          `You are already on the ${
            path === "/landing" ? "home" : path.replace("/", "")
          } page`
        );
        return;
      }

      navigate(path);
      setMobileMenuOpen(false);
      setShowDropdown(false);
    },
    [navigate, location.pathname]
  );

  const handleMFASetupOpen = useCallback(() => {
    if (!user) {
      toast.error("User not authenticated");
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
      console.error("Failed to refresh user data:", error);
    }
  }, [user]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === "Escape") {
      setShowDropdown(false);
      setMobileMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
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
            onClick={() => handleNavigation("/landing")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleNavigation("/landing")}
            aria-label="PassOP Home"
          >
            <span className="text-green-500">&lt;</span>Pass
            <span className="text-green-500">OP/&gt;</span>
          </div>

          {/* Hamburger menu button (mobile) */}
          <div ref={mobileMenuRef}>
            <button
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

            {/* Mobile Dropdown Menu - keep it inside the same ref */}
            {mobileMenuOpen && (
              <div className="absolute right-0 left-0 top-full md:hidden px-4 pb-4 space-y-3 border-t border-slate-700 bg-slate-800">
                <button
                  className="block hover:text-green-500 hover:font-bold cursor-pointer py-2 transition-all duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2"
                  onClick={() => handleNavigation("/landing")}
                >
                  Home
                </button>
                <button
                  className="block hover:text-green-500 hover:font-bold cursor-pointer py-2 transition-all duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2"
                  onClick={() => handleNavigation("/about")}
                >
                  About
                </button>
                <button
                  className="block hover:text-green-500 hover:font-bold cursor-pointer py-2 transition-all duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2"
                  onClick={() => handleNavigation("/contact")}
                >
                  Contact
                </button>

                {/* Mobile Manager Button */}
                <button
                  className={`block hover:text-green-500 hover:font-bold cursor-pointer py-2 transition-all duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 ${
                    !isLoaded || isNavigating
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  onClick={handleManagerClick}
                  disabled={!isLoaded || isNavigating}
                >
                  {isNavigating
                    ? "Loading..."
                    : !isLoaded
                    ? "Loading..."
                    : isSignedIn
                    ? "Manager"
                    : "Manager (Sign In Required)"}
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
                        <span>{isNavigating ? "Loading..." : "Login"}</span>
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
                        src={user?.imageUrl || "/icons/person.png"}
                        alt={`${user?.firstName || "User"} profile`}
                      />
                      <div>
                        <span className="font-medium block">
                          {user?.firstName || "User"}
                        </span>
                        <span className="text-xs text-gray-400">
                          Go to Dashboard
                        </span>
                      </div>
                    </button>

                    {/* Mobile MFA Setup Button */}
                    <button
                      onClick={handleMFASetupOpen}
                      className="flex items-center gap-2 cursor-pointer py-2 hover:text-green-500 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                    >
                      <span className="text-lg" aria-hidden="true">
                        🔐
                      </span>
                      <span>
                        {user?.twoFactorEnabled ? "Manage MFA" : "Setup MFA"}
                      </span>
                    </button>

                    <button
                      onClick={handleLogoutClick}
                      disabled={isNavigating}
                      className="block text-red-400 hover:text-red-300 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded disabled:opacity-50"
                    >
                      {isNavigating ? "Logging out..." : "Logout"}
                    </button>
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
              onClick={() => handleNavigation("/landing")}
            >
              Home
            </button>
            {/* ✅ FIXED: Mobile About link */}
            <button
              className="block hover:text-green-500 hover:font-bold cursor-pointer py-2 transition-all duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2"
              onClick={() => handleNavigation("/about")}
            >
              About
            </button>
            {/* ✅ FIXED: Mobile Contact link */}
            <button
              className="block hover:text-green-500 hover:font-bold cursor-pointer py-2 transition-all duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2"
              onClick={() => handleNavigation("/contact")}
            >
              Contact
            </button>

            {/* Mobile Manager Button */}
            <button
              className={`block hover:text-green-500 hover:font-bold cursor-pointer py-2 transition-all duration-200 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 ${
                !isLoaded || isNavigating ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleManagerClick}
              disabled={!isLoaded || isNavigating}
            >
              {isNavigating
                ? "Loading..."
                : !isLoaded
                ? "Loading..."
                : isSignedIn
                ? "Manager"
                : "Manager (Sign In Required)"}
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
                    <span>{isNavigating ? "Loading..." : "Login"}</span>
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
                    src={user?.imageUrl || "/icons/person.png"}
                    alt={`${user?.firstName || "User"} profile`}
                  />
                  <div>
                    <span className="font-medium block">
                      {user?.firstName || "User"}
                    </span>
                    <span className="text-xs text-gray-400">
                      Go to Dashboard
                    </span>
                  </div>
                </button>

                {/* Mobile MFA Setup Button */}
                <button
                  onClick={handleMFASetupOpen}
                  className="flex items-center gap-2 cursor-pointer py-2 hover:text-green-500 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                >
                  <span className="text-lg" aria-hidden="true">
                    🔐
                  </span>
                  <span>
                    {user?.twoFactorEnabled ? "Manage MFA" : "Setup MFA"}
                  </span>
                </button>

                <button
                  onClick={handleLogoutClick}
                  disabled={isNavigating}
                  className="block text-red-400 hover:text-red-300 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded disabled:opacity-50"
                >
                  {isNavigating ? "Logging out..." : "Logout"}
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
