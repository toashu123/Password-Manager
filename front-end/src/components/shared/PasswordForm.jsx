import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";
import "react-toastify/dist/ReactToastify.css";
import { usePasswords } from "../../contexts/PasswordContext";

const PasswordForm = ({ closeForm, onSave, initialCategory }) => {
  const { user, isLoaded } = useUser();
  const { addPassword, cryptoReady, categories } = usePasswords();
  
  const [formData, setFormData] = useState({
    siteService: '',
    username: '',
    password: '',
    category: initialCategory || 'Personal',
    websiteUrl: '',
    notes: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('Weak');
  const [passwordAnalysis, setPasswordAnalysis] = useState({
    isWeak: true,
    suggestions: [],
    warnings: [],
    score: 0
  });
  const [showWeakPasswordWarning, setShowWeakPasswordWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set initial category when prop changes
  useEffect(() => {
    if (initialCategory) {
      setFormData(prev => ({
        ...prev,
        category: initialCategory
      }));
    }
  }, [initialCategory]);

  // Test encryption on component mount - Fixed with proper error handling
  useEffect(() => {
    const testEncryptionInForm = async () => {
      if (user?.id && cryptoReady) {
        try {
          console.log("🧪 Testing encryption in form context...");
          console.log("🧪 User ID:", user?.id);
          console.log("🧪 Crypto ready:", cryptoReady);
          
          // Note: Remove references to undefined functions
          // const cryptoTest = await testCrypto();
          // console.log("🧪 Crypto test result:", cryptoTest);
        } catch (error) {
          console.error("❌ Form encryption test failed:", error);
        }
      }
    };

    testEncryptionInForm();
  }, [user?.id, cryptoReady]);

  // Enhanced password analysis function - Fixed and optimized
  const analyzePassword = useCallback((password) => {
    if (!password || typeof password !== 'string' || password.length === 0) {
      return { 
        strength: "Weak", 
        score: 0, 
        issues: ["Password is empty"], 
        isWeak: true, 
        warnings: ["Password is required"], 
        suggestions: ["Enter a password"] 
      };
    }
    
    let score = 0;
    let issues = [];
    let warnings = [];
    let suggestions = [];
    
    const commonWeakPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
      'qwerty123', 'welcome123', 'admin123', 'root', 'toor', 'pass',
      'test', 'guest', 'user', 'login', '000000', '111111', '123123'
    ];
    
    // Length scoring
    if (password.length >= 16) score += 3;
    else if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    else {
      issues.push("Too short");
      suggestions.push("Use at least 12 characters");
      warnings.push("Password is too short");
    }
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else {
      issues.push("Missing lowercase");
      suggestions.push("Add lowercase letters");
    }
    
    if (/[A-Z]/.test(password)) score += 1;
    else {
      issues.push("Missing uppercase");
      suggestions.push("Add uppercase letters");
    }
    
    if (/[0-9]/.test(password)) score += 1;
    else {
      issues.push("Missing numbers");
      suggestions.push("Add numbers");
    }
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else {
      issues.push("Missing symbols");
      suggestions.push("Add special characters");
    }
    
    // Pattern checks
    if (/(.)\1{2,}/.test(password)) {
      issues.push("Repeating characters");
      warnings.push("Contains repeating characters");
    } else score += 1;
    
    if (/123|abc|qwe|password|admin|welcome/i.test(password)) {
      issues.push("Common patterns");
      warnings.push("Contains common patterns");
    } else score += 1;
    
    // Check common passwords
    const isCommonPassword = commonWeakPasswords.some(weak => 
      password.toLowerCase().includes(weak.toLowerCase())
    );
    
    if (isCommonPassword) {
      issues.push("Common password");
      warnings.push("This is a commonly used password");
    } else score += 1;
    
    // Determine strength
    let strength;
    let isWeak = false;
    
    if (score >= 7) {
      strength = "Very Strong";
    } else if (score >= 5) {
      strength = "Strong";
    } else if (score >= 3) {
      strength = "Moderate";
      isWeak = true;
    } else if (score >= 1) {
      strength = "Weak";
      isWeak = true;
    } else {
      strength = "Very Weak";
      isWeak = true;
    }
    
    // Final weak password check
    if (password.length < 8 || /(.)\1{2,}/.test(password) || isCommonPassword) {
      isWeak = true;
    }
    
    return { 
      strength, 
      score: Math.min(score * 12.5, 100), 
      issues: issues.slice(0, 4), 
      isWeak,
      warnings: warnings.slice(0, 3),
      suggestions: suggestions.slice(0, 4)
    };
  }, []);

  // Update analysis when password changes
  useEffect(() => {
    if (formData.password && typeof formData.password === 'string') {
      const analysis = analyzePassword(formData.password);
      setPasswordStrength(analysis.strength);
      setPasswordAnalysis(analysis);
      setShowWeakPasswordWarning(analysis.isWeak && formData.password.length > 0);
    } else {
      setPasswordStrength('Weak');
      setPasswordAnalysis({
        isWeak: true,
        suggestions: ['Enter a password'],
        warnings: [],
        score: 0
      });
      setShowWeakPasswordWarning(false);
    }
  }, [formData.password, analyzePassword]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || ''
    }));
  }, []);

  const generateStrongPassword = useCallback(() => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    let password = "";
    
    // Ensure variety
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill remaining
    const allChars = lowercase + uppercase + numbers + specialChars;
    for (let i = 4; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle
    const shuffledPassword = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setFormData(prev => ({ ...prev, password: shuffledPassword }));
    
    toast.success("Strong password generated! 💪", {
      position: "top-right",
      autoClose: 2000,
      theme: "dark",
    });
  }, []);

  // Fixed handleSubmit - Removed infinite loop and cleaned up logic
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    console.log("🔍 Starting form submission...");

    // Validation checks
    if (!isLoaded) throw new Error("User authentication is loading.");
    if (!user?.id) throw new Error("Please log in.");
    if (!cryptoReady) throw new Error("Encryption system not ready.");

    // Validate required fields
    const passwordValue = formData.password?.trim() || "";
    const errors = [];
    
    if (!formData.siteService?.trim()) errors.push("Site/Service is required");
    if (!formData.username?.trim()) errors.push("Username is required");
    if (!passwordValue) errors.push("Password is required");

    if (errors.length) throw new Error(errors.join(". "));

    console.log("✅ Validation passed");

    // Handle weak password warning
    if (passwordValue && passwordAnalysis?.isWeak) {
      const confirmWeak = window.confirm(
        `⚠️ WARNING: Your password is ${passwordAnalysis.strength?.toUpperCase()}!\n\n` +
        `Issues:\n• ${passwordAnalysis.warnings?.join("\n• ")}\n\n` +
        `Save anyway?`
      );

      if (!confirmWeak) {
        toast.warning("Click 'Generate' to improve your password.", {
          position: "top-center",
          autoClose: 5000,
          theme: "dark"
        });
        setIsSubmitting(false); // Reset submitting state
        return;
      }
    }

    // Compose payload to save
    const passwordPayload = {
      siteService: formData.siteService.trim(),
      username: formData.username.trim(),
      password: passwordValue,
      category: formData.category || "Personal",
      websiteUrl: formData.websiteUrl?.trim() || 
        (formData.siteService?.trim() && !formData.siteService.includes(' ') 
          ? `https://${formData.siteService.trim()}` 
          : ""),
      notes: formData.notes?.trim() || "",
      strength: passwordAnalysis?.strength || "Unknown",
      isWeak: passwordAnalysis?.isWeak || false,
      securityScore: passwordAnalysis?.score || 0,
      securityIssues: passwordAnalysis?.warnings || [],
    };

    console.log("🔎 Calling addPassword with:", passwordPayload);

    // FIXED: Call addPassword and wait for it to complete
    const result = await addPassword(passwordPayload);
    console.log("✅ Password saved:", result);

    // FIXED: Only call onSave if addPassword succeeds
    if (onSave && typeof onSave === 'function') {
      try {
        await onSave(result || passwordPayload);
        console.log("✅ onSave callback completed");
      } catch (callbackError) {
        console.warn("⚠️ onSave callback failed:", callbackError);
        // Don't throw here - the password was saved successfully
      }
    }

    // Reset form safely
    setFormData({
      siteService: "",
      username: "",
      password: "",
      category: initialCategory || "Personal",
      websiteUrl: "",
      notes: "",
    });

    // Show success toast
    if (passwordAnalysis?.isWeak) {
      toast.warning(`Weak password saved for ${passwordPayload.siteService}!`, {
        position: "top-right",
        autoClose: 6000,
        theme: "dark",
      });
    } else {
      toast.success(`Password saved successfully for ${passwordPayload.siteService}!`, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      });
    }

    // Close form after a short delay to show the toast
    setTimeout(() => {
      if (closeForm && typeof closeForm === 'function') {
        closeForm();
      }
    }, 500);

  } catch (error) {
    console.error("❌ Submission Error:", error);
    
    // More specific error messages
    let errorMessage = error.message;
    if (error.message.includes('fetch')) {
      errorMessage = "Network error. Please check your internet connection.";
    } else if (error.message.includes('encrypt')) {
      errorMessage = "Encryption failed. Please try again.";
    } else if (error.message.includes('auth')) {
      errorMessage = "Authentication error. Please log in again.";
    }
    
    toast.error(`Error: ${errorMessage}`, { 
      position: "top-center", 
      autoClose: 8000, 
      theme: "dark" 
    });
  } finally {
    setIsSubmitting(false);
  }
};


  const handleCancel = useCallback(() => {
    setFormData({
      siteService: '',
      username: '',
      password: '',
      category: initialCategory || 'Personal',
      websiteUrl: '',
      notes: ''
    });
    
    if (closeForm) {
      closeForm();
    }
  }, [closeForm, initialCategory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsSubmitting(false);
      setShowWeakPasswordWarning(false);
    };
  }, []);

  // Show loading while Clerk loads
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 max-w-md text-white text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-300">Initializing user session</p>
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 max-w-md text-white text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Authentication Required</h2>
          <p className="text-gray-300 mb-4">Please log in to save passwords.</p>
          <button 
            onClick={handleCancel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Show loading while crypto initializes
  if (!cryptoReady) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 max-w-md text-white text-center">
          <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Initializing Security...</h2>
          <p className="text-gray-300">Setting up encryption system</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-lg mx-4 my-8 text-white max-h-screen overflow-y-auto">
          {/* Form Header */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-white">Add New Password</h2>
            <button 
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-300 text-2xl font-light"
              aria-label="Close form"
            >
              ×
            </button>
          </div>
          
          <p className="text-gray-400 text-sm mb-4">
            Fill in the details below to save a new password securely.
          </p>

          {/* User Info */}
          <div className="mb-6 p-3 bg-slate-700 rounded-lg border border-slate-600">
            <p className="text-xs text-gray-400 mb-1">Saving password for:</p>
            <p className="text-sm text-green-400 font-medium">
              {user.firstName} {user.lastName} ({user.primaryEmailAddress?.emailAddress})
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-xs text-green-400">Encryption Ready</p>
            </div>
            {initialCategory && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-xs text-blue-400">Category: {initialCategory}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Site/Service */}
            <div>
              <label htmlFor="siteService" className="block text-sm font-medium text-gray-300 mb-1">
                Site/Service *
              </label>
              <input
                type="text"
                id="siteService"
                name="siteService"
                value={formData.siteService}
                onChange={handleInputChange}
                placeholder="e.g., Google, GitHub, Amazon"
                required
                disabled={isSubmitting}
                aria-describedby="siteService-error"
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:opacity-50"
              />
            </div>

            {/* Username/Email */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Username/Email *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="your@email.com or username"
                required
                disabled={isSubmitting}
                aria-describedby="username-error"
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password *
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required
                    disabled={isSubmitting}
                    aria-describedby="password-strength password-error"
                    className={`w-full px-3 py-3 pr-12 bg-slate-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition duration-200 disabled:opacity-50 ${
                      passwordAnalysis.isWeak && formData.password && formData.password.length > 0 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-600 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition duration-200 whitespace-nowrap flex items-center gap-1 disabled:opacity-50"
                >
                  ⚡ Generate
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && formData.password.length > 0 && (
                <div className="mt-3 space-y-2" id="password-strength">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Password Strength:</span>
                    <span className={`text-xs font-medium flex items-center gap-1 ${
                      passwordAnalysis.isWeak ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {passwordAnalysis.isWeak && '⚠️'} {passwordStrength} ({Math.round(passwordAnalysis.score)}/100)
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordAnalysis.isWeak ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${passwordAnalysis.score}%` }}
                      role="progressbar"
                      aria-valuenow={passwordAnalysis.score}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-label={`Password strength: ${passwordStrength}`}
                    ></div>
                  </div>

                  {/* Weak Password Warning */}
                  {showWeakPasswordWarning && (
                    <div className="bg-red-900/50 border border-red-500 rounded-md p-3 mt-2" role="alert">
                      <div className="flex items-start gap-2">
                        <span className="text-red-400 text-lg" aria-hidden="true">⚠️</span>
                        <div className="flex-1">
                          <h4 className="text-red-400 font-medium text-sm mb-2">Weak Password Detected!</h4>
                          
                          {passwordAnalysis.warnings.length > 0 && (
                            <div className="mb-2">
                              <p className="text-red-300 text-xs mb-1">Issues found:</p>
                              <ul className="text-red-300 text-xs list-disc list-inside space-y-1">
                                {passwordAnalysis.warnings.map((warning, index) => (
                                  <li key={index}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={generateStrongPassword}
                            disabled={isSubmitting}
                            className="mt-2 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
                          >
                            Generate Strong Password
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 cursor-pointer disabled:opacity-50"
              >
                {/* Default options */}
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Finance">Finance</option>
                <option value="Social">Social</option>
                
                {/* Dynamic categories from database */}
                {categories && categories.length > 0 && categories.map((category) => (
                  <option key={category.id || category._id} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Website URL */}
            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-300 mb-1">
                Website URL
              </label>
              <input
                type="url"
                id="websiteUrl"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                placeholder="https://example.com"
                disabled={isSubmitting}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:opacity-50"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes..."
                rows="3"
                disabled={isSubmitting}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-vertical disabled:opacity-50"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 font-medium py-3 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 ${
                  passwordAnalysis.isWeak && formData.password && formData.password.length > 0
                    ? 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    {passwordAnalysis.isWeak && formData.password && formData.password.length > 0 ? '⚠️ Save Weak Password' : '✅ Save Password'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <ToastContainer />
    </>
  );
};

export default PasswordForm;
