import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Bounce, ToastContainer, toast } from "react-toastify";
import { useUser } from "@clerk/clerk-react";
import "react-toastify/dist/ReactToastify.css";
import AddPasswordButton from "../components/ui/AddPasswordButton";
import { usePasswords } from "../contexts/PasswordContext";


const Manager = () => {
  const passwordRef = useRef();
  const eyeIconRef = useRef();
  const { user } = useUser();


  const {
    passwordArray,
    isLoading,
    addPassword,
    deletePassword: contextDeletePassword,
    updatePassword,
    loadPasswords,
    error,
    cryptoReady,
  } = usePasswords();


  // Form state
  const [form, setForm] = useState({
    site: "",
    username: "",
    password: "",
    id: null,
  });


  // UI state
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [sortBy, setSortBy] = useState("site");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");


  // Enhanced password analysis function
  const analyzePassword = useCallback((password) => {
    if (!password || typeof password !== "string" || password.length === 0) {
      return {
        strength: "Very Weak",
        score: 0,
        issues: ["Password is empty"],
        isWeak: true,
        warnings: ["Password is required"],
        suggestions: ["Enter a password"],
      };
    }


    let score = 0;
    let warnings = [];
    let suggestions = [];


    const commonWeakPasswords = [
      "password",
      "123456",
      "123456789",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "letmein",
      "welcome",
      "monkey",
      "1234567890",
      "password1",
      "qwerty123",
      "welcome123",
      "admin123",
      "root",
      "toor",
      "pass",
      "test",
      "guest",
      "user",
      "login",
      "000000",
      "111111",
      "123123",
    ];


    // Length scoring (0-25 points)
    if (password.length >= 16) score += 25;
    else if (password.length >= 12) score += 20;
    else if (password.length >= 8) score += 10;
    else {
      warnings.push("Password is too short");
      suggestions.push("Use at least 12 characters");
    }


    // Character variety (0-40 points total)
    if (/[a-z]/.test(password)) score += 10;
    else suggestions.push("Add lowercase letters");


    if (/[A-Z]/.test(password)) score += 10;
    else suggestions.push("Add uppercase letters");


    if (/[0-9]/.test(password)) score += 10;
    else suggestions.push("Add numbers");


    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    else suggestions.push("Add special characters");


    // Pattern checks (0-20 points)
    if (!/(.)\1{2,}/.test(password)) score += 10;
    else warnings.push("Contains repeating characters");


    if (!/123|abc|qwe|password|admin|welcome/i.test(password)) score += 10;
    else warnings.push("Contains common patterns");


    // Common password check (0-15 points)
    const isCommonPassword = commonWeakPasswords.some((weak) =>
      password.toLowerCase().includes(weak.toLowerCase())
    );


    if (!isCommonPassword) score += 15;
    else warnings.push("This is a commonly used password");


    // Determine strength
    let strength;
    let isWeak = false;


    if (score >= 80) {
      strength = "Very Strong";
    } else if (score >= 60) {
      strength = "Strong";
    } else if (score >= 40) {
      strength = "Moderate";
      isWeak = true;
    } else if (score >= 20) {
      strength = "Weak";
      isWeak = true;
    } else {
      strength = "Very Weak";
      isWeak = true;
    }


    return {
      strength,
      score: Math.min(score, 100),
      isWeak,
      warnings: warnings.slice(0, 3),
      suggestions: suggestions.slice(0, 4),
    };
  }, []);


  // Memoized password analysis
  const passwordAnalysis = useMemo(() => {
    return analyzePassword(form.password);
  }, [form.password, analyzePassword]);


  // Password Strength Indicator Component
  const PasswordStrengthIndicator = ({
    strength,
    score,
    warnings = [],
    suggestions = [],
  }) => {
    const getStrengthConfig = (strengthLevel) => {
      const configs = {
        "Very Weak": {
          color: "bg-red-500",
          bgColor: "bg-red-50",
          textColor: "text-red-700",
          borderColor: "border-red-200",
          icon: "🔴",
        },
        Weak: {
          color: "bg-red-400",
          bgColor: "bg-red-50",
          textColor: "text-red-600",
          borderColor: "border-red-200",
          icon: "🟠",
        },
        Moderate: {
          color: "bg-yellow-500",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-700",
          borderColor: "border-yellow-200",
          icon: "🟡",
        },
        Strong: {
          color: "bg-green-500",
          bgColor: "bg-green-50",
          textColor: "text-green-700",
          borderColor: "border-green-200",
          icon: "🟢",
        },
        "Very Strong": {
          color: "bg-green-600",
          bgColor: "bg-green-50",
          textColor: "text-green-800",
          borderColor: "border-green-200",
          icon: "✅",
        },
      };
      return configs[strengthLevel] || configs["Weak"];
    };


    if (!strength) return null;


    const config = getStrengthConfig(strength);
    const isWeak = ["Very Weak", "Weak", "Moderate"].includes(strength);


    return (
      <div
        className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <span className={`font-semibold text-sm ${config.textColor}`}>
              Password Strength
            </span>
          </div>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${config.color} text-white`}
          >
            {strength} ({score}%)
          </span>
        </div>


        {/* Progress Bar */}
        <div className="relative mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${config.color}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>


        {/* Warnings & Suggestions */}
        {isWeak && (warnings.length > 0 || suggestions.length > 0) && (
          <div className="space-y-2">
            {warnings.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-red-500 text-sm">⚠️</span>
                <div className="text-red-600 text-xs">
                  <div className="font-medium mb-1">Issues:</div>
                  {warnings.slice(0, 3).map((warning, i) => (
                    <div key={i}>• {warning}</div>
                  ))}
                </div>
              </div>
            )}


            {suggestions.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-blue-500 text-sm">💡</span>
                <div className="text-blue-600 text-xs">
                  <div className="font-medium mb-1">Suggestions:</div>
                  {suggestions.slice(0, 2).map((suggestion, i) => (
                    <div key={i} className="mb-1">
                      • {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };


  // Enhanced password visibility toggle
  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);


  // Secure password generation with crypto API
  const generateStrongPassword = useCallback(() => {
    try {
      const lowercase = "abcdefghijklmnopqrstuvwxyz";
      const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const numbers = "0123456789";
      const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";


      let password = "";


      // Ensure variety using crypto.getRandomValues for better security
      const getRandomChar = (charset) => {
        const randomArray = new Uint8Array(1);
        crypto.getRandomValues(randomArray);
        return charset[randomArray[0] % charset.length];
      };


      // Guarantee at least one character from each type
      password += getRandomChar(lowercase);
      password += getRandomChar(uppercase);
      password += getRandomChar(numbers);
      password += getRandomChar(specialChars);


      // Fill remaining length
      const allChars = lowercase + uppercase + numbers + specialChars;
      for (let i = 4; i < 16; i++) {
        password += getRandomChar(allChars);
      }


      // Shuffle using Fisher-Yates algorithm
      const chars = password.split("");
      for (let i = chars.length - 1; i > 0; i--) {
        const randomArray = new Uint8Array(1);
        crypto.getRandomValues(randomArray);
        const j = randomArray[0] % (i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }


      const shuffledPassword = chars.join("");


      setForm((prev) => ({ ...prev, password: shuffledPassword }));


      toast.success("🔐 Strong password generated!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Password generation failed:", error);
      toast.error("Failed to generate password. Please try again.");
    }
  }, []);


  // Enhanced save password with better validation
  const savePassword = useCallback(async () => {
    // Validation
    if (!form.site?.trim()) {
      toast.error("Website/Site name is required!");
      return;
    }
    if (!form.username?.trim()) {
      toast.error("Username is required!");
      return;
    }
    if (!form.password?.trim()) {
      toast.error("Password is required!");
      return;
    }


    if (
      form.site.length < 3 ||
      form.username.length < 3 ||
      form.password.length < 3
    ) {
      toast.error("All fields must be at least 3 characters long!");
      return;
    }


    if (!cryptoReady) {
      toast.error("Encryption system not ready. Please wait and try again.");
      return;
    }


    // Weak password confirmation
    if (passwordAnalysis.isWeak) {
      const confirmWeak = window.confirm(
        `⚠️ WARNING: Your password is ${passwordAnalysis.strength.toUpperCase()}!\n\n` +
          `Security Score: ${passwordAnalysis.score}/100\n\n` +
          `Issues found:\n• ${passwordAnalysis.warnings.join("\n• ")}\n\n` +
          `Do you want to save this weak password anyway?\n\n` +
          `Click "Cancel" to improve it, or "OK" to continue.`
      );


      if (!confirmWeak) {
        toast.warning("💡 Click 'Generate Strong' for a secure password!", {
          position: "top-center",
          autoClose: 5000,
        });
        return;
      }
    }


    setIsSubmitting(true);


    try {
      // Prepare password data
      const passwordData = {
        siteService: form.site.trim(),
        username: form.username.trim(),
        password: form.password,
        category: "Personal",
        websiteUrl: form.site.startsWith("http")
          ? form.site
          : `https://${form.site}`,
        notes: "",
        strength: passwordAnalysis.strength,
        isWeak: passwordAnalysis.isWeak,
        securityScore: passwordAnalysis.score,
        securityIssues: passwordAnalysis.warnings,
      };


      if (form.id) {
        // Update existing password
        await updatePassword(form.id, passwordData);
        toast.success(`✅ Password updated for ${passwordData.siteService}!`);
      } else {
        // Add new password
        await addPassword(passwordData);
        toast.success(`✅ Password saved for ${passwordData.siteService}!`);
      }


      // Reset form
      setForm({ site: "", username: "", password: "", id: null });
      setIsPasswordVisible(false);
    } catch (error) {
      console.error("Error saving password:", error);
      toast.error(
        `Failed to ${form.id ? "update" : "save"} password. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [form, passwordAnalysis, cryptoReady, addPassword, updatePassword]);


  // Enhanced form change handler
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);


  // Enhanced copy functionality
  const copyText = useCallback((text, fieldName, passwordItem = null) => {
    if (!text) {
      toast.error("Nothing to copy!");
      return;
    }


    if (passwordItem?.decryptionError || text === "***DECRYPTION_FAILED***") {
      toast.error("Cannot copy: password is corrupted or decryption failed.");
      return;
    }


    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedField(`${passwordItem?.id || "form"}-${fieldName}`);
        setTimeout(() => setCopiedField(null), 2000);


        toast.success(
          `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} copied!`,
          {
            position: "bottom-right",
            autoClose: 2000,
          }
        );
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast.error(`Failed to copy ${fieldName}`);
      });
  }, []);


  // Enhanced delete password
  const deletePassword = useCallback(
    async (id, siteName) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete the password for "${siteName}"?\n\nThis action cannot be undone.`
      );


      if (!confirmed) return;


      try {
        await contextDeletePassword(id);
        toast.success(`Password deleted for ${siteName}!`, {
          position: "top-right",
          autoClose: 3000,
        });
      } catch (error) {
        console.error("Error deleting password:", error);
        toast.error("Failed to delete password!");
      }
    },
    [contextDeletePassword]
  );


  // Enhanced edit password
  const editPassword = useCallback((passwordItem) => {
    if (!passwordItem) return;


    if (
      passwordItem.decryptionError ||
      passwordItem.password === "***DECRYPTION_FAILED***"
    ) {
      toast.error("Cannot edit: password decryption failed or data corrupted.");
      return;
    }


    setForm({
      site: passwordItem.siteService || passwordItem.site || "",
      username: passwordItem.username || "",
      password: passwordItem.password || "",
      id: passwordItem.id || passwordItem._id?.toString(),
    });


    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Editing password - modify and click save to update");
  }, []);


  // Filtered and sorted passwords
  const filteredPasswords = useMemo(() => {
    let filtered = passwordArray.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        (item.siteService || item.site || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.username || "").toLowerCase().includes(searchQuery.toLowerCase());


      const matchesCategory =
        !filterCategory ||
        (item.category || "").toLowerCase() === filterCategory.toLowerCase();


      return matchesSearch && matchesCategory;
    });


    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "site":
          return (a.siteService || a.site || "").localeCompare(
            b.siteService || b.site || ""
          );
        case "username":
          return (a.username || "").localeCompare(b.username || "");
        case "strength":
          const aScore = a.securityScore || 0;
          const bScore = b.securityScore || 0;
          return bScore - aScore;
        default:
          return 0;
      }
    });
  }, [passwordArray, searchQuery, filterCategory, sortBy]);


  // Refresh handler
  const handleRefresh = useCallback(() => {
    loadPasswords();
    toast.info("Passwords refreshed!");
  }, [loadPasswords]);


  // Loading state
  if (!cryptoReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            Initializing secure vault...
          </p>
        </div>
      </div>
    );
  }


  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />


      {/* Background */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-green-50 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-green-400 opacity-20 blur-[100px]"></div>
      </div>


      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 min-h-screen">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="text-green-500">&lt;</span>
            <span>Pass</span>
            <span className="text-green-500">OP/&gt;</span>
          </h1>
          <p className="text-green-900 text-lg md:text-xl">
            Your own Password Manager
          </p>
        </div>


        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">Error: {error.message}</span>
            </div>
          </div>
        )}


        {/* Password Form */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-green-100 p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {form.id ? "Edit Password" : "Add New Password"}
          </h2>


          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Site Input */}
            <div>
              <label
                htmlFor="site"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Website/Service *
              </label>
              <input
                id="site"
                name="site"
                type="text"
                value={form.site}
                onChange={handleChange}
                placeholder="e.g., gmail.com, Facebook, Netflix"
                className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
              />
            </div>


            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username/Email *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="your@email.com or username"
                className="w-full px-4 py-3 border-2 border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
              />
            </div>


            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password *
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter a strong password"
                  className={`w-full px-4 py-3 pr-24 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    passwordAnalysis.isWeak && form.password
                      ? "border-red-300 focus:border-red-500"
                      : "border-green-200 focus:border-green-500"
                  }`}
                  required
                />
                {/* Password visibility toggle */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  title={isPasswordVisible ? "Hide password" : "Show password"}
                >
                  {isPasswordVisible ? "👁️" : "👁️‍🗨️"}
                </button>
                {/* Generate password button */}
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                  title="Generate strong password"
                >
                  ⚡
                </button>
              </div>
            </div>


            {/* Password Strength Indicator */}
            {form.password && (
              <PasswordStrengthIndicator
                strength={passwordAnalysis.strength}
                score={passwordAnalysis.score}
                warnings={passwordAnalysis.warnings}
                suggestions={passwordAnalysis.suggestions}
              />
            )}


            {/* Submit Button */}
            <div className="text-center">
              <AddPasswordButton savePassword={savePassword} />


              {form.id && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({ site: "", username: "", password: "", id: null });
                    toast.info("Edit cancelled");
                  }}
                  className="ml-4 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>


        {/* Passwords Section */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-green-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-white">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold">Your Passwords</h2>
                <p className="text-green-100 text-sm">
                  {filteredPasswords.length} of {passwordArray.length} passwords
                </p>
              </div>


              <div className="flex gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    "🔄"
                  )}
                  Refresh
                </button>
              </div>
            </div>
          </div>


          {/* Filters */}
          {passwordArray.length > 0 && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search passwords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="site">Sort by Site</option>
                  <option value="username">Sort by Username</option>
                  <option value="strength">Sort by Strength</option>
                </select>
              </div>
            </div>
          )}


          {/* Passwords List */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">
                  Loading passwords...
                </p>
              </div>
            ) : filteredPasswords.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔐</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {passwordArray.length === 0
                    ? "No passwords saved yet"
                    : "No passwords found"}
                </h3>
                <p className="text-gray-600">
                  {passwordArray.length === 0
                    ? "Add your first password using the form above"
                    : "Try adjusting your search criteria"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Site
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Username
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Password
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Strength
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPasswords.map((item, index) => {
                      const itemId = item.id || item._id || index;
                      const siteName =
                        item.siteService || item.site || "Unknown";
                      const isCorrupted =
                        item.decryptionError ||
                        item.password === "***DECRYPTION_FAILED***";


                      return (
                        <tr
                          key={itemId}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Site */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-between max-w-[200px]">
                              <a
                                href={
                                  item.websiteUrl ||
                                  (item.siteService &&
                                  !item.siteService.includes(" ")
                                    ? `https://${item.siteService}`
                                    : "#")
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 truncate font-medium"
                                title={siteName}
                              >
                                {siteName}
                              </a>
                              <button
                                onClick={() => copyText(siteName, "site", item)}
                                className={`ml-2 p-1 rounded transition-colors ${
                                  copiedField === `${itemId}-site`
                                    ? "text-green-600"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                                title="Copy site name"
                              >
                                {copiedField === `${itemId}-site` ? "✓" : "📋"}
                              </button>
                            </div>
                          </td>


                          {/* Username */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-between max-w-[200px]">
                              <span
                                className="truncate text-gray-900"
                                title={item.username}
                              >
                                {item.username}
                              </span>
                              <button
                                onClick={() =>
                                  copyText(item.username, "username", item)
                                }
                                className={`ml-2 p-1 rounded transition-colors ${
                                  copiedField === `${itemId}-username`
                                    ? "text-green-600"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                                title="Copy username"
                              >
                                {copiedField === `${itemId}-username`
                                  ? "✓"
                                  : "📋"}
                              </button>
                            </div>
                          </td>


                          {/* Password */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-between max-w-[150px]">
                              <span className="font-mono text-gray-600">
                                {isCorrupted
                                  ? "[Corrupted]"
                                  : "*".repeat(
                                      Math.min(item.password?.length || 0, 12)
                                    )}
                              </span>
                              <button
                                onClick={() =>
                                  copyText(item.password, "password", item)
                                }
                                disabled={isCorrupted}
                                className={`ml-2 p-1 rounded transition-colors ${
                                  isCorrupted
                                    ? "text-gray-300 cursor-not-allowed"
                                    : copiedField === `${itemId}-password`
                                    ? "text-green-600"
                                    : "text-gray-400 hover:text-gray-600"
                                }`}
                                title={
                                  isCorrupted
                                    ? "Cannot copy corrupted password"
                                    : "Copy password"
                                }
                              >
                                {copiedField === `${itemId}-password`
                                  ? "✓"
                                  : "📋"}
                              </button>
                            </div>
                          </td>


                          {/* Strength */}
                          <td className="px-4 py-3">
                            {isCorrupted ? (
                              <span className="text-red-500 text-sm font-medium">
                                Corrupted
                              </span>
                            ) : (
                              <span
                                className={`text-sm font-medium px-2 py-1 rounded-full ${
                                  item.isWeak
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {item.strength || "Unknown"}
                              </span>
                            )}
                          </td>


                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => editPassword(item)}
                                disabled={isCorrupted}
                                className={`p-2 rounded-lg transition-colors ${
                                  isCorrupted
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-blue-600 hover:bg-blue-50"
                                }`}
                                title={
                                  isCorrupted
                                    ? "Cannot edit corrupted password"
                                    : "Edit password"
                                }
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deletePassword(itemId, siteName)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete password"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};


export default Manager;
