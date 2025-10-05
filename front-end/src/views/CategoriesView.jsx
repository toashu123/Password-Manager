import React, { useState, useEffect } from "react";
import { usePasswords } from "../contexts/PasswordContext";
import PasswordForm from "../components/shared/PasswordForm";
import { toast } from "react-toastify";


const CategoriesView = () => {
  const {
    passwordArray,
    deletePassword,
    addPassword,
    categories,
    categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  } = usePasswords();


  // State management
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedCategoryForPassword, setSelectedCategoryForPassword] =
    useState(null);
  const [showCategoryPasswords, setShowCategoryPasswords] = useState(false);
  const [selectedCategoryPasswords, setSelectedCategoryPasswords] =
    useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);


  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#6EE7B7",
    icon: "🛒",
    description: "",
    tags: [],
  });


  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");


  // Available icons for category selection
  const availableIcons = [
    "📁",
    "🏦",
    "🎬",
    "👤",
    "🛒",
    "📱",
    "💼",
    "🎮",
    "📚",
    "🏠",
    "✈️",
    "🍕",
    "🏥",
    "🎓",
    "💻",
    "🎵",
    "🏃",
    "🎨",
    "📸",
    "🔧",
    "🔒",
    "🌐",
    "💳",
    "📧",
    "🔑",
    "🎯",
    "⚡",
    "🌟",
    "🔥",
    "💎",
  ];


  // Green color palette
  const greenColorOptions = [
    "#059669",
    "#10B981",
    "#34D399",
    "#6EE7B7",
    "#16A34A",
    "#22C55E",
    "#4ADE80",
    "#86EFAC",
    "#065F46",
    "#047857",
    "#14B8A6",
    "#2DD4BF",
    "#5EEAD4",
    "#99F6E4",
    "#0D9488",
  ];


  // Utility functions
  const getLocalCategoryCount = (categoryName) => {
    return passwordArray.filter(
      (password) =>
        password.category?.toLowerCase() === categoryName.toLowerCase()
    ).length;
  };


  const getLocalCategoryPasswords = (categoryName) => {
    return passwordArray.filter(
      (password) =>
        password.category?.toLowerCase() === categoryName.toLowerCase()
    );
  };


  const getCategorySecurityScore = (categoryName) => {
    const passwords = getLocalCategoryPasswords(categoryName);
    if (passwords.length === 0) return 0;
    const totalScore = passwords.reduce(
      (sum, pwd) => sum + (pwd.securityScore || 0),
      0
    );
    return Math.round(totalScore / passwords.length);
  };


  const getWeakPasswordsCount = (categoryName) => {
    const passwords = getLocalCategoryPasswords(categoryName);
    return passwords.filter((pwd) => pwd.isWeak).length;
  };


  // Filtering and sorting
  const getFilteredAndSortedCategories = () => {
    let filtered = categories.filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase());


      if (!matchesSearch) return false;


      const passwordCount = getLocalCategoryCount(category.name);
      switch (filterBy) {
        case "high-usage":
          return passwordCount >= 5;
        case "low-usage":
          return passwordCount > 0 && passwordCount < 5;
        case "empty":
          return passwordCount === 0;
        default:
          return true;
      }
    });


    filtered.sort((a, b) => {
      switch (sortBy) {
        case "usage":
          return getLocalCategoryCount(b.name) - getLocalCategoryCount(a.name);
        case "recent":
          return (
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0)
          );
        case "alphabetical":
          return a.name.localeCompare(b.name);
        default:
          return a.name.localeCompare(b.name);
      }
    });


    return filtered;
  };


  // Handlers
  const handleAddPasswordToCategory = (category) => {
    setSelectedCategoryForPassword(category);
    setShowPasswordForm(true);
  };


  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      color: category.color || "#6EE7B7",
      icon: category.icon || "🛒",
      description: category.description || "",
      tags: category.tags || [],
    });
    setShowEditCategory(true);
  };


  const handleViewPasswords = (category) => {
    setSelectedCategoryPasswords(category);
    setShowCategoryPasswords(true);
  };


  const handleCopyCategory = async (category) => {
    try {
      await addCategory({
        name: `${category.name} (Copy)`,
        color: category.color,
        icon: category.icon,
        description: category.description,
        tags: category.tags || [],
      });
      toast.success(`Category "${category.name}" duplicated!`);
    } catch (error) {
      toast.error("Failed to duplicate category");
    }
  };


  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };


  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;


    try {
      await deleteCategory(categoryToDelete.id || categoryToDelete._id);
      toast.success(`Category "${categoryToDelete.name}" deleted!`);
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };


  const handleSaveCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required!");
      return;
    }


    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id || editingCategory._id, {
          ...newCategory,
          tags:
            typeof newCategory.tags === "string"
              ? newCategory.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter((t) => t)
              : newCategory.tags,
        });
        toast.success("Category updated successfully!");
      } else {
        await addCategory({
          ...newCategory,
          tags:
            typeof newCategory.tags === "string"
              ? newCategory.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter((t) => t)
              : newCategory.tags,
        });
        toast.success("Category added successfully!");
      }
      closeAllModals();
    } catch (error) {
      toast.error(
        editingCategory ? "Failed to update category" : "Failed to add category"
      );
    }
  };


  const closeAllModals = () => {
    setShowAddCategory(false);
    setShowEditCategory(false);
    setShowPasswordForm(false);
    setShowCategoryPasswords(false);
    setShowDeleteConfirm(false);
    setEditingCategory(null);
    setSelectedCategoryForPassword(null);
    setSelectedCategoryPasswords(null);
    setCategoryToDelete(null);
    setNewCategory({
      name: "",
      color: "#6EE7B7",
      icon: "🛒",
      description: "",
      tags: [],
    });
  };


  if (categoriesLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 sm:h-12 sm:w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4"></div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
            Loading Categories...
          </h2>
        </div>
      </div>
    );
  }


  const filteredCategories = getFilteredAndSortedCategories();


  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 bg-gray-50 min-h-screen p-3 sm:p-4 md:p-6 pb-20 sm:pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-100 via-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-green-200 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 sm:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl md:text-4xl">📂</span>
              <span className="truncate">Categories</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-700 mt-1 sm:mt-2">
              <span className="hidden sm:inline">Organize your </span>
              {passwordArray.length} password{passwordArray.length !== 1 ? "s" : ""} 
              <span className="hidden sm:inline"> into </span>
              <span className="sm:hidden"> • </span>
              {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
            </p>
          </div>
          <button
            onClick={() => setShowAddCategory(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg transform hover:scale-105 font-bold text-sm sm:text-base whitespace-nowrap"
          >
            <span className="text-lg">+</span>
            <span>Add Category</span>
          </button>
        </div>
      </div>


      {/* Search and Filter */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2 border-green-100 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch lg:items-center lg:justify-between">
          <div className="flex-1 lg:max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-0 text-sm sm:text-base"
              />
              <span className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base">
                🔍
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 text-sm sm:text-base"
            >
              <option value="name">Sort by Name</option>
              <option value="usage">Sort by Usage</option>
              <option value="recent">Sort by Recent</option>
              <option value="alphabetical">Sort A-Z</option>
            </select>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 text-sm sm:text-base"
            >
              <option value="all">All Categories</option>
              <option value="high-usage">High Usage (5+)</option>
              <option value="low-usage">Low Usage (1-4)</option>
              <option value="empty">Empty Categories</option>
            </select>
          </div>
        </div>
      </div>


      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {filteredCategories.map((category) => {
          const passwordCount = getLocalCategoryCount(category.name);
          const usagePercentage = Math.round(
            (passwordCount / Math.max(passwordArray.length, 1)) * 100
          );
          const securityScore = getCategorySecurityScore(category.name);
          const weakPasswords = getWeakPasswordsCount(category.name);


          return (
            <div
              key={category.id || category._id}
              className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-green-100 hover:border-green-300 transition-all group hover:shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg border-2"
                  style={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                    borderColor: `${category.color}40`,
                  }}
                >
                  {category.icon}
                </div>
                <div className="flex gap-1">
                  {securityScore > 0 && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        securityScore >= 80
                          ? "bg-green-500"
                          : securityScore >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      title={`${securityScore}% secure`}
                    ></span>
                  )}
                  {weakPasswords > 0 && (
                    <span
                      className="w-2 h-2 rounded-full bg-red-500"
                      title={`${weakPasswords} weak passwords`}
                    ></span>
                  )}
                </div>
              </div>


              {/* Info */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-gray-900 font-bold text-base sm:text-lg md:text-xl mb-1 truncate">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {passwordCount} password{passwordCount !== 1 ? "s" : ""}
                  </p>
                  {category.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>


                {/* Usage Bar */}
                <div className="w-full">
                  <div className="flex justify-between text-xs text-gray-500 mb-1 sm:mb-2">
                    <span>Usage</span>
                    <span className="font-bold">{usagePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div
                      className="h-1.5 sm:h-2 rounded-full transition-all"
                      style={{
                        backgroundColor: category.color,
                        width: `${usagePercentage}%`,
                      }}
                    ></div>
                  </div>
                </div>


                {/* Color indicator */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-200 flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-xs text-gray-500 font-mono truncate">
                    {category.color}
                  </span>
                </div>
              </div>


              {/* Action Buttons */}
              <div className="mt-4 sm:mt-5 md:mt-6 pt-3 sm:pt-4 border-t border-gray-200 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(category);
                    }}
                    className="bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs py-1.5 sm:py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-1"
                  >
                    <span className="hidden xs:inline">✏️</span> Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewPasswords(category);
                    }}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-600 text-xs py-1.5 sm:py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-1"
                  >
                    <span className="hidden xs:inline">👁️</span> View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCategory(category);
                    }}
                    className="bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs py-1.5 sm:py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-1"
                  >
                    <span className="hidden xs:inline">📋</span> Copy
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category);
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-600 text-xs py-1.5 sm:py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-1"
                    title="Delete category"
                  >
                    <span className="hidden xs:inline">🗑️</span> Delete
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddPasswordToCategory(category);
                  }}
                  className="w-full bg-green-100 hover:bg-green-200 text-green-700 text-xs sm:text-sm py-1.5 sm:py-2 rounded-lg transition-colors font-medium"
                >
                  + Add Password
                </button>
              </div>
            </div>
          );
        })}
      </div>


      {/* Empty State */}
      {filteredCategories.length === 0 && categories.length === 0 && (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl border-2 border-green-100 px-4">
          <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">📂</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            No Categories Yet
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Create your first category to organize your passwords
          </p>
          <button
            onClick={() => setShowAddCategory(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-colors font-medium text-sm sm:text-base"
          >
            Add Your First Category
          </button>
        </div>
      )}


      {/* Add/Edit Category Modal */}
      {(showAddCategory || showEditCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate pr-4">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={closeAllModals}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl flex-shrink-0"
              >
                ✕
              </button>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              {/* Left Column */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-0 text-sm sm:text-base"
                    placeholder="e.g., Shopping, Banking"
                    maxLength={30}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newCategory.name.length}/30 characters
                  </p>
                </div>


                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-0 resize-none text-sm sm:text-base"
                    placeholder="Describe this category (optional)"
                    rows="3"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newCategory.description.length}/100 characters
                  </p>
                </div>


                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={
                      Array.isArray(newCategory.tags)
                        ? newCategory.tags.join(", ")
                        : newCategory.tags
                    }
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, tags: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-0 text-sm sm:text-base"
                    placeholder="Enter tags separated by commas"
                  />
                </div>
              </div>


              {/* Right Column */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Choose Icon
                  </label>
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-2 max-h-40 sm:max-h-48 overflow-y-auto p-2 border-2 border-gray-200 rounded-lg sm:rounded-xl">
                    {availableIcons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewCategory({ ...newCategory, icon })}
                        className={`w-8 h-8 sm:w-10 sm:h-10 text-xl sm:text-2xl rounded-lg transition-all ${
                          newCategory.icon === icon
                            ? "bg-green-500 text-white scale-110 shadow-lg"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Choose Color
                  </label>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {greenColorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setNewCategory({ ...newCategory, color })
                        }
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg transition-all ${
                          newCategory.color === color
                            ? "ring-4 ring-gray-400 scale-110"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-center gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded flex-shrink-0"
                      style={{ backgroundColor: newCategory.color }}
                    ></div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700">
                        Custom Color
                      </p>
                      <p className="text-xs text-gray-500 font-mono truncate">
                        {newCategory.color}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Preview */}
            <div className="mt-4 sm:mt-5 md:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
              <p className="text-sm font-bold text-gray-700 mb-2 sm:mb-3">Preview:</p>
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-green-100 inline-block">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0"
                    style={{
                      backgroundColor: `${newCategory.color}20`,
                      color: newCategory.color,
                    }}
                  >
                    {newCategory.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                      {newCategory.name || "Category Name"}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {newCategory.description || "No description"}
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {/* Actions */}
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-5 md:mt-6">
              <button
                onClick={closeAllModals}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={!newCategory.name.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                {editingCategory ? "Update" : "Add"}<span className="hidden sm:inline"> Category</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Password Form Modal */}
      {showPasswordForm && selectedCategoryForPassword && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-60"
            style={{ zIndex: 9998 }}
            onClick={closeAllModals}
          ></div>
          <div
            className="fixed inset-0 flex items-center justify-center p-3 sm:p-4"
            style={{ zIndex: 9999 }}
          >
            <div className="w-full max-w-lg">
              <PasswordForm
                closeForm={closeAllModals}
                onSave={() => {}}
                initialCategory={selectedCategoryForPassword?.name}
              />
            </div>
          </div>
        </>
      )}


      {/* View Passwords Modal */}
      {showCategoryPasswords && selectedCategoryPasswords && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                {selectedCategoryPasswords.icon}{" "}
                {selectedCategoryPasswords.name}
                <span className="hidden sm:inline"> Passwords</span>
              </h3>
              <button
                onClick={closeAllModals}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl flex-shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {getLocalCategoryPasswords(selectedCategoryPasswords.name).map(
                (pwd) => (
                  <div
                    key={pwd.id}
                    className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {pwd.siteService}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{pwd.username}</p>
                    <span
                      className={`text-xs px-2 py-0.5 sm:py-1 rounded-full inline-block mt-1 ${
                        pwd.isWeak
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {pwd.strength}
                    </span>
                  </div>
                )
              )}
              {getLocalCategoryPasswords(selectedCategoryPasswords.name)
                .length === 0 && (
                <p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
                  No passwords in this category yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
              Delete Category?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Are you sure you want to delete "{categoryToDelete.name}"? This
              action cannot be undone.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default CategoriesView;
