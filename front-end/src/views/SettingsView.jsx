import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { usePasswords } from "../contexts/PasswordContext";
import { toast } from "react-toastify";

const SettingsView = () => {
  const { user } = useUser();
  const { 
    passwordArray, 
    deletePassword, 
    refreshData,
    error,
    cryptoReady 
  } = usePasswords();
  
  // Settings state with better defaults
  const [settings, setSettings] = useState({
    // Security Settings
    sessionTimeout: 30,
    autoLock: true,
    twoFactorAuth: false,
    passwordVisibility: false,
    encryptionStrength: 'high',
    
    // Backup & Sync
    autoBackup: true,
    backupFrequency: 'daily',
    cloudSync: false,
    maxBackups: 5,
    lastBackup: null,
    
    // Notifications
    weakPasswordAlerts: true,
    breachAlerts: true,
    expirationReminders: true,
    securityUpdates: true,
    emailNotifications: true,
    
    // Appearance
    theme: 'green',
    darkMode: false,
    compactView: false,
    animations: true,
    fontSize: 'medium',
    
    // Privacy
    analytics: false,
    crashReports: true,
    telemetry: false,
    clearClipboard: true,
    clearClipboardTime: 30,
    
    // Advanced
    passwordGenerator: {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true,
      excludeAmbiguous: false
    }
  });

  // UI State
  const [activeTab, setActiveTab] = useState('security');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('encrypted-json');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(`secureVaultSettings_${user?.id}`);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({
          ...prev,
          ...parsed,
          passwordGenerator: {
            ...prev.passwordGenerator,
            ...parsed.passwordGenerator
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings. Using defaults.');
    }
  }, [user?.id]);

  // Save settings
  const saveSettings = useCallback((newSettings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem(`secureVaultSettings_${user?.id}`, JSON.stringify(newSettings));
      toast.success('Settings saved successfully!', {
        position: "bottom-right",
        autoClose: 2000
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings. Please try again.');
    }
  }, [user?.id]);

  // Handle setting change
  const handleSettingChange = useCallback((category, setting, value) => {
    setSettings(prev => {
      let newSettings = { ...prev };
      
      if (category === 'passwordGenerator') {
        newSettings.passwordGenerator = { 
          ...prev.passwordGenerator, 
          [setting]: value 
        };
        
        if (setting === 'length') {
          const length = Math.max(8, Math.min(128, value));
          newSettings.passwordGenerator.length = length;
        }
      } else if (typeof prev[category] === 'object' && prev[category] !== null) {
        newSettings[category] = { ...prev[category], [setting]: value };
      } else {
        newSettings[setting] = value;
      }
      
      if (setting === 'theme' || setting === 'darkMode') {
        applyTheme(setting === 'darkMode' ? value : undefined, setting === 'theme' ? value : undefined);
      }
      
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  // Apply theme
  const applyTheme = useCallback((darkMode, theme) => {
    const isDark = darkMode ?? settings.darkMode;
    const currentTheme = theme ?? settings.theme;
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [settings.darkMode, settings.theme]);

  // Export data
  const exportData = useCallback(async () => {
    if (!cryptoReady) {
      toast.error('Encryption system not ready. Please wait and try again.');
      return;
    }

    setIsExporting(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      let exportData;
      
      switch (exportFormat) {
        case 'encrypted-json':
          exportData = {
            passwords: passwordArray.map(p => ({
              ...p,
              password: '[ENCRYPTED]',
              notes: p.notes || '',
              category: p.category || 'Personal',
              strength: p.strength || 'Unknown',
              createdAt: p.createdAt,
              updatedAt: p.updatedAt
            })),
            settings: {
              ...settings,
              sessionTimeout: undefined,
              twoFactorAuth: undefined
            },
            metadata: {
              exportDate: new Date().toISOString(),
              version: '2.0',
              userEmail: user?.primaryEmailAddress?.emailAddress,
              totalPasswords: passwordArray.length,
              encrypted: true
            }
          };
          break;
          
        case 'csv-metadata':
          const csvHeaders = 'Site,Username,Category,Strength,Notes,Created Date,Updated Date\n';
          const csvData = passwordArray.map(p => 
            `"${(p.siteService || p.siteName || '').replace(/"/g, '""')}",` +
            `"${(p.username || '').replace(/"/g, '""')}",` +
            `"${(p.category || 'Personal').replace(/"/g, '""')}",` +
            `"${p.strength || 'Unknown'}",` +
            `"${(p.notes || '').replace(/"/g, '""')}",` +
            `"${p.createdAt || ''}",` +
            `"${p.updatedAt || ''}"`
          ).join('\n');
          
          const blob = new Blob([csvHeaders + csvData], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `securevault-metadata-${timestamp}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          
          setShowExportModal(false);
          toast.success('Metadata exported successfully!');
          return;
          
        case 'settings-only':
          exportData = {
            settings: settings,
            metadata: {
              exportDate: new Date().toISOString(),
              version: '2.0',
              type: 'settings-only'
            }
          };
          break;
          
        default:
          throw new Error('Invalid export format');
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `securevault-${exportFormat}-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setShowExportModal(false);
      toast.success(`Data exported successfully!`);
      
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, passwordArray, settings, user, cryptoReady]);

  // Delete all data
  const deleteAllData = useCallback(async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete everything') {
      toast.error('Please type "delete everything" to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const deletePromises = passwordArray.map(async (password) => {
        try {
          await deletePassword(password.id || password._id);
          return { success: true, id: password.id };
        } catch (error) {
          return { success: false, id: password.id, error };
        }
      });
      
      const results = await Promise.all(deletePromises);
      const failed = results.filter(r => !r.success).length;
      
      localStorage.removeItem(`secureVaultSettings_${user?.id}`);
      
      const defaultSettings = {
        sessionTimeout: 30,
        autoLock: true,
        twoFactorAuth: false,
        passwordVisibility: false,
        encryptionStrength: 'high',
        autoBackup: true,
        backupFrequency: 'daily',
        cloudSync: false,
        maxBackups: 5,
        weakPasswordAlerts: true,
        breachAlerts: true,
        expirationReminders: true,
        securityUpdates: true,
        theme: 'green',
        darkMode: false,
        compactView: false,
        animations: true,
        fontSize: 'medium',
        analytics: false,
        crashReports: true,
        telemetry: false,
        clearClipboard: true,
        clearClipboardTime: 30,
        passwordGenerator: {
          length: 16,
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: true,
          excludeSimilar: true,
          excludeAmbiguous: false
        }
      };
      
      setSettings(defaultSettings);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      
      if (failed > 0) {
        toast.warning(`Deleted most data, but ${failed} passwords failed to delete`);
      } else {
        toast.success('All data has been deleted successfully!');
      }
      
      if (refreshData) {
        refreshData();
      }
      
    } catch (error) {
      console.error('Failed to delete data:', error);
      toast.error('Failed to delete all data. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmation, passwordArray, deletePassword, user?.id, refreshData]);

  // Import functionality
  const handleImport = useCallback(async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      
      if (!data.settings && !data.passwords) {
        throw new Error('Invalid import file format');
      }
      
      if (data.settings) {
        const importedSettings = {
          ...settings,
          ...data.settings,
          passwordGenerator: {
            ...settings.passwordGenerator,
            ...data.settings.passwordGenerator
          }
        };
        saveSettings(importedSettings);
      }
      
      setShowImportModal(false);
      setImportFile(null);
      toast.success('Settings imported successfully!');
      
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  }, [importFile, settings, saveSettings]);

  // Create backup
  const createBackup = useCallback(async () => {
    try {
      const backup = {
        passwords: passwordArray,
        settings: settings,
        timestamp: new Date().toISOString()
      };
      
      const timestamp = new Date().toISOString().split('T')[0];
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `securevault-backup-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      const newSettings = {
        ...settings,
        lastBackup: new Date().toISOString()
      };
      saveSettings(newSettings);
      
      toast.success('Backup created successfully!');
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Failed to create backup');
    }
  }, [passwordArray, settings, saveSettings]);

  // Memoized tab configuration
  const tabs = useMemo(() => [
    { id: 'security', name: 'Security', icon: '🔒', color: 'red' },
    { id: 'backup', name: 'Backup & Sync', icon: '☁️', color: 'blue' },
    { id: 'notifications', name: 'Notifications', icon: '🔔', color: 'yellow' },
    { id: 'appearance', name: 'Appearance', icon: '🎨', color: 'purple' },
    { id: 'privacy', name: 'Privacy', icon: '🛡️', color: 'gray' },
    { id: 'advanced', name: 'Advanced', icon: '⚙️', color: 'green' }
  ], []);

  // Statistics
  const stats = useMemo(() => {
    const strengths = passwordArray.reduce((acc, p) => {
      const strength = p.strength || 'Unknown';
      acc[strength] = (acc[strength] || 0) + 1;
      return acc;
    }, {});

    return {
      total: passwordArray.length,
      strengths,
      weakCount: (strengths['Weak'] || 0) + (strengths['Very Weak'] || 0),
      strongCount: (strengths['Strong'] || 0) + (strengths['Very Strong'] || 0)
    };
  }, [passwordArray]);

  // Reusable components
  const ToggleSwitch = useCallback(({ enabled, onChange, label, description, disabled = false }) => (
    <div className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-1 pr-4">
        <h4 className={`text-sm font-semibold ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
          {label}
        </h4>
        {description && (
          <p className={`text-xs mt-1 ${disabled ? 'text-gray-300' : 'text-gray-600'}`}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
          disabled 
            ? 'bg-gray-200 cursor-not-allowed' 
            : enabled 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-gray-300 hover:bg-gray-400'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  ), []);

  const SliderInput = useCallback(({ value, onChange, min, max, label, unit, disabled = false }) => (
    <div className="py-3 px-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
        <h4 className={`text-sm font-semibold ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
          {label}
        </h4>
        <span className={`text-sm px-2 py-1 rounded-lg font-medium ${
          disabled ? 'text-gray-400 bg-gray-100' : 'text-green-700 bg-green-100'
        }`}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => !disabled && onChange(parseInt(e.target.value))}
        disabled={disabled}
        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #10b981 0%, #10b981 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
        }}
      />
    </div>
  ), []);

  // Test password generator
  const testPasswordGenerator = useCallback(() => {
    try {
      const { length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar } = settings.passwordGenerator;
      
      const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lowercase = "abcdefghijklmnopqrstuvwxyz";
      const numbers = "0123456789";
      const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
      
      let charset = "";
      let password = "";
      
      if (includeLowercase) charset += lowercase;
      if (includeUppercase) charset += uppercase;
      if (includeNumbers) charset += numbers;
      if (includeSymbols) charset += symbols;
      
      if (excludeSimilar) {
        charset = charset.replace(/[0O1lI]/g, '');
      }
      
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      
      navigator.clipboard.writeText(password);
      
      toast.success(`Test password generated and copied! Length: ${password.length}`, {
        position: "bottom-right",
        autoClose: 3000
      });
    } catch (error) {
      console.error('Password generation failed:', error);
      toast.error('Failed to generate test password');
    }
  }, [settings.passwordGenerator]);

  return (
    <div className="space-y-4 sm:space-y-6 bg-gray-50 min-h-screen p-3 sm:p-4 md:p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-100 via-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-green-200 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl">⚙️</span>
              <span>Settings</span>
            </h1>
            <p className="text-gray-700 mt-2 text-sm sm:text-base">
              Customize your SecureVault experience
            </p>
            
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-blue-600">{stats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Strong:</span>
                <span className="font-bold text-green-600">{stats.strongCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Weak:</span>
                <span className="font-bold text-red-600">{stats.weakCount}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-3">
            <button 
              onClick={() => setShowImportModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all shadow-lg font-medium text-xs sm:text-sm"
            >
              <span>📤</span>
              <span className="hidden sm:inline">Import</span>
            </button>
            <button 
              onClick={() => setShowExportModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all shadow-lg font-medium text-xs sm:text-sm"
            >
              <span>📥</span>
              <span className="hidden sm:inline">Export</span>
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-2 transition-all shadow-lg font-medium text-xs sm:text-sm"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
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

      {/* Main Settings Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-green-100 shadow-lg overflow-hidden lg:sticky lg:top-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 sm:px-4 py-2 sm:py-3 text-white">
              <h3 className="font-bold flex items-center gap-2 text-sm sm:text-base">
                <span>🗂️</span>
                Categories
              </h3>
            </div>
            <div className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl mb-1 transition-all flex items-center gap-2 sm:gap-3 font-medium text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'bg-green-100 text-green-800 border-l-4 border-green-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                >
                  <span className="text-base sm:text-lg">{tab.icon}</span>
                  <span className="flex-1">{tab.name}</span>
                  {activeTab === tab.id && (
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-green-100 shadow-lg">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 sm:px-6 py-3 sm:py-4 text-white">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 sm:gap-3">
                <span>{tabs.find(tab => tab.id === activeTab)?.icon}</span>
                <span>{tabs.find(tab => tab.id === activeTab)?.name}</span>
              </h2>
              <p className="text-green-100 text-xs sm:text-sm mt-1">
                Manage your {tabs.find(tab => tab.id === activeTab)?.name.toLowerCase()} preferences
              </p>
            </div>

            <div className="p-4 sm:p-6">
              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 sm:p-6 border border-red-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-lg sm:text-xl">🔒</span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-red-900">Security Configuration</h3>
                        <p className="text-red-700 text-xs sm:text-sm">Protect your digital vault</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <SliderInput
                        value={settings.sessionTimeout}
                        onChange={(value) => handleSettingChange('security', 'sessionTimeout', value)}
                        min={5}
                        max={120}
                        label="Session Timeout"
                        unit="minutes"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.autoLock}
                        onChange={(value) => handleSettingChange('security', 'autoLock', value)}
                        label="Auto-Lock Vault"
                        description="Automatically lock when inactive for security"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.twoFactorAuth}
                        onChange={(value) => handleSettingChange('security', 'twoFactorAuth', value)}
                        label="Two-Factor Authentication"
                        description="Add an extra layer of security to your account"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.passwordVisibility}
                        onChange={(value) => handleSettingChange('security', 'passwordVisibility', value)}
                        label="Show Passwords by Default"
                        description="Display passwords in plain text (not recommended)"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Backup & Sync Settings */}
              {activeTab === 'backup' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-lg sm:text-xl">☁️</span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-blue-900">Backup & Sync Settings</h3>
                        <p className="text-blue-700 text-xs sm:text-sm">Manage your data backups</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <ToggleSwitch
                        enabled={settings.autoBackup}
                        onChange={(value) => handleSettingChange('backup', 'autoBackup', value)}
                        label="Automatic Backups"
                        description="Regularly backup your encrypted data"
                      />
                      
                      <div className="py-3 px-2">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Backup Frequency</h4>
                        <select
                          value={settings.backupFrequency}
                          onChange={(e) => handleSettingChange('backup', 'backupFrequency', e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 text-sm sm:text-base"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <SliderInput
                        value={settings.maxBackups}
                        onChange={(value) => handleSettingChange('backup', 'maxBackups', value)}
                        min={1}
                        max={20}
                        label="Maximum Backup Count"
                        unit="backups"
                      />
                      
                      {settings.lastBackup && (
                        <div className="bg-blue-100 rounded-lg p-3">
                          <p className="text-xs text-blue-800">
                            <strong>Last Backup:</strong> {new Date(settings.lastBackup).toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      <button
                        onClick={createBackup}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
                      >
                        💾 Create Backup Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 sm:p-6 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-yellow-600 text-lg sm:text-xl">🔔</span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-yellow-900">Notification Preferences</h3>
                        <p className="text-yellow-700 text-xs sm:text-sm">Stay informed about security alerts</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <ToggleSwitch
                        enabled={settings.weakPasswordAlerts}
                        onChange={(value) => handleSettingChange('notifications', 'weakPasswordAlerts', value)}
                        label="Weak Password Alerts"
                        description="Get notified when you have weak passwords"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.breachAlerts}
                        onChange={(value) => handleSettingChange('notifications', 'breachAlerts', value)}
                        label="Breach Alerts"
                        description="Alert me if my passwords appear in data breaches"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.expirationReminders}
                        onChange={(value) => handleSettingChange('notifications', 'expirationReminders', value)}
                        label="Expiration Reminders"
                        description="Remind me to change old passwords"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.securityUpdates}
                        onChange={(value) => handleSettingChange('notifications', 'securityUpdates', value)}
                        label="Security Updates"
                        description="Notify me about security updates and features"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.emailNotifications}
                        onChange={(value) => handleSettingChange('notifications', 'emailNotifications', value)}
                        label="Email Notifications"
                        description="Send notifications to my email"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 text-lg sm:text-xl">🎨</span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-purple-900">Appearance Settings</h3>
                        <p className="text-purple-700 text-xs sm:text-sm">Customize the look and feel</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="py-3 px-2">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Theme Color</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['green', 'blue', 'purple', 'red'].map(color => (
                            <button
                              key={color}
                              onClick={() => handleSettingChange('appearance', 'theme', color)}
                              className={`py-2 px-3 sm:px-4 rounded-lg font-medium transition-all text-sm ${
                                settings.theme === color
                                  ? `bg-${color}-500 text-white ring-4 ring-${color}-300`
                                  : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
                              }`}
                            >
                              {color.charAt(0).toUpperCase() + color.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <ToggleSwitch
                        enabled={settings.darkMode}
                        onChange={(value) => handleSettingChange('appearance', 'darkMode', value)}
                        label="Dark Mode"
                        description="Switch to dark theme for better night viewing"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.compactView}
                        onChange={(value) => handleSettingChange('appearance', 'compactView', value)}
                        label="Compact View"
                        description="Show more items in less space"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.animations}
                        onChange={(value) => handleSettingChange('appearance', 'animations', value)}
                        label="Enable Animations"
                        description="Show smooth transitions and effects"
                      />
                      
                      <div className="py-3 px-2">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Font Size</h4>
                        <select
                          value={settings.fontSize}
                          onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-0 text-sm sm:text-base"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-lg sm:text-xl">🛡️</span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Privacy Settings</h3>
                        <p className="text-gray-700 text-xs sm:text-sm">Control your data and privacy</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <ToggleSwitch
                        enabled={settings.clearClipboard}
                        onChange={(value) => handleSettingChange('privacy', 'clearClipboard', value)}
                        label="Auto-Clear Clipboard"
                        description="Automatically clear copied passwords from clipboard"
                      />
                      
                      {settings.clearClipboard && (
                        <SliderInput
                          value={settings.clearClipboardTime}
                          onChange={(value) => handleSettingChange('privacy', 'clearClipboardTime', value)}
                          min={10}
                          max={120}
                          label="Clipboard Clear Time"
                          unit="seconds"
                        />
                      )}
                      
                      <ToggleSwitch
                        enabled={settings.analytics}
                        onChange={(value) => handleSettingChange('privacy', 'analytics', value)}
                        label="Analytics"
                        description="Help improve the app by sharing anonymous usage data"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.crashReports}
                        onChange={(value) => handleSettingChange('privacy', 'crashReports', value)}
                        label="Crash Reports"
                        description="Automatically send crash reports to help fix bugs"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.telemetry}
                        onChange={(value) => handleSettingChange('privacy', 'telemetry', value)}
                        label="Telemetry Data"
                        description="Share performance and feature usage data"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Settings */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-lg sm:text-xl">⚙️</span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-green-900">Password Generator Settings</h3>
                        <p className="text-green-700 text-xs sm:text-sm">Configure default password generation</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <SliderInput
                        value={settings.passwordGenerator.length}
                        onChange={(value) => handleSettingChange('passwordGenerator', 'length', value)}
                        min={8}
                        max={128}
                        label="Default Password Length"
                        unit="characters"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.passwordGenerator.includeUppercase}
                        onChange={(value) => handleSettingChange('passwordGenerator', 'includeUppercase', value)}
                        label="Include Uppercase Letters"
                        description="A-Z (recommended for security)"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.passwordGenerator.includeLowercase}
                        onChange={(value) => handleSettingChange('passwordGenerator', 'includeLowercase', value)}
                        label="Include Lowercase Letters"
                        description="a-z (recommended for security)"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.passwordGenerator.includeNumbers}
                        onChange={(value) => handleSettingChange('passwordGenerator', 'includeNumbers', value)}
                        label="Include Numbers"
                        description="0-9 (recommended for security)"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.passwordGenerator.includeSymbols}
                        onChange={(value) => handleSettingChange('passwordGenerator', 'includeSymbols', value)}
                        label="Include Symbols"
                        description="!@#$%^&* (recommended for security)"
                      />
                      
                      <ToggleSwitch
                        enabled={settings.passwordGenerator.excludeSimilar}
                        onChange={(value) => handleSettingChange('passwordGenerator', 'excludeSimilar', value)}
                        label="Exclude Similar Characters"
                        description="Avoid 0, O, l, 1, I (improves readability)"
                      />
                      
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                          onClick={testPasswordGenerator}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base"
                        >
                          🧪 Test Generator
                        </button>
                        <button
                          onClick={() => {
                            const defaultPasswordGenerator = {
                              length: 16,
                              includeUppercase: true,
                              includeLowercase: true,
                              includeNumbers: true,
                              includeSymbols: true,
                              excludeSimilar: true,
                              excludeAmbiguous: false
                            };
                            
                            saveSettings({
                              ...settings,
                              passwordGenerator: defaultPasswordGenerator
                            });
                            
                            toast.info('Password generator settings reset to defaults');
                          }}
                          className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors text-sm sm:text-base"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Export Data</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-0 text-sm sm:text-base"
                >
                  <option value="encrypted-json">Encrypted JSON (Recommended)</option>
                  <option value="csv-metadata">CSV Metadata Only</option>
                  <option value="settings-only">Settings Only</option>
                </select>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Passwords are encrypted for your security. Keep your export file safe!
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={exportData}
                disabled={isExporting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Import Settings</h3>
            
            <div className="space-y-4">
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 rounded-lg text-sm"
              />
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Only settings will be imported. Passwords cannot be imported for security reasons.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || isImporting}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-bold text-red-600 mb-4">⚠️ Delete All Data</h3>
            
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              This will permanently delete all {passwordArray.length} passwords and reset all settings. This action cannot be undone!
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type "delete everything" to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border-2 border-red-200 rounded-lg focus:border-red-500 focus:ring-0 text-sm sm:text-base"
                  placeholder="delete everything"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={deleteAllData}
                disabled={deleteConfirmation.toLowerCase() !== 'delete everything' || isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base"
              >
                {isDeleting ? 'Deleting...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
