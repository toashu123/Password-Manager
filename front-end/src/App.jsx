import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  useSignIn,
} from "@clerk/clerk-react";
import { toast, ToastContainer } from "react-toastify";

// Updated Paths:
import { PasswordProvider } from "./contexts/PasswordContext";
import { setMasterPassword, clearMasterPassword } from "./utils/cryptoUtils";
import MFASetup from "./components/auth/MFASetup";
import MFALoginFlow from "./components/auth/MFALoginFlow";
import Navbar from "./components/shared/Navbar";
import Landing from "./views/Landing";
import Manager from "./views/Manager";
import Dashboard from "./views/Dashboard";
import AboutView from "./views/AboutView";
import ContactView from "./views/ContactView";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signIn } = useSignIn();
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showMFALogin, setShowMFALogin] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [setupTimeout, setSetupTimeout] = useState(null);

  // Check if user needs MFA verification during sign-in
  useEffect(() => {
    if (signIn && signIn.status === "needs_second_factor") {
      setShowMFALogin(true);
    } else {
      setShowMFALogin(false);
    }
  }, [signIn]);

  // Check if new user should set up MFA
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const hasSetupMFA = localStorage.getItem(`mfa_setup_${user.id}`);
      const hasSkippedMFA = localStorage.getItem(`mfa_skipped_${user.id}`);
      const pendingMFASetup = localStorage.getItem(
        `mfa_setup_pending_${user.id}`
      );

      if (pendingMFASetup) {
        localStorage.removeItem(`mfa_setup_pending_${user.id}`);
        setShowMFASetup(true);
        toast.info("You can now try setting up MFA with your fresh session!");
        return;
      }

      if (!user.twoFactorEnabled && !hasSetupMFA && !hasSkippedMFA) {
        setIsNewUser(true);
        const timeout = setTimeout(() => {
          setShowMFASetup(true);
          setSetupTimeout(null);
        }, 2000);
        setSetupTimeout(timeout);
      }
    }

    return () => {
      if (setupTimeout) {
        clearTimeout(setupTimeout);
        setSetupTimeout(null);
      }
    };
  }, [isLoaded, isSignedIn, user, setupTimeout]);

  // Handle master password on user authentication changes
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn && user?.id) {
        const masterPassword = `SecureVault-${user.id}-${
          user.primaryEmailAddress?.emailAddress || "user"
        }-2024`;

        try {
          setMasterPassword(masterPassword, user.id);
          console.log("✅ Master password set for user:", user.id);
        } catch (error) {
          console.error("❌ Failed to set master password:", error);
          toast.error(
            "Failed to initialize encryption. Please refresh and try again."
          );
        }
      } else {
        try {
          clearMasterPassword();
          console.log("🔓 Master password cleared - user signed out");
        } catch (error) {
          console.error("❌ Error clearing master password:", error);
        }
      }
    }
  }, [isSignedIn, user?.id, isLoaded]);

  useEffect(() => {
    return () => {
      if (setupTimeout) {
        clearTimeout(setupTimeout);
      }
    };
  }, [setupTimeout]);

  // MFA event handlers
  const handleMFASetupComplete = () => {
    if (user?.id) {
      localStorage.setItem(`mfa_setup_${user.id}`, "completed");
      localStorage.removeItem(`mfa_setup_pending_${user.id}`);
      localStorage.removeItem(`mfa_skipped_${user.id}`);
    }
    setShowMFASetup(false);
    setIsNewUser(false);
    toast.success("🔐 Your account is now protected with MFA!");
  };

  const handleMFASetupSkip = () => {
    if (user?.id) {
      localStorage.setItem(`mfa_skipped_${user.id}`, "skipped");
      localStorage.removeItem(`mfa_setup_${user.id}`);
      localStorage.removeItem(`mfa_setup_pending_${user.id}`);
    }
    setShowMFASetup(false);
    setIsNewUser(false);
    toast.info("You can set up MFA later in your profile settings.");
  };

  const handleMFALoginSuccess = () => {
    setShowMFALogin(false);
    toast.success("Welcome back! You're securely signed in.");
  };

  const handleMFALoginError = (error) => {
    console.error("MFA login error:", error);
    toast.error("MFA verification failed. Please try again.");
  };

  const handleDismissNewUser = () => {
    setIsNewUser(false);
    if (setupTimeout) {
      clearTimeout(setupTimeout);
      setSetupTimeout(null);
    }
  };

  // Show MFA login screen if needed
  if (showMFALogin && signIn?.status === "needs_second_factor") {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
          <MFALoginFlow
            onSuccess={handleMFALoginSuccess}
            onError={handleMFALoginError}
          />
        </div>
        <ToastContainer />
      </>
    );
  }

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 sm:h-12 sm:w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            Loading SecureVault...
          </p>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            Initializing secure session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isDashboard && <Navbar />}

      <Routes>
        {/* Home route - Main page with conditional rendering */}
        <Route
          path="/"
          element={
            <>
              <SignedOut>
                <Landing />
              </SignedOut>
              <SignedIn>
                <PasswordProvider>
                  <Manager />
                </PasswordProvider>
              </SignedIn>
            </>
          }
        />

        {/* Landing page accessible regardless of auth status */}
        <Route path="/landing" element={<Landing />} />

        {/* About page - public */}
        <Route path="/about" element={<AboutView />} />

        {/* Contact page - public */}
        <Route path="/contact" element={<ContactView />} />

        {/* Dashboard - protected route */}
        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <PasswordProvider>
                  <Dashboard />
                </PasswordProvider>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        {/* All Passwords route - same as Dashboard but different initial view */}
        <Route
          path="/all-passwords"
          element={
            <>
              <SignedIn>
                <PasswordProvider>
                  <Dashboard />
                </PasswordProvider>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        {/* Weak Passwords route - protected */}
        <Route
          path="/weak-passwords"
          element={
            <>
              <SignedIn>
                <PasswordProvider>
                  <Dashboard />
                </PasswordProvider>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        {/* Categories route - protected */}
        <Route
          path="/categories"
          element={
            <>
              <SignedIn>
                <PasswordProvider>
                  <Dashboard />
                </PasswordProvider>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        {/* Settings route - protected */}
        <Route
          path="/settings"
          element={
            <>
              <SignedIn>
                <PasswordProvider>
                  <Dashboard />
                </PasswordProvider>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* MFA Setup Modal for new users */}
      {showMFASetup && (
        <MFASetup
          onComplete={handleMFASetupComplete}
          showSetup={showMFASetup}
        />
      )}

      {/* New user welcome with MFA prompt */}
      {isNewUser && !showMFASetup && (
        <div className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 left-3 sm:left-auto bg-blue-600 text-white p-3 sm:p-4 rounded-lg shadow-lg max-w-sm z-50 animate-slide-up">
          <div className="flex items-start gap-2 sm:gap-3">
            <span
              className="text-xl sm:text-2xl flex-shrink-0"
              role="img"
              aria-label="Security"
            >
              🔐
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold mb-1 text-sm sm:text-base">
                Secure Your Account
              </h4>
              <p className="text-xs sm:text-sm text-blue-100 mb-2 sm:mb-3">
                Enable Multi-Factor Authentication for enhanced security
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowMFASetup(true)}
                  className="bg-white text-blue-600 px-3 py-1.5 sm:py-1 rounded text-xs sm:text-sm font-medium hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  Set Up MFA
                </button>
                <button
                  onClick={handleMFASetupSkip}
                  className="text-blue-200 hover:text-white text-xs sm:text-sm underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-1 text-center"
                >
                  Skip for now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismissNewUser}
              className="text-blue-200 hover:text-white text-xl sm:text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded px-1 flex-shrink-0"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={true}
        pauseOnHover={true}
        theme="light"
        limit={3}
        style={{ zIndex: 9999 }}
      />
    </>
  );
}

export default App;
