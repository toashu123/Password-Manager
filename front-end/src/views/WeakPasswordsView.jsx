import React, { useState, useEffect } from "react";
import { usePasswords } from "../contexts/PasswordContext";
import { FaCopy, FaEdit, FaTrash, FaEye, FaEyeSlash, FaShieldAlt, FaBolt, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const WeakPasswordsView = () => {
  const { passwordArray, deletePassword, updatePassword, isLoading } = usePasswords();
  const [copiedId, setCopiedId] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [editingPassword, setEditingPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [sortBy, setSortBy] = useState("strength");
  const [filterBy, setFilterBy] = useState("all");


  // ✅ FIXED: Comprehensive password analysis that matches PasswordForm
  const analyzePassword = (password) => {
    if (!password || typeof password !== 'string' || password.length === 0) {
      return { strength: "Very Weak", score: 0, issues: ["Password is empty"], isWeak: true };
    }
    
    let score = 0;
    let issues = [];
    
    // Common weak passwords list (same as PasswordForm)
    const commonWeakPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
      'qwerty123', 'welcome123', 'admin123', 'root', 'toor', 'pass',
      'test', 'guest', 'user', 'login', '000000', '111111', '123123',
      'sunshine', 'master', 'hello', 'freedom', 'whatever', 'qazwsx',
      'trustno1', 'dragon', 'jesus', 'michael', 'mustang', 'charlie'
    ];
    
    // Length scoring (same as PasswordForm)
    if (password.length >= 16) score += 3;
    else if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    else issues.push("Too short (use 12+ characters)");
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else issues.push("Missing lowercase letters");
    
    if (/[A-Z]/.test(password)) score += 1;
    else issues.push("Missing uppercase letters");
    
    if (/[0-9]/.test(password)) score += 1;
    else issues.push("Missing numbers");
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else issues.push("Missing special characters");
    
    // Pattern checks
    if (/(.)\1{2,}/.test(password)) {
      issues.push("Contains repeating characters");
    } else score += 1;
    
    if (/123|abc|qwe|password|admin|welcome|letmein/i.test(password)) {
      issues.push("Contains common patterns");
    } else score += 1;
    
    // Check against common weak passwords
    const isCommonPassword = commonWeakPasswords.some(weak => {
      if (!weak || !password) return false;
      try {
        return password.toLowerCase().includes(weak.toLowerCase()) || 
               weak.toLowerCase().includes(password.toLowerCase());
      } catch (error) {
        return false;
      }
    });
    
    if (isCommonPassword) {
      issues.push("This is a commonly used password");
    } else score += 1;
    
    // Check for personal information patterns
    const hasPersonalInfo = /(password|admin|user|login|welcome|test|guest|demo)/i.test(password);
    if (hasPersonalInfo) {
      issues.push("Contains common words");
    }
    
    // Determine strength based on score (same logic as PasswordForm)
    let strength;
    let isWeak = false;
    
    if (score >= 7) {
      strength = "Very Strong";
      isWeak = false;
    } else if (score >= 5) {
      strength = "Strong";
      isWeak = false;
    } else if (score >= 3) {
      strength = "Moderate";
      isWeak = true; // ✅ FIXED: Consider moderate as weak for improvement
    } else if (score >= 1) {
      strength = "Weak";
      isWeak = true;
    } else {
      strength = "Very Weak";
      isWeak = true;
    }
    
    // Additional weak conditions
    if (password.length < 8 || /(.)\1{2,}/.test(password) || isCommonPassword || hasPersonalInfo) {
      isWeak = true;
    }
    
    return { 
      strength, 
      score: Math.min(score * 12.5, 100), 
      issues: issues.slice(0, 4), 
      isWeak 
    };
  };


  // ✅ FIXED: Filter to show passwords that actually need improvement
  const getFilteredPasswords = () => {
    console.log("🔍 Analyzing passwords:", passwordArray.length);
    
    let filtered = passwordArray.filter(item => {
      if (!item || !item.password || typeof item.password !== 'string') {
        console.warn('Invalid password item:', item);
        return false;
      }
      
      try {
        const analysis = analyzePassword(item.password);
        console.log(`Password for ${item.siteService}:`, {
          password: item.password.substring(0, 3) + "***",
          strength: analysis.strength,
          isWeak: analysis.isWeak,
          score: analysis.score,
          issues: analysis.issues
        });
        
        switch (filterBy) {
          case "very-weak":
            return analysis.strength === "Very Weak";
          case "weak":
            return analysis.strength === "Weak";
          case "moderate":
            return analysis.strength === "Moderate";
          case "all":
          default:
            // ✅ FIXED: Show all passwords that need improvement
            return analysis.isWeak || 
                   analysis.strength === "Very Weak" || 
                   analysis.strength === "Weak" || 
                   analysis.strength === "Moderate" ||
                   analysis.score < 75; // Any password with score below 75%
        }
      } catch (error) {
        console.error('Error analyzing password:', error);
        return false;
      }
    });


    console.log("🔍 Filtered passwords needing improvement:", filtered.length);


    return filtered.sort((a, b) => {
      try {
        switch (sortBy) {
          case "name":
            return (a.siteService || "").localeCompare(b.siteService || "");
          case "date":
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          case "strength":
          default:
            const scoreA = analyzePassword(a.password || "").score;
            const scoreB = analyzePassword(b.password || "").score;
            return scoreA - scoreB;
        }
      } catch (error) {
        console.error('Error sorting passwords:', error);
        return 0;
      }
    });
  };


  const weakPasswords = getFilteredPasswords();


  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied!", { autoClose: 1500, theme: "dark" });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Copy failed!");
    }
  };


  const getSiteFavicon = (url) => {
    if (!url) return null;
    try {
      const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };


  const generateStrongPassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    let password = "";
    // Ensure at least one from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    const allChars = lowercase + uppercase + numbers + specialChars;
    for (let i = 4; i < 14; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };


  const handleGenerateAndCopy = () => {
    const strongPassword = generateStrongPassword();
    copyToClipboard(strongPassword, 'generated');
  };


  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };


  const startEditing = (password) => {
    setEditingPassword(password.id);
    setNewPassword(password.password);
  };


  const cancelEditing = () => {
    setEditingPassword(null);
    setNewPassword("");
  };


  // ✅ FIXED: Proper password update function
  const saveNewPassword = async (passwordId) => {
    if (!newPassword.trim()) {
      toast.error("Password cannot be empty!");
      return;
    }


    try {
      console.log("🔄 Updating password:", passwordId);
      
      // Call updatePassword from context
      await updatePassword(passwordId, { 
        password: newPassword,
        updatedAt: new Date().toISOString()
      });
      
      setEditingPassword(null);
      setNewPassword("");
      toast.success("Password updated successfully!");
      
      console.log("✅ Password update completed");
    } catch (error) {
      console.error("❌ Update failed:", error);
      toast.error(`Update failed: ${error.message}`);
    }
  };


  const handleDeletePassword = async (passwordId, siteName) => {
    if (window.confirm(`Delete password for ${siteName}?`)) {
      try {
        await deletePassword(passwordId);
        toast.success("Password deleted!");
      } catch (error) {
        toast.error("Delete failed!");
      }
    }
  };


  const getStrengthColor = (strength) => {
    switch (strength) {
      case "Very Strong": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "Strong": return "text-green-600 bg-green-50 border-green-200";
      case "Moderate": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Weak": return "text-orange-600 bg-orange-50 border-orange-200";
      case "Very Weak": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };


  const getStrengthIcon = (strength) => {
    switch (strength) {
      case "Very Strong": return "🛡️";
      case "Strong": return "✅";
      case "Moderate": return "⚠️";
      case "Weak": return "❌";
      case "Very Weak": return "🚨";
      default: return "❓";
    }
  };


  // Calculate statistics with proper analysis
  const calculateStats = () => {
    try {
      const validPasswords = passwordArray.filter(p => p && p.password && typeof p.password === 'string');
      
      const stats = {
        total: passwordArray.length,
        validTotal: validPasswords.length,
        veryWeak: 0,
        weak: 0,
        moderate: 0,
        strong: 0,
        veryStrong: 0,
        needsAttention: 0
      };
      
      validPasswords.forEach(p => {
        const analysis = analyzePassword(p.password);
        switch (analysis.strength) {
          case "Very Weak":
            stats.veryWeak++;
            stats.needsAttention++;
            break;
          case "Weak":
            stats.weak++;
            stats.needsAttention++;
            break;
          case "Moderate":
            stats.moderate++;
            stats.needsAttention++;
            break;
          case "Strong":
            stats.strong++;
            break;
          case "Very Strong":
            stats.veryStrong++;
            break;
        }
      });
      
      console.log("📊 Password stats:", stats);
      return stats;
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        total: passwordArray.length,
        validTotal: 0,
        veryWeak: 0,
        weak: 0,
        moderate: 0,
        strong: 0,
        veryStrong: 0,
        needsAttention: 0
      };
    }
  };


  const stats = calculateStats();


  // Debug logging
  useEffect(() => {
    console.log("🔍 WeakPasswordsView Debug:", {
      totalPasswords: passwordArray.length,
      weakPasswordsFound: weakPasswords.length,
      stats: stats,
      samplePasswords: passwordArray.slice(0, 3).map(p => ({
        site: p.siteService,
        passwordLength: p.password?.length,
        analysis: p.password ? analyzePassword(p.password) : 'No password'
      }))
    });
  }, [passwordArray, weakPasswords.length]);


  return (
    <div className="space-y-3 sm:space-y-4 bg-gray-50 min-h-screen p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-100 to-orange-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-red-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
              <FaExclamationTriangle className="text-red-600 text-sm sm:text-base md:text-lg" />
              <span>Security Analysis ({weakPasswords.length} issues)</span>
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              {stats.needsAttention > 0 ? 
                `${stats.needsAttention} passwords need security improvements` : 
                "All passwords meet security standards"
              }
            </p>
          </div>
          
          <button 
            onClick={handleGenerateAndCopy}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FaBolt className="text-xs" />
            {copiedId === 'generated' ? 'Copied!' : 'Generate Strong'}
          </button>
        </div>
      </div>


      {/* Controls */}
      <div className="bg-white rounded-lg p-2 sm:p-3 border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 text-xs sm:text-sm">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="flex-1 border rounded px-2 py-1.5 sm:py-1 text-xs"
          >
            <option value="all">All Issues ({stats.needsAttention})</option>
            <option value="very-weak">Very Weak ({stats.veryWeak})</option>
            <option value="weak">Weak ({stats.weak})</option>
            <option value="moderate">Moderate ({stats.moderate})</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 border rounded px-2 py-1.5 sm:py-1 text-xs"
          >
            <option value="strength">By Strength (Worst First)</option>
            <option value="name">By Site Name</option>
            <option value="date">By Date Added</option>
          </select>
          
          <span className="text-xs text-gray-500 text-center sm:text-left sm:ml-auto">
            Showing {weakPasswords.length} of {stats.validTotal} analyzed
          </span>
        </div>
      </div>


      {/* Stats Grid */}
      {stats.needsAttention > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-base sm:text-lg font-bold text-red-600">{stats.veryWeak}</div>
            <div className="text-xs text-red-600">Very Weak</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-base sm:text-lg font-bold text-orange-600">{stats.weak}</div>
            <div className="text-xs text-orange-600">Weak</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-base sm:text-lg font-bold text-yellow-600">{stats.moderate}</div>
            <div className="text-xs text-yellow-600">Moderate</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-base sm:text-lg font-bold text-green-600">{stats.strong + stats.veryStrong}</div>
            <div className="text-xs text-green-600">Strong</div>
          </div>
        </div>
      )}


      {/* Password List */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-3 sm:px-4 py-2 sm:py-3 text-white">
          <h2 className="text-sm sm:text-base md:text-lg font-bold flex items-center gap-2">
            <FaShieldAlt className="text-xs sm:text-sm" />
            Security Issues {isLoading && "(Loading...)"}
          </h2>
        </div>


        <div className="p-3 sm:p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm sm:text-base">Analyzing password security...</p>
            </div>
          ) : weakPasswords.length === 0 ? (
            <div className="text-center py-8">
              <FaCheckCircle className="text-green-500 text-2xl sm:text-3xl mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                {stats.total === 0 ? "No Passwords Found" : "All Passwords Are Secure!"}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                {stats.total === 0 
                  ? "Add some passwords to see security analysis." 
                  : "Great job! All your passwords meet security standards."
                }
              </p>
              {stats.validTotal !== stats.total && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-xs sm:text-sm">
                    ⚠️ Note: {stats.total - stats.validTotal} password entries have data issues.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {weakPasswords.map((password, index) => {
                const favicon = getSiteFavicon(password.websiteUrl || password.site);
                const analysis = analyzePassword(password.password);
                const isVisible = showPasswords[password.id];
                const isEditing = editingPassword === password.id;
                
                return (
                  <div 
                    key={password.id || index} 
                    className={`rounded-lg border-2 p-2 sm:p-3 hover:shadow-sm transition-all ${getStrengthColor(analysis.strength)}`}
                  >
                    <div className="flex items-start sm:items-center justify-between gap-2">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white shadow-sm border flex items-center justify-center overflow-hidden flex-shrink-0">
                          {favicon ? (
                            <img 
                              src={favicon} 
                              alt="" 
                              className="w-3 h-3 sm:w-4 sm:h-4" 
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextElementSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <span className={`text-xs font-bold ${favicon ? "hidden" : "flex"}`}>
                            {(password.siteService || password.siteName || password.site || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>


                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                            <a
                              href={password.websiteUrl || password.site || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 transition-colors"
                            >
                              {password.siteService || password.siteName || password.site || "Unknown Site"}
                            </a>
                          </h3>
                          <p className="text-gray-600 text-xs truncate">{password.username}</p>
                          
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium border ${getStrengthColor(analysis.strength)}`}>
                              {getStrengthIcon(analysis.strength)} {analysis.strength}
                            </span>
                            <span className="bg-gray-100 text-gray-600 text-xs px-1.5 sm:px-2 py-0.5 rounded">
                              {password.password?.length || 0}ch
                            </span>
                            <span className="bg-gray-100 text-gray-600 text-xs px-1.5 sm:px-2 py-0.5 rounded">
                              {Math.round(analysis.score)}%
                            </span>
                          </div>
                        </div>
                      </div>


                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => togglePasswordVisibility(password.id)}
                          className="p-1 sm:p-1.5 rounded bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 transition-colors"
                          title={isVisible ? "Hide" : "Show"}
                        >
                          {isVisible ? <FaEyeSlash className="w-3 h-3" /> : <FaEye className="w-3 h-3" />}
                        </button>
                        
                        <button
                          onClick={() => copyToClipboard(password.password, password.id)}
                          className={`p-1 sm:p-1.5 rounded transition-colors ${
                            copiedId === password.id
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 hover:bg-green-100 text-gray-600 hover:text-green-600"
                          }`}
                        >
                          <FaCopy className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={() => startEditing(password)}
                          className="p-1 sm:p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded transition-colors"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                        
                        <button 
                          onClick={() => handleDeletePassword(password.id || password._id, password.siteService)}
                          className="p-1 sm:p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded transition-colors"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>


                    {/* Issues List */}
                    {analysis.issues.length > 0 && !isEditing && (
                      <div className="mt-2 p-2 bg-white rounded border text-xs">
                        <span className="text-orange-600 font-medium">Issues: </span>
                        <span className="text-gray-600">
                          {analysis.issues.slice(0, 3).join(", ")}
                          {analysis.issues.length > 3 && ` +${analysis.issues.length - 3} more`}
                        </span>
                      </div>
                    )}


                    {/* Password Display/Edit */}
                    {(isVisible || isEditing) && (
                      <div className="mt-2 pt-2 border-t">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="flex-1 px-2 py-1.5 sm:py-1 border rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter new strong password"
                              />
                              <button
                                onClick={() => setNewPassword(generateStrongPassword())}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 sm:py-1 rounded text-xs whitespace-nowrap"
                              >
                                Generate
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveNewPassword(password.id)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:py-1 rounded text-xs"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 sm:py-1 rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                            {newPassword && (
                              <div className="text-xs">
                                <span className="text-gray-600">New strength: </span>
                                <span className={`font-medium ${getStrengthColor(analyzePassword(newPassword).strength).split(' ')[0]}`}>
                                  {analyzePassword(newPassword).strength} ({Math.round(analyzePassword(newPassword).score)}%)
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-100 rounded p-2 font-mono text-xs break-all border">
                            {password.password}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>


      {/* Security Tips */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 sm:px-4 py-2 text-white">
          <h3 className="text-xs sm:text-sm font-bold">💡 Password Security Tips</h3>
        </div>
        
        <div className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">✅ Create Strong Passwords:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Use 12+ characters minimum</li>
                <li>• Mix uppercase, lowercase, numbers, symbols</li>
                <li>• Make each password unique</li>
                <li>• Use our password generator</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">❌ Avoid These Mistakes:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Dictionary words or names</li>
                <li>• Keyboard patterns (qwerty, 123)</li>
                <li>• Personal information</li>
                <li>• Reusing passwords</li>
              </ul>
            </div>
          </div>
        </div>
      </div>


      <ToastContainer />
    </div>
  );
};


export default WeakPasswordsView;
