import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { usePasswords } from "../contexts/PasswordContext";
import PasswordForm from "../components/shared/PasswordForm";


import {
  FaKey,
  FaShieldAlt,
  FaExclamationTriangle,
  FaUserSlash,
} from "react-icons/fa";


const DashboardView = () => {
  const { user } = useUser();


  const { passwordArray, isLoading, addPassword, deletePassword } =
    usePasswords();


  const [category, setCategory] = useState("");
  const [showForm, setShowForm] = useState(false);


  // All your existing functions (unchanged)
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


  const handleAddPassword = async (newPassword) => {
    try {
      await addPassword(newPassword);
      setShowForm(false);
      console.log("✅ Password added via context");
    } catch (error) {
      console.error("❌ Failed to add password:", error);
      alert("Failed to save password. Please try again.");
    }
  };


  const handleDeletePassword = async (passwordId) => {
    if (window.confirm("Are you sure you want to delete this password?")) {
      try {
        await deletePassword(passwordId);
        console.log("✅ Password deleted via context");
      } catch (error) {
        console.error("❌ Failed to delete password:", error);
        alert("Failed to delete password. Please try again.");
      }
    }
  };


  const getPasswordStrength = (password) => {
    if (!password || password.length === 0) return "Weak";
    let score = 0;
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (!/(.)\1{2,}/.test(password)) score += 1;
    if (!/123|abc|qwe|password|admin/i.test(password)) score += 1;


    if (score >= 7) return "Very Strong";
    if (score >= 5) return "Strong";
    if (score >= 3) return "Moderate";
    return "Weak";
  };


  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log("Password copied to clipboard");
    } catch (err) {
      console.error("Failed to copy password:", err);
    }
  };


  const calculateStats = () => {
    const totalPasswords = passwordArray.length;
    const stats = {
      total: totalPasswords,
      strong: 0,
      moderate: 0,
      weak: 0,
      compromised: 0,
    };


    passwordArray.forEach((item) => {
      if (item.isCompromised) {
        stats.compromised++;
      } else {
        const strength = item.strength || getPasswordStrength(item.password);
        switch (strength) {
          case "Very Strong":
          case "Strong":
            stats.strong++;
            break;
          case "Moderate":
            stats.moderate++;
            break;
          case "Weak":
            stats.weak++;
            break;
        }
      }
    });


    return stats;
  };


  const stats = calculateStats();


  const calculateSecurityScore = () => {
    if (stats.total === 0)
      return {
        score: 0,
        rating: "No Data",
        color: "text-gray-400",
        strokeColor: "#9CA3AF",
      };


    const weightedScore =
      (stats.strong * 100 +
        stats.moderate * 60 +
        stats.weak * 20 +
        stats.compromised * 0) /
      stats.total;


    let finalScore = weightedScore;
    if (stats.compromised > 0) {
      finalScore = Math.max(
        10,
        finalScore - (stats.compromised / stats.total) * 50
      );
    }


    let rating, color, strokeColor;
    if (stats.compromised > 0) {
      rating = "At Risk";
      color = "text-red-400";
      strokeColor = "#EF4444";
    } else if (finalScore >= 90) {
      rating = "Excellent";
      color = "text-green-400";
      strokeColor = "#10B981";
    } else if (finalScore >= 75) {
      rating = "Good";
      color = "text-green-500";
      strokeColor = "#22C55E";
    } else if (finalScore >= 50) {
      rating = "Fair";
      color = "text-yellow-400";
      strokeColor = "#F59E0B";
    } else {
      rating = "Poor";
      color = "text-red-400";
      strokeColor = "#EF4444";
    }


    return {
      score: Math.round(finalScore),
      rating,
      color,
      strokeColor,
    };
  };


  const securityScore = calculateSecurityScore();


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Add Password Button */}
      <div className="relative">
        <button
          className="bg-green-600 absolute right-0 px-4 sm:px-6 py-2 rounded flex justify-between items-center w-32 sm:w-40 cursor-pointer text-white font-bold hover:bg-green-700 transition-colors z-10 text-sm sm:text-base"
          onClick={() => setShowForm(true)}
        >
          <span>{showForm ? "Close" : "Add"}</span>
          <lord-icon
            src="https://cdn.lordicon.com/efxgwrkc.json"
            trigger="hover"
            style={{ width: "25px", height: "25px" }}
            className="hidden sm:block"
          ></lord-icon>
          <span className="sm:hidden text-lg">+</span>
        </button>


        {showForm && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowForm(false)}
            ></div>
            <div className="fixed inset-0 flex items-center justify-center z-50 p-3 sm:p-4">
              <PasswordForm
                closeForm={() => setShowForm(false)}
                onSave={handleAddPassword}
              />
            </div>
          </>
        )}
      </div>


      {/* Dashboard Title */}
      <div className="pt-12 sm:pt-16">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-gray-900 mt-[-45px] sm:mt-[-55px]">
          Welcome back, {getUserDisplayName().split(" ")[0] || "User"}! 👋
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
          Here's your security overview for today.
        </p>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 md:p-5 bg-white rounded-lg sm:rounded-xl shadow border border-gray-200 hover:shadow-md transition-shadow">
          <div className="bg-blue-50 p-2 sm:p-3 rounded-full mb-2 sm:mb-0 sm:mr-3 md:mr-4">
            <FaKey className="text-blue-600 text-sm sm:text-base" />
          </div>
          <div>
            <div className="font-bold text-lg sm:text-xl text-gray-900">{stats.total}</div>
            <div className="text-gray-500 text-xs sm:text-sm">Total<span className="hidden sm:inline"> Passwords</span></div>
          </div>
        </div>


        <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 md:p-5 bg-white rounded-lg sm:rounded-xl shadow border border-gray-200 hover:shadow-md transition-shadow">
          <div className="bg-green-50 p-2 sm:p-3 rounded-full mb-2 sm:mb-0 sm:mr-3 md:mr-4">
            <FaShieldAlt className="text-green-600 text-sm sm:text-base" />
          </div>
          <div>
            <div className="font-bold text-lg sm:text-xl text-gray-900">
              {stats.strong}
            </div>
            <div className="text-gray-500 text-xs sm:text-sm">Strong<span className="hidden sm:inline"> Passwords</span></div>
            {stats.total > 0 && (
              <div className="text-xs text-green-600 font-medium">
                {Math.round((stats.strong / stats.total) * 100)}%
              </div>
            )}
          </div>
        </div>


        <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 md:p-5 bg-white rounded-lg sm:rounded-xl shadow border border-gray-200 hover:shadow-md transition-shadow">
          <div className="bg-yellow-50 p-2 sm:p-3 rounded-full mb-2 sm:mb-0 sm:mr-3 md:mr-4">
            <FaExclamationTriangle className="text-yellow-600 text-sm sm:text-base" />
          </div>
          <div>
            <div className="font-bold text-lg sm:text-xl text-gray-900">{stats.weak}</div>
            <div className="text-gray-500 text-xs sm:text-sm">Weak<span className="hidden sm:inline"> Passwords</span></div>
            {stats.total > 0 && (
              <div className="text-xs text-yellow-600 font-medium">
                {Math.round((stats.weak / stats.total) * 100)}%
              </div>
            )}
          </div>
        </div>


        <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 md:p-5 bg-white rounded-lg sm:rounded-xl shadow border border-gray-200 hover:shadow-md transition-shadow">
          <div className="bg-red-50 p-2 sm:p-3 rounded-full mb-2 sm:mb-0 sm:mr-3 md:mr-4">
            <FaUserSlash className="text-red-600 text-sm sm:text-base" />
          </div>
          <div>
            <div className="font-bold text-lg sm:text-xl text-gray-900">
              {stats.compromised}
            </div>
            <div className="text-gray-500 text-xs sm:text-sm">Compromised</div>
            {stats.total > 0 && (
              <div className="text-xs text-red-600 font-medium">
                {Math.round((stats.compromised / stats.total) * 100)}%
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Passwords */}
        <div className="lg:col-span-2 bg-white rounded-lg sm:rounded-xl shadow border border-gray-200 p-4 sm:p-5 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="font-semibold text-base sm:text-lg text-gray-900">
              Recent Passwords
            </h2>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded px-3 py-1.5 sm:py-1 text-xs sm:text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All categories</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Finance">Finance</option>
              <option value="Social">Social</option>
            </select>
          </div>


          {isLoading ? (
            <div className="text-center py-6 sm:py-8">
              <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border border-gray-300 rounded-full border-t-blue-600 mx-auto mb-2"></div>
              <div className="text-gray-400 text-sm sm:text-base">Loading passwords...</div>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {passwordArray
                  .filter((item) => !category || item.category === category)
                  .slice(0, 5)
                  .map((item, index) => {
                    const strength =
                      item.strength || getPasswordStrength(item.password);
                    const isCompromised = item.isCompromised;


                    const strengthColor = isCompromised
                      ? "text-red-400 font-bold"
                      : {
                          "Very Strong": "text-green-400",
                          Strong: "text-green-500",
                          Moderate: "text-yellow-400",
                          Weak: "text-red-400",
                        }[strength] || "text-gray-400";


                    return (
                      <div
                        key={item.id || index}
                        className="rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center px-3 sm:px-4 md:px-5 py-3 sm:py-4 border transition-colors bg-gray-50 border-gray-200 hover:bg-gray-100 gap-2 sm:gap-3"
                      >
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">
                            <a
                              href={item.websiteUrl || item.site || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-400 transition-colors truncate block"
                            >
                              {item.siteService ||
                                item.siteName ||
                                item.site ||
                                "Unknown Site"}
                            </a>
                          </div>
                          <div className="text-gray-500 text-xs sm:text-sm truncate">
                            {item.username}
                          </div>
                          {item.category && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.category}
                            </div>
                          )}
                        </div>


                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div
                            className={`flex items-center font-medium text-xs ${strengthColor} whitespace-nowrap`}
                          >
                            ● <span className="hidden sm:inline ml-1">{isCompromised ? "COMPROMISED" : strength}</span>
                            <span className="sm:hidden ml-1">{isCompromised ? "COMP" : strength.slice(0, 4)}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(item.password)}
                              className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                              title="Copy password"
                            >
                              📋
                            </button>
                            <button
                              onClick={() =>
                                handleDeletePassword(item.id || item._id)
                              }
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Delete password"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>


              {passwordArray.length === 0 && (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <div className="text-3xl sm:text-4xl mb-2">🔒</div>
                  <div className="font-medium text-sm sm:text-base">No passwords saved yet</div>
                  <div className="text-xs sm:text-sm">
                    Add your first password to get started
                  </div>
                </div>
              )}


              <a
                href="#"
                className="text-blue-400 text-xs sm:text-sm font-semibold hover:underline mt-3 block"
              >
                View all passwords ({passwordArray.length}) →
              </a>
            </>
          )}
        </div>


        {/* Security Score Widget */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow border border-gray-200 p-4 sm:p-5 md:p-6 flex flex-col items-center">
          <h2 className="font-semibold text-base sm:text-lg mb-2 text-gray-900">
            Security Score
          </h2>


          <div className="relative my-4 sm:my-5 flex items-center justify-center">
            <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="4"
              />
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke={securityScore.strokeColor}
                strokeWidth="4"
                strokeDasharray="107"
                strokeDashoffset={107 - (107 * securityScore.score) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute text-xl sm:text-2xl font-bold text-gray-800">
              {securityScore.score}
            </span>
          </div>


          <div className={`font-semibold mb-1 text-base sm:text-lg ${securityScore.color}`}>
            {securityScore.rating}
          </div>


          <div className="text-xs sm:text-sm text-center text-gray-500 mb-3 sm:mb-4">
            {securityScore.score === 0 ? (
              "Add passwords to see your security score."
            ) : stats.compromised > 0 ? (
              <>
                <span className="text-red-400 font-medium">
                  ⚠️ Action Required!
                </span>
                <br />
                You have compromised passwords that need immediate attention.
              </>
            ) : securityScore.score >= 90 ? (
              "Outstanding! Your password security is excellent."
            ) : securityScore.score >= 75 ? (
              "Great job! Your vault security is strong."
            ) : securityScore.score >= 50 ? (
              "Your vault security needs improvement."
            ) : (
              "Poor security detected. Please strengthen your passwords."
            )}
          </div>


          {stats.total > 0 && (
            <div className="w-full space-y-2 bg-gray-50 rounded-lg p-2 sm:p-3">
              <div className="text-xs font-medium text-gray-700 text-center mb-2">
                Password Breakdown
              </div>


              <div className="flex justify-between text-xs">
                <span className="flex items-center text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                  Strong: {stats.strong}
                </span>
                <span className="flex items-center text-yellow-400">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                  Moderate: {stats.moderate}
                </span>
              </div>


              <div className="flex justify-between text-xs">
                <span className="flex items-center text-red-400">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
                  Weak: {stats.weak}
                </span>
                {stats.compromised > 0 && (
                  <span className="flex items-center text-red-500 font-bold">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                    Comp: {stats.compromised}
                  </span>
                )}
              </div>


              <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-300">
                Total: {stats.total} password{stats.total !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Recent Activity */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow border border-gray-200 p-4 sm:p-5 md:p-6">
        <h2 className="font-semibold text-base sm:text-lg mb-3 text-gray-900">
          Recent Activity
        </h2>


        {passwordArray.length > 0 ? (
          <div className="space-y-2">
            {passwordArray.slice(0, 3).map((item, index) => {
              const strength =
                item.strength || getPasswordStrength(item.password);
              const isCompromised = item.isCompromised;


              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center text-gray-400 text-xs sm:text-sm py-2 border-b border-gray-200 last:border-b-0 gap-1 sm:gap-0"
                >
                  <span className="mr-2 sm:mr-3 text-blue-400">•</span>
                  <div className="flex-1">
                    Added new password for{" "}
                    <span className="font-medium text-gray-600">
                      {item.siteService}
                    </span>
                  </div>
                  <span
                    className={`ml-0 sm:ml-2 text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      isCompromised
                        ? "bg-red-100 text-red-700 font-bold"
                        : strength === "Strong" || strength === "Very Strong"
                        ? "bg-green-100 text-green-700"
                        : strength === "Moderate"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isCompromised ? "COMPROMISED" : strength}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center text-gray-400 text-xs sm:text-sm">
            <span className="mr-2">•</span>
            No recent activity. Add your first password to get started!
          </div>
        )}
      </div>
    </div>
  );
};


export default DashboardView;
