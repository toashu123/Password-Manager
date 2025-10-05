import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { usePasswords } from "../contexts/PasswordContext";
import { toast } from "react-toastify";


// ✅ Fixed imports - corrected paths based on your folder structure
import DashboardView from "./DashboardView";
import AllPasswordsView from "./AllPasswordsView";
import CategoriesView from "./CategoriesView";
import SecurityAuditView from "../components/SecurityAuditView";
import ImportExportView from "./ImportExportView";
import WeakPasswordsView from "./WeakPasswordsView";
import PasswordForm from "../components/shared/PasswordForm"; // ✅ Fixed path
import SettingsView from "./SettingsView";


import {
  FaKey,
  FaShieldAlt,
  FaExclamationTriangle,
  FaUserSlash,
} from "react-icons/fa";


const Dashboard = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();


  const {
    passwordArray,
    isLoading,
    addPassword: contextAddPassword,
    deletePassword: contextDeletePassword,
    loadPasswords,
  } = usePasswords();


  // Local state
  const [category, setCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState(""); // ✅ Added search state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false); // ✅ Mobile sidebar state


  // Set initial view based on route
  useEffect(() => {
    if (location.pathname === "/all-passwords") {
      setActiveView("passwords");
    } else {
      setActiveView("dashboard");
    }
  }, [location.pathname]);


  // Handle sidebar navigation
  const handleSidebarClick = (view) => {
    setActiveView(view);
    setShowMobileSidebar(false); // ✅ Close mobile sidebar on navigation
    // Update URL if needed
    if (view === "passwords") {
      navigate("/all-passwords");
    } else {
      navigate("/dashboard");
    }
  };


  // ✅ Fixed: Removed duplicate return and syntax error
  const renderMainContent = () => {
    switch (activeView) {
      case "passwords":
        return <AllPasswordsView searchQuery={searchQuery} />;
      case "categories":
        return <CategoriesView />;
      case "weak-passwords":
        return <WeakPasswordsView />;
      case "import-export":
        return <ImportExportView />;
      case "security-audit":
        return <SecurityAuditView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView onAddPassword={() => setShowForm(true)} />;
    }
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };


    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);


  // ✅ Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showMobileSidebar &&
        !event.target.closest(".mobile-sidebar") &&
        !event.target.closest(".mobile-menu-button")
      ) {
        setShowMobileSidebar(false);
      }
    };


    if (showMobileSidebar) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMobileSidebar]);


  // ✅ Enhanced password handling with better error handling
  const handleAddPassword = async (newPassword) => {
    try {
      await contextAddPassword(newPassword);
      setShowForm(false);
      toast.success("Password saved successfully!");
      console.log("✅ Password added via context");
    } catch (error) {
      console.error("❌ Failed to add password:", error);
      toast.error("Failed to save password. Please try again.");
    }
  };


  const handleDeletePassword = async (passwordId) => {
    if (window.confirm("Are you sure you want to delete this password?")) {
      try {
        await contextDeletePassword(passwordId);
        toast.success("Password deleted successfully!");
        console.log("✅ Password deleted via context");
      } catch (error) {
        console.error("❌ Failed to delete password:", error);
        toast.error("Failed to delete password. Please try again.");
      }
    }
  };


  // User helper functions
  const getUserDisplayName = () => {
    if (!user) return "User";
    return (
      user.fullName ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.username ||
      user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
      "User"
    );
  };


  const getUserProfileImage = () => {
    return user?.imageUrl || user?.profileImageUrl;
  };


  const handleSignOut = async () => {
    try {
      setShowUserMenu(false);
      toast.info("Signing out...");
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };


  // ✅ Added search handler
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };


  // ✅ Add password button handler
  const handleAddPasswordClick = () => {
    setShowForm(true);
    setShowMobileSidebar(false);
  };


  // Loading states
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border border-blue-600 rounded-full border-t-transparent mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }


  if (!isSignedIn) {
    return null;
  }


  // ✅ Navigation items array for easier maintenance
  const navItems = [
    { id: "dashboard", icon: "☰", label: "Dashboard" },
    { id: "passwords", icon: "🔐", label: "All Passwords" },
    { id: "categories", icon: "📂", label: "Categories" },
    { id: "weak-passwords", icon: "⚠️", label: "Weak Passwords" },
    { id: "import-export", icon: "💾", label: "Import/Export" },
    { id: "security-audit", icon: "📊", label: "Security Audit" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];


  // ✅ Sidebar component to avoid duplication
  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-4 sm:py-6">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-base sm:text-lg">🛡️</span>
        </div>
        <span className="font-bold text-lg sm:text-xl text-gray-900">SecureVault</span>
      </div>


      {/* Navigation */}
      <nav className="flex flex-col space-y-1 sm:space-y-2 mt-2 sm:mt-4 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`flex items-center w-full p-2.5 sm:p-3 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
              activeView === item.id
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => handleSidebarClick(item.id)}
          >
            <span className="mr-2 sm:mr-3 text-base sm:text-lg">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>


      {/* ✅ Add Password Button */}
      <div className="px-3 sm:px-4 mt-4 sm:mt-6">
        <button
          onClick={handleAddPasswordClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <span className="text-base sm:text-lg">➕</span>
          Add Password
        </button>
      </div>
    </>
  );


  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ✅ Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen bg-green-200 border-gray-300 flex-col justify-between sticky top-0 overflow-hidden">
        <div>
          <SidebarContent />
        </div>
      </aside>


      {/* ✅ Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowMobileSidebar(false)}
        ></div>
      )}


      {/* ✅ Mobile Sidebar */}
      <aside
        className={`mobile-sidebar fixed top-0 left-0 h-screen w-64 bg-green-200 border-r border-gray-300 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          showMobileSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Close button */}
          <div className="flex justify-end p-3">
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <SidebarContent isMobile={true} />
        </div>
      </aside>


      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-white sticky top-0 z-30">
          {/* ✅ Mobile Menu Button */}
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="mobile-menu-button lg:hidden text-gray-600 hover:text-gray-900 p-2 -ml-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>


          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>


          {/* User Menu */}
          <div className="relative user-menu-container">
            {/* User Profile Button */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="font-medium text-gray-900 hidden md:block text-sm">
                {getUserDisplayName()}
              </span>


              {/* Profile Image Container */}
              <div className="relative">
                {getUserProfileImage() ? (
                  <img
                    src={getUserProfileImage()}
                    alt={getUserDisplayName()}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-gray-200 hover:border-blue-300 transition-colors"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextElementSibling.style.display = "flex";
                    }}
                  />
                ) : null}


                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm ${
                    getUserProfileImage() ? "hidden" : "flex"
                  }`}
                >
                  {getUserDisplayName()
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>


                <div className="absolute -bottom-0 -right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 border-2 border-white rounded-full"></div>
              </div>


              <svg
                className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform duration-200 hidden sm:block ${
                  showUserMenu ? "rotate-180" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>


            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 sm:w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in duration-200">
                <div className="px-3 sm:px-4 py-2 border-b border-gray-100">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>


                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate("/");
                  }}
                  className="w-full text-left px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  <span className="truncate">Password Manager</span>
                </button>


                <button className="w-full text-left px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="truncate">Profile Settings</span>
                </button>


                <button 
                  onClick={() => {
                    setShowUserMenu(false);
                    handleSidebarClick("settings");
                  }}
                  className="w-full text-left px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span className="truncate">Security Settings</span>
                </button>


                <hr className="my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 sm:px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="truncate">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>


        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-green-50 to-green-100 min-h-screen">
          {renderMainContent()}
        </main>
      </div>


      {/* ✅ Password Form Modal */}
      {showForm && (
        <PasswordForm
          closeForm={() => setShowForm(false)}
          onSave={handleAddPassword}
          initialCategory={category}
        />
      )}
    </div>
  );
};


export default Dashboard;
