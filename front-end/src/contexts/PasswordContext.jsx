import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  setMasterPassword,
  clearMasterPassword,
  encrypt,
  decrypt,
  testCrypto,
  checkCryptoSupport,
  isMasterPasswordSet,  // ✅ ADD THIS
} from "../utils/cryptoUtils";


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const PasswordContext = createContext();

export const usePasswords = () => {
  const context = useContext(PasswordContext);
  if (!context) {
    throw new Error("usePasswords must be used within PasswordProvider");
  }
  return context;
};

export const PasswordProvider = ({ children }) => {
  const { user } = useUser();
  const [passwordArray, setPasswordArray] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cryptoReady, setCryptoReady] = useState(false);

  // Add categories state
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Load passwords from database with decryption
  const loadPasswords = async (forceReload = false) => {
    if (!user?.id || !cryptoReady) {
      console.log(
        "❌ Cannot load passwords - User ID:",
        user?.id,
        "Crypto ready:",
        cryptoReady
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔄 Loading passwords for user:", user.id);

      const response = await fetch(
        `${BACKEND_URL}/api/passwords?userId=${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("📥 Backend response status:", response.status);

      if (response.ok) {
        const passwords = await response.json();
        console.log(
          "📥 Raw passwords from database:",
          passwords.length,
          passwords
        );

        if (passwords.length === 0) {
          console.log("ℹ️ No passwords found in database for user:", user.id);
          setPasswordArray([]);
          return;
        }

        // Decrypt passwords for use in components
        const decryptedPasswords = [];

        for (let i = 0; i < passwords.length; i++) {
          const pass = passwords[i];
          console.log(`🔐 Processing password ${i + 1}/${passwords.length}:`, {
            siteService: pass.siteService,
            hasPassword: !!pass.password,
            hasIv: !!pass.iv,
            passwordType: typeof pass.password,
            isArray: Array.isArray(pass.password),
            userId: pass.userId,
            createdAt: pass.createdAt,
          });

          try {
            let decryptedPassword = pass.password;

            // Check if password is encrypted (has IV and is array format)
            if (pass.iv && Array.isArray(pass.password)) {
              console.log(`🔓 Decrypting password for ${pass.siteService}...`);
              // Validate data before decryption
              if (pass.password.length === 0) {
                throw new Error("Empty encrypted data array");
              }

              if (pass.iv.length === 0) {
                throw new Error("Empty IV array");
              }
              decryptedPassword = await decrypt(
                pass.password,
                pass.iv,
                user.id
              );
              console.log(
                `✅ Successfully decrypted password for ${pass.siteService}`
              );
            } else if (pass.iv && typeof pass.password === "string") {
              // Handle case where password might be JSON string
              try {
                const parsedPassword = JSON.parse(pass.password);
                if (Array.isArray(parsedPassword)) {
                  decryptedPassword = await decrypt(
                    parsedPassword,
                    pass.iv,
                    user.id
                  );
                  console.log(
                    `✅ Successfully decrypted JSON password for ${pass.siteService}`
                  );
                }
              } catch (parseError) {
                console.log(
                  `⚠️ Password for ${pass.siteService} is not JSON, treating as plain text`
                );
              }
            } else {
              console.log(
                `⚠️ Password for ${pass.siteService} appears to be unencrypted`
              );
            }

            const processedPassword = {
              ...pass,
              id: pass._id?.toString() || pass.id,
              password: decryptedPassword,
            };

            decryptedPasswords.push(processedPassword);
          } catch (decryptError) {
            console.error(
              `❌ Failed to decrypt password for ${pass.siteService}:`,
              {
                error: decryptError.message,
                hasIv: !!pass.iv,
                ivLength: pass.iv?.length,
                hasPassword: !!pass.password,
                passwordLength: pass.password?.length,
                passwordType: typeof pass.password,
                userId: pass.userId,
                currentUserId: user.id,
              }
            );

            // Add password with error indicator instead of skipping
            decryptedPasswords.push({
              ...pass,
              id: pass._id?.toString() || pass.id,
              password: "***DECRYPTION_FAILED***",
              decryptionError: true,
            });
          }
        }

        setPasswordArray(decryptedPasswords);
        console.log(
          "✅ Passwords loaded and processed:",
          decryptedPasswords.length
        );

        // Log first password for debugging (without showing actual password)
        if (decryptedPasswords.length > 0) {
          const firstPassword = decryptedPasswords[0];
          console.log("🔍 First password structure:", {
            id: firstPassword.id,
            siteService: firstPassword.siteService,
            username: firstPassword.username,
            category: firstPassword.category,
            hasPassword: !!firstPassword.password,
            passwordLength: firstPassword.password?.length,
            createdAt: firstPassword.createdAt,
          });
        }
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Failed to load passwords:",
          response.status,
          errorText
        );
        setPasswordArray([]);
      }
    } catch (error) {
      console.error("❌ Error loading passwords:", error);
      setPasswordArray([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load categories from database
  const loadCategories = async () => {
    if (!user?.id) return;

    try {
      setCategoriesLoading(true);
      console.log("🔄 Loading categories for user:", user.id);

      const response = await fetch(
        `${BACKEND_URL}/api/categories?userId=${user.id}`
      );

      if (response.ok) {
        const userCategories = await response.json();

        if (userCategories.length === 0) {
          console.log("🔧 No categories found, initializing defaults...");
          const initResponse = await fetch(
            "${BACKEND_URL}/api/categories/initialize",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.id }),
            }
          );

          if (initResponse.ok) {
            const initResult = await initResponse.json();
            const categoriesWithId =
              initResult.categories?.map((cat) => ({
                ...cat,
                id: cat._id?.toString() || cat.id,
              })) || [];
            setCategories(categoriesWithId);
            console.log(
              "✅ Default categories initialized:",
              categoriesWithId.length
            );
          }
        } else {
          const categoriesWithId = userCategories.map((cat) => ({
            ...cat,
            id: cat._id?.toString() || cat.id,
          }));
          setCategories(categoriesWithId);
          console.log("✅ Categories loaded:", categoriesWithId.length);
        }
      } else {
        console.error("❌ Failed to load categories");
        setCategories([]);
      }
    } catch (error) {
      console.error("❌ Error loading categories:", error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Add password with encryption
  const addPassword = async (newPassword) => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    if (
      !newPassword.password ||
      typeof newPassword.password !== "string" ||
      newPassword.password.trim() === ""
    ) {
      throw new Error("Password to encrypt must be a non-empty string");
    }

    if (!cryptoReady) {
      throw new Error(
        "Encryption system not ready. Please wait and try again."
      );
    }

    try {
      console.log("➕ Adding password for user:", user.id);
      console.log("📝 Password data structure:", {
        siteService: newPassword.siteService,
        username: newPassword.username,
        category: newPassword.category,
        hasPassword: !!newPassword.password,
        passwordLength: newPassword.password?.length,
      });

      // Encrypt the password before saving
      console.log("🔐 Starting encryption...");
      const encryptedData = await encrypt(newPassword.password, user.id);
      console.log("✅ Encryption completed:", {
        hasCiphertext: !!encryptedData.ciphertext,
        hasIv: !!encryptedData.iv,
        ciphertextLength: encryptedData.ciphertext?.length,
      });

      const passwordWithUser = {
        ...newPassword,
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress,
        password: encryptedData.ciphertext,
        iv: encryptedData.iv,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("📤 Sending to backend:", {
        ...passwordWithUser,
        password: "[ENCRYPTED]",
        dataSize: JSON.stringify(passwordWithUser).length,
      });

      const response = await fetch("${BACKEND_URL}/api/passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordWithUser),
      });

      console.log("📥 Backend response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (response.ok) {
        const savedPassword = await response.json();
        console.log("✅ Backend returned success:", {
          hasId: !!(savedPassword._id || savedPassword.id),
          hasUserId: !!savedPassword.userId,
        });

        // Add to local state with decrypted password for UI
        const passwordForState = {
          ...savedPassword,
          id: savedPassword._id?.toString() || savedPassword.id,
          password: newPassword.password,
        };

        setPasswordArray((prev) => [passwordForState, ...prev]);
        console.log("✅ Password added to local state");
        return savedPassword;
      } else {
        const errorText = await response.text();
        console.error("❌ Backend error details:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        });

        let errorObj;
        try {
          errorObj = JSON.parse(errorText);
        } catch {
          errorObj = { error: errorText };
        }

        throw new Error(
          `Backend error (${response.status}): ${errorObj.error || errorText}`
        );
      }
    } catch (error) {
      console.error("❌ Complete error in addPassword:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  };

  // Add category to database
  const addCategory = async (newCategory) => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      console.log("➕ Adding category for user:", user.id);

      const categoryWithUser = {
        ...newCategory,
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress,
      };

      const response = await fetch("${BACKEND_URL}/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryWithUser),
      });

      if (response.ok) {
        const savedCategory = await response.json();

        // Add to local state
        const categoryForState = {
          ...savedCategory,
          id: savedCategory._id?.toString() || savedCategory.id,
        };

        setCategories((prev) => [...prev, categoryForState]);
        console.log("✅ Category added successfully");
        return savedCategory;
      } else {
        const errorText = await response.text();
        console.error("❌ Backend error:", errorText);
        throw new Error("Failed to save category");
      }
    } catch (error) {
      console.error("❌ Error adding category:", error);
      throw error;
    }
  };

  // Update password with encryption
  const updatePassword = async (passwordId, updatedData) => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    if (!cryptoReady) {
      throw new Error(
        "Encryption system not ready. Please wait and try again."
      );
    }

    try {
      console.log("✏️ Updating password:", passwordId);

      let dataToSend = { ...updatedData };

      if (updatedData.password) {
        const encryptedData = await encrypt(updatedData.password, user.id);
        dataToSend = {
          ...updatedData,
          password: encryptedData.ciphertext,
          iv: encryptedData.iv,
          updatedAt: new Date().toISOString(),
        };
      }

      const response = await fetch(
        `${BACKEND_URL}/api/passwords/${passwordId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        }
      );

      if (response.ok) {
        const updatedPassword = await response.json();

        setPasswordArray((prev) =>
          prev.map((item) => {
            if (item.id === passwordId || item._id?.toString() === passwordId) {
              return {
                ...item,
                ...updatedData,
                id: item.id,
                updatedAt: new Date().toISOString(),
              };
            }
            return item;
          })
        );

        console.log("✅ Password updated successfully");
        return updatedPassword;
      } else {
        throw new Error("Failed to update password");
      }
    } catch (error) {
      console.error("❌ Error updating password:", error);
      throw error;
    }
  };

  // Update category
  const updateCategory = async (categoryId, updatedData) => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      console.log("✏️ Updating category:", categoryId);

      const response = await fetch(
        `${BACKEND_URL}/api/categories/${categoryId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );

      if (response.ok) {
        setCategories((prev) =>
          prev.map((item) => {
            if (item.id === categoryId || item._id?.toString() === categoryId) {
              return {
                ...item,
                ...updatedData,
                id: item.id,
              };
            }
            return item;
          })
        );

        console.log("✅ Category updated successfully");
      } else {
        throw new Error("Failed to update category");
      }
    } catch (error) {
      console.error("❌ Error updating category:", error);
      throw error;
    }
  };

  // Delete password
  const deletePassword = async (passwordId) => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      console.log("🗑️ Deleting password:", passwordId);

      const response = await fetch(
        `${BACKEND_URL}/api/passwords/${passwordId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (response.ok) {
        setPasswordArray((prev) =>
          prev.filter(
            (item) =>
              item.id !== passwordId && item._id?.toString() !== passwordId
          )
        );
        console.log("✅ Password deleted successfully");
      } else {
        throw new Error("Failed to delete password");
      }
    } catch (error) {
      console.error("❌ Error deleting password:", error);
      throw error;
    }
  };

  // Delete category
  const deleteCategory = async (categoryId) => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      console.log("🗑️ Deleting category:", categoryId);

      const response = await fetch(
        `${BACKEND_URL}/api/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (response.ok) {
        setCategories((prev) =>
          prev.filter(
            (item) =>
              item.id !== categoryId && item._id?.toString() !== categoryId
          )
        );
        console.log("✅ Category deleted successfully");
      } else {
        throw new Error("Failed to delete category");
      }
    } catch (error) {
      console.error("❌ Error deleting category:", error);
      throw error;
    }
  };

  // Utility functions - Define these before contextValue
  const getCategoryCount = (categoryName) => {
    return passwordArray.filter(
      (password) =>
        password.category?.toLowerCase() === categoryName.toLowerCase()
    ).length;
  };

  const getCategoryPasswords = (categoryName) => {
    return passwordArray.filter(
      (password) =>
        password.category?.toLowerCase() === categoryName.toLowerCase()
    );
  };

  const getCategoryUsagePercentage = (categoryName) => {
    const total = passwordArray.length;
    if (total === 0) return 0;
    const categoryCount = getCategoryCount(categoryName);
    return Math.round((categoryCount / total) * 100);
  };

  const getCategoryByName = (categoryName) => {
    return categories.find(
      (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
    );
  };

  // Manual refresh function for testing
  const refreshData = async () => {
    console.log("🔄 Manual refresh triggered");
    if (user?.id && cryptoReady) {
      await Promise.all([loadPasswords(true), loadCategories()]);
    }
  };

  // Initialize crypto and load data when user changes
  // Initialize crypto and load data when user changes
useEffect(() => {
  const initializeCrypto = async () => {
    if (user?.id) {
      try {
        console.log("🔧 Initializing crypto for user:", user.id);

        // Check browser crypto support
        const cryptoSupport = checkCryptoSupport();
        if (!cryptoSupport.supported) {
          throw new Error("Browser does not support required crypto APIs");
        }

        // ✅ WAIT for master password to be set by App.jsx
        // Check if master password is already set
        const maxWait = 5000; // 5 seconds max wait
        const startTime = Date.now();
        
        while (!isMasterPasswordSet() && Date.now() - startTime < maxWait) {
          console.log("⏳ Waiting for master password to be set by App.jsx...");
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (!isMasterPasswordSet()) {
          throw new Error("Master password not set by App.jsx");
        }

        console.log("✅ Master password detected, testing crypto...");

        // Test crypto functions
        const cryptoWorking = await testCrypto();
        if (!cryptoWorking) {
          throw new Error("Crypto functions failed initialization test");
        }

        setCryptoReady(true);
        console.log("✅ Crypto system ready");

        // Load passwords and categories
        console.log("🔄 Loading data...");
        await Promise.all([loadPasswords(), loadCategories()]);
        console.log("✅ All data loading initiated");
      } catch (error) {
        console.error("❌ Failed to initialize crypto:", error);
        setCryptoReady(false);
        setPasswordArray([]);
        setCategories([]);
      }
    } else {
      console.log("🔓 No user found, clearing data");
      clearMasterPassword();
      setCryptoReady(false);
      setPasswordArray([]);
      setCategories([]);
    }
  };

  initializeCrypto();
}, [user?.id]);


  // Additional effect to reload data when crypto becomes ready
  useEffect(() => {
    if (user?.id && cryptoReady && passwordArray.length === 0) {
      console.log("🔄 Crypto ready, reloading passwords...");
      loadPasswords();
    }
  }, [user?.id, cryptoReady]);

  const contextValue = {
    // Password-related state and functions
    passwordArray,
    isLoading,
    cryptoReady,
    loadPasswords,
    addPassword,
    updatePassword,
    deletePassword,

    // Categories-related state and functions
    categories,
    categoriesLoading,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryByName,

    // Utility functions
    getPasswordById: (id) =>
      passwordArray.find((p) => p.id === id || p._id?.toString() === id),
    getPasswordsByCategory: (category) =>
      passwordArray.filter((p) => !category || p.category === category),
    getCategoryCount,
    getCategoryPasswords,
    getCategoryUsagePercentage,
    searchPasswords: (query) =>
      passwordArray.filter(
        (p) =>
          p.siteService?.toLowerCase().includes(query.toLowerCase()) ||
          p.username?.toLowerCase().includes(query.toLowerCase())
      ),
    refreshData, // Add manual refresh function

    // Password analysis utility
    analyzeAllPasswords: () => {
      const analysis = {
        total: passwordArray.length,
        strong: 0,
        moderate: 0,
        weak: 0,
        veryWeak: 0,
        compromised: 0,
      };

      passwordArray.forEach((item) => {
        if (item.isCompromised) {
          analysis.compromised++;
        } else if (item.strength) {
          switch (item.strength) {
            case "Very Strong":
              analysis.strong++;
              break;
            case "Strong":
              analysis.strong++;
              break;
            case "Moderate":
              analysis.moderate++;
              break;
            case "Weak":
              analysis.weak++;
              break;
            case "Very Weak":
              analysis.veryWeak++;
              break;
          }
        }
      });

      return analysis;
    },
  };

  return (
    <PasswordContext.Provider value={contextValue}>
      {children}
    </PasswordContext.Provider>
  );
};
