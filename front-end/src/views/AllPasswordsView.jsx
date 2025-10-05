import React, { useState, useCallback, useMemo, useEffect } from "react";
import { usePasswords } from "../contexts/PasswordContext";
import PasswordForm from "../components/shared/PasswordForm";
import { toast } from "react-toastify";


const AllPasswordsView = ({ searchQuery: externalSearchQuery }) => {
  const { 
    passwordArray, 
    isLoading, 
    deletePassword, 
    addPassword, 
    updatePassword,
    searchPasswords,
    error 
  } = usePasswords();


  // Local state
  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [showPasswords, setShowPasswords] = useState(new Set());
  const [bulkSelect, setBulkSelect] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(new Set());


  // Sync external search query
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);


  // Enhanced password strength analysis
  const getPasswordStrength = useCallback((password) => {
    if (!password || password.length === 0) {
      return { strength: "Very Weak", score: 0, color: "red" };
    }


    let score = 0;
    const checks = {
      length: password.length >= 12 ? 2 : password.length >= 8 ? 1 : 0,
      lowercase: /[a-z]/.test(password) ? 1 : 0,
      uppercase: /[A-Z]/.test(password) ? 1 : 0,
      numbers: /[0-9]/.test(password) ? 1 : 0,
      symbols: /[^A-Za-z0-9]/.test(password) ? 1 : 0,
      noRepeats: !/(.)\1{2,}/.test(password) ? 1 : 0,
      noCommon: !/123|abc|qwe|password|admin|login/i.test(password) ? 1 : 0
    };


    score = Object.values(checks).reduce((sum, val) => sum + val, 0);


    let strength, color;
    if (score >= 7) {
      strength = "Very Strong";
      color = "green";
    } else if (score >= 5) {
      strength = "Strong";
      color = "green";
    } else if (score >= 3) {
      strength = "Medium";
      color = "yellow";
    } else if (score >= 1) {
      strength = "Weak";
      color = "orange";
    } else {
      strength = "Very Weak";
      color = "red";
    }


    return { 
      strength, 
      score: Math.round((score / 7) * 100), 
      color,
      checks 
    };
  }, []);


  // Get unique categories with counts
  const categoriesWithCounts = useMemo(() => {
    const categoryMap = new Map();
    
    passwordArray.forEach(password => {
      const cat = password.category || "Uncategorized";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [passwordArray]);


  // Memoized filtered and sorted passwords
  const filteredPasswords = useMemo(() => {
    let filtered = passwordArray.filter(password => {
      // Handle decryption errors
      if (password.decryptionError) {
        return searchQuery.toLowerCase().includes("error") || !searchQuery;
      }


      const matchesSearch = !searchQuery || 
        password.siteService?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        password.siteName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        password.site?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        password.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        password.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !category || 
        password.category === category ||
        (!password.category && category === "Uncategorized");
      
      return matchesSearch && matchesCategory;
    });


    // Sort passwords
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          const aName = a.siteService || a.siteName || a.site || "";
          const bName = b.siteService || b.siteName || b.site || "";
          return aName.localeCompare(bName, undefined, { numeric: true });
        
        case "username":
          return (a.username || "").localeCompare(b.username || "", undefined, { numeric: true });
        
        case "category":
          const aCat = a.category || "Uncategorized";
          const bCat = b.category || "Uncategorized";
          return aCat.localeCompare(bCat);
        
        case "strength":
          const aStrength = getPasswordStrength(a.password);
          const bStrength = getPasswordStrength(b.password);
          return bStrength.score - aStrength.score;
        
        case "created":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        
        case "updated":
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        
        default:
          return 0;
      }
    });
  }, [passwordArray, searchQuery, category, sortBy, getPasswordStrength]);


  // Enhanced clipboard functionality with security
  const copyToClipboard = useCallback(async (text, id, type = "password") => {
    if (!text) {
      toast.error("Nothing to copy");
      return;
    }


    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      
      // Auto-clear copied state
      setTimeout(() => setCopiedId(null), 3000);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} copied!`, {
        position: "bottom-right",
        autoClose: 2000
      });
      
      console.log(`${type} copied to clipboard`);
    } catch (err) {
      console.error(`Failed to copy ${type}:`, err);
      
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} copied!`);
      } catch (fallbackErr) {
        toast.error(`Failed to copy ${type}. Please copy manually.`);
      }
    }
  }, []);


  // Enhanced delete with confirmation and loading state
  const handleDeletePassword = useCallback(async (passwordId, passwordName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the password for "${passwordName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;


    setIsDeleting(prev => new Set(prev).add(passwordId));


    try {
      await deletePassword(passwordId);
      toast.success(`Password for ${passwordName} deleted successfully`);
      console.log("✅ Password deleted via context");
    } catch (error) {
      console.error("❌ Failed to delete password:", error);
      toast.error(`Failed to delete password for ${passwordName}. Please try again.`);
    } finally {
      setIsDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(passwordId);
        return newSet;
      });
    }
  }, [deletePassword]);


  // Enhanced add password with better error handling
  const handleAddPassword = useCallback(async (newPassword) => {
    try {
      await addPassword(newPassword);
      setShowAddForm(false);
      toast.success(`Password for ${newPassword.siteService} added successfully!`);
      console.log("✅ Password added via context");
    } catch (error) {
      console.error("❌ Failed to add password:", error);
      toast.error(`Failed to save password for ${newPassword.siteService}. Please try again.`);
      throw error; // Re-throw to let PasswordForm handle it
    }
  }, [addPassword]);


  // Enhanced edit password functionality
  const handleEditPassword = useCallback((password) => {
    if (password.decryptionError) {
      toast.error("Cannot edit password with decryption errors");
      return;
    }
    
    setEditingPassword(password);
    setShowEditForm(true);
  }, []);


  // Enhanced update password with proper context integration
  const handleUpdatePassword = useCallback(async (updatedPasswordData) => {
    if (!editingPassword) return;


    try {
      await updatePassword(editingPassword.id, updatedPasswordData);
      setShowEditForm(false);
      setEditingPassword(null);
      toast.success(`Password for ${updatedPasswordData.siteService || editingPassword.siteService} updated successfully!`);
      console.log("✅ Password updated");
    } catch (error) {
      console.error("❌ Failed to update password:", error);
      toast.error(`Failed to update password. Please try again.`);
      throw error; // Re-throw to let PasswordForm handle it
    }
  }, [editingPassword, updatePassword]);


  // Get site favicon with better error handling
  const getSiteFavicon = useCallback((url) => {
    if (!url) return null;
    try {
      let cleanUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        cleanUrl = `https://${url}`;
      }
      const domain = new URL(cleanUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (error) {
      return null;
    }
  }, []);


  // Toggle password visibility
  const togglePasswordVisibility = useCallback((passwordId) => {
    setShowPasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(passwordId)) {
        newSet.delete(passwordId);
      } else {
        newSet.add(passwordId);
      }
      return newSet;
    });
  }, []);


  // Bulk operations
  const handleBulkDelete = useCallback(async () => {
    if (bulkSelect.size === 0) return;


    const confirmed = window.confirm(
      `Are you sure you want to delete ${bulkSelect.size} selected password(s)?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;


    const deletePromises = Array.from(bulkSelect).map(async (passwordId) => {
      try {
        await deletePassword(passwordId);
        return { success: true, id: passwordId };
      } catch (error) {
        return { success: false, id: passwordId, error };
      }
    });


    const results = await Promise.all(deletePromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;


    if (successful > 0) {
      toast.success(`${successful} password(s) deleted successfully`);
    }
    if (failed > 0) {
      toast.error(`${failed} password(s) failed to delete`);
    }


    setBulkSelect(new Set());
  }, [bulkSelect, deletePassword]);


  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setCategory("");
    setSortBy("name");
    setBulkSelect(new Set());
  }, []);


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            document.querySelector('input[placeholder*="Search"]')?.focus();
            break;
          case 'n':
            e.preventDefault();
            setShowAddForm(true);
            break;
          default:
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setShowAddForm(false);
        setShowEditForm(false);
        setBulkSelect(new Set());
      }
    };


    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  // Statistics calculations
  const stats = useMemo(() => {
    const strengthCounts = passwordArray.reduce((acc, password) => {
      if (password.decryptionError) {
        acc.errors = (acc.errors || 0) + 1;
        return acc;
      }
      
      const { strength } = getPasswordStrength(password.password);
      acc[strength] = (acc[strength] || 0) + 1;
      return acc;
    }, {});


    return {
      total: passwordArray.length,
      filtered: filteredPasswords.length,
      categories: categoriesWithCounts.length,
      ...strengthCounts
    };
  }, [passwordArray, filteredPasswords, categoriesWithCounts, getPasswordStrength]);


  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50 min-h-screen p-3 sm:p-4 md:p-6 pb-20 sm:pb-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-100 via-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-green-200 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">🔐</span>
              <span className="truncate">All Passwords</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-700 mt-1 sm:mt-2">
              <span className="hidden sm:inline">Manage all your saved passwords </span>
              ({stats.total} total)
              {stats.errors > 0 && (
                <span className="ml-2 text-red-600 font-medium">
                  ({stats.errors} errors)
                </span>
              )}
            </p>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            {bulkSelect.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 transition-colors text-sm sm:text-base"
                title="Delete selected passwords"
              >
                🗑️ <span className="hidden xs:inline">Delete</span> ({bulkSelect.size})
              </button>
            )}
            
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-2 transition-all shadow-lg hover:shadow-green-500/25 transform hover:scale-105 font-bold text-sm sm:text-base whitespace-nowrap"
              title="Add new password (Ctrl+N)"
            >
              <span className="text-lg sm:text-xl">+</span>
              <span>Add<span className="hidden sm:inline"> Password</span></span>
            </button>
          </div>
        </div>
      </div>


      {/* Enhanced Statistics Bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-green-100 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600 truncate">Total:</span>
            <span className="font-bold text-blue-600">{stats.total}</span>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-600 truncate">Showing:</span>
            <span className="font-bold text-green-600">{stats.filtered}</span>
          </div>
          
          {stats["Very Strong"] > 0 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-600 rounded-full flex-shrink-0"></div>
              <span className="text-gray-600 truncate hidden sm:inline">Very Strong:</span>
              <span className="text-gray-600 truncate sm:hidden">V.Strong:</span>
              <span className="font-bold text-green-600">{stats["Very Strong"]}</span>
            </div>
          )}
          
          {stats.Strong > 0 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-600 truncate">Strong:</span>
              <span className="font-bold text-green-500">{stats.Strong}</span>
            </div>
          )}
          
          {stats.Medium > 0 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-600 truncate">Medium:</span>
              <span className="font-bold text-yellow-600">{stats.Medium}</span>
            </div>
          )}
          
          {stats.Weak > 0 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-600 truncate">Weak:</span>
              <span className="font-bold text-orange-600">{stats.Weak}</span>
            </div>
          )}
          
          {stats["Very Weak"] > 0 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-600 truncate hidden sm:inline">Very Weak:</span>
              <span className="text-gray-600 truncate sm:hidden">V.Weak:</span>
              <span className="font-bold text-red-600">{stats["Very Weak"]}</span>
            </div>
          )}
        </div>
      </div>


      {/* Enhanced Filters and Search */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-green-100 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          <div className="relative lg:col-span-2">
            <input
              type="text"
              placeholder="Search passwords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-9 sm:pl-10 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm sm:text-base"
            />
            <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base">
              🔍
            </div>
          </div>
          
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm sm:text-base"
          >
            <option value="">All Categories ({stats.total})</option>
            {categoriesWithCounts.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>


          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm sm:text-base"
          >
            <option value="name">Sort by Name</option>
            <option value="username">Sort by Username</option>
            <option value="category">Sort by Category</option>
            <option value="strength">Sort by Strength</option>
            <option value="created">Sort by Created</option>
            <option value="updated">Sort by Updated</option>
          </select>


          <button
            onClick={clearAllFilters}
            className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            🔄 Clear
          </button>
        </div>
      </div>


      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <div className="flex items-center gap-2 text-red-800 text-sm sm:text-base">
            <span className="text-lg sm:text-xl">⚠️</span>
            <span className="font-medium">Error: {error.message}</span>
          </div>
        </div>
      )}


      {/* Passwords List */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-green-100 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 sm:px-6 py-4 sm:py-5 text-white">
          <div className="flex justify-between items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <span>📋</span>
                <span className="truncate">Password Vault</span>
              </h2>
              <p className="text-green-100 mt-1 text-xs sm:text-sm">
                {filteredPasswords.length > 0 
                  ? `Showing ${filteredPasswords.length} of ${stats.total} passwords`
                  : 'No passwords to display'
                }
              </p>
            </div>
            
            {filteredPasswords.length > 0 && (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="px-2 sm:px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                  title="Toggle view mode"
                >
                  {viewMode === 'grid' ? '📋' : '⊞'}
                </button>
              </div>
            )}
          </div>
        </div>


        <div className="p-3 sm:p-4 md:p-6">
          {isLoading ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin h-8 w-8 sm:h-10 sm:w-10 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
              <div className="text-gray-500 font-medium text-sm sm:text-base">Loading passwords...</div>
            </div>
          ) : filteredPasswords.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-3xl sm:text-4xl">🔒</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {stats.total === 0 ? 'No passwords saved yet' : 'No passwords found'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {stats.total === 0 
                  ? 'Add your first password to get started with SecureVault'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {stats.total === 0 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-colors text-sm sm:text-base"
                >
                  Add Your First Password
                </button>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'space-y-3 sm:space-y-4' : 'space-y-2'}>
              {filteredPasswords.map((password, index) => {
                const passwordId = password.id || password._id || index;
                const strengthData = getPasswordStrength(password.password);
                const favicon = getSiteFavicon(password.websiteUrl || password.site);
                const isSelected = bulkSelect.has(passwordId);
                const isPasswordVisible = showPasswords.has(passwordId);
                const isCurrentlyDeleting = isDeleting.has(passwordId);
                
                const strengthConfig = {
                  green: { 
                    color: "text-green-600", 
                    bg: "bg-green-50", 
                    border: "border-green-200",
                    dot: "bg-green-500"
                  },
                  yellow: { 
                    color: "text-yellow-600", 
                    bg: "bg-yellow-50", 
                    border: "border-yellow-200",
                    dot: "bg-yellow-500"
                  },
                  orange: { 
                    color: "text-orange-600", 
                    bg: "bg-orange-50", 
                    border: "border-orange-200",
                    dot: "bg-orange-500"
                  },
                  red: { 
                    color: "text-red-600", 
                    bg: "bg-red-50", 
                    border: "border-red-200",
                    dot: "bg-red-500"
                  }
                };


                const config = strengthConfig[strengthData.color] || strengthConfig.red;
                const siteName = password.siteService || password.siteName || password.site || "Unknown Site";


                return (
                  <div 
                    key={passwordId}
                    className={`group rounded-lg sm:rounded-xl border-2 ${config.border} ${config.bg} p-3 sm:p-4 transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    } ${isCurrentlyDeleting ? 'opacity-50' : 'hover:shadow-md'}`}
                  >
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
                      {/* Selection checkbox and site icon */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newBulkSelect = new Set(bulkSelect);
                            if (e.target.checked) {
                              newBulkSelect.add(passwordId);
                            } else {
                              newBulkSelect.delete(passwordId);
                            }
                            setBulkSelect(newBulkSelect);
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />


                        {/* Site icon */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {favicon ? (
                            <img
                              src={favicon}
                              alt=""
                              className="w-6 h-6 sm:w-8 sm:h-8"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextElementSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <span
                            className={`text-base sm:text-lg font-bold ${config.color} ${favicon ? "hidden" : "flex"}`}
                          >
                            {siteName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>


                      {/* Password info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg truncate">
                          {password.websiteUrl || password.site ? (
                            <a
                              href={password.websiteUrl || password.site}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-green-600 transition-colors"
                              title="Open website"
                            >
                              {siteName}
                            </a>
                          ) : (
                            siteName
                          )}
                          {password.decryptionError && (
                            <span className="ml-1 sm:ml-2 text-red-500 text-xs sm:text-sm font-normal">
                              (Error)
                            </span>
                          )}
                        </div>
                        
                        <div className="text-gray-600 text-xs sm:text-sm truncate mt-0.5">
                          {password.username}
                        </div>


                        {/* Password field */}
                        {!password.decryptionError && (
                          <div className="flex items-center gap-1 sm:gap-2 mt-1">
                            <input
                              type={isPasswordVisible ? "text" : "password"}
                              value={password.password}
                              readOnly
                              className="text-xs bg-transparent border-none p-0 w-20 sm:w-24 text-gray-700 font-mono"
                            />
                            <button
                              onClick={() => togglePasswordVisibility(passwordId)}
                              className="text-gray-400 hover:text-gray-600 text-xs"
                              title={isPasswordVisible ? "Hide password" : "Show password"}
                            >
                              {isPasswordVisible ? "👁️" : "👁️‍🗨️"}
                            </button>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                          {!password.decryptionError && (
                            <span className={`inline-flex items-center gap-1 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium ${config.bg} ${config.color} border ${config.border}`}>
                              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${config.dot}`}></div>
                              <span className="hidden xs:inline">{strengthData.strength}</span>
                              <span className="xs:hidden">{strengthData.strength.charAt(0)}</span>
                              ({strengthData.score}%)
                            </span>
                          )}
                          
                          {password.category && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full truncate max-w-[100px] sm:max-w-none">
                              {password.category}
                            </span>
                          )}
                          
                          {password.createdAt && (
                            <span className="text-xs text-gray-500 hidden sm:inline">
                              {new Date(password.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>


                      {/* Action buttons */}
                      <div className={`flex sm:flex-row flex-col items-center gap-1 transition-opacity flex-shrink-0 ${isCurrentlyDeleting ? 'opacity-50' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}`}>
                        {!password.decryptionError && (
                          <>
                            <button
                              onClick={() => copyToClipboard(password.username, passwordId, "username")}
                              className="p-1.5 sm:p-2 bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 rounded-md sm:rounded-lg transition-all text-sm"
                              title="Copy username"
                              disabled={isCurrentlyDeleting}
                            >
                              👤
                            </button>
                            
                            <button
                              onClick={() => copyToClipboard(password.password, passwordId, "password")}
                              className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all text-sm ${
                                copiedId === passwordId
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600"
                              }`}
                              title="Copy password"
                              disabled={isCurrentlyDeleting}
                            >
                              {copiedId === passwordId ? "✓" : "📋"}
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleEditPassword(password)}
                          className="p-1.5 sm:p-2 bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 rounded-md sm:rounded-lg transition-all text-sm"
                          title="Edit password"
                          disabled={isCurrentlyDeleting || password.decryptionError}
                        >
                          ✏️
                        </button>
                        
                        <button 
                          onClick={() => handleDeletePassword(passwordId, siteName)}
                          className="p-1.5 sm:p-2 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-md sm:rounded-lg transition-all text-sm"
                          title="Delete password"
                          disabled={isCurrentlyDeleting}
                        >
                          {isCurrentlyDeleting ? (
                            <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                          ) : (
                            "🗑️"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>


      {/* Enhanced Add Password Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="w-full max-w-2xl my-auto">
              <PasswordForm
                closeForm={() => setShowAddForm(false)}
                onSave={handleAddPassword}
                initialCategory={category || undefined}
              />
            </div>
          </div>
        </div>
      )}


      {/* Enhanced Edit Password Modal */}
      {showEditForm && editingPassword && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={() => {
              setShowEditForm(false);
              setEditingPassword(null);
            }}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="w-full max-w-2xl my-auto">
              <PasswordForm
                closeForm={() => {
                  setShowEditForm(false);
                  setEditingPassword(null);
                }}
                onSave={handleUpdatePassword}
                initialData={editingPassword}
                isEditing={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default AllPasswordsView;
