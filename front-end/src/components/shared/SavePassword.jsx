import React, { useState, useCallback } from "react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const SavePassword = ({ addPassword, onClose, initialData = {} }) => {
  const [formData, setFormData] = useState({
    siteService: initialData.siteService || '',
    username: initialData.username || '',
    password: initialData.password || '',
    category: initialData.category || 'Personal',
    websiteUrl: initialData.websiteUrl || '',
    notes: initialData.notes || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Basic password strength analysis
  const analyzePassword = useCallback((password) => {
    if (!password) return { strength: 'Weak', score: 0, isWeak: true };
    
    let score = 0;
    let strength = 'Weak';
    let isWeak = true;

    // Length check
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;

    // Determine strength
    if (score >= 80) {
      strength = 'Very Strong';
      isWeak = false;
    } else if (score >= 60) {
      strength = 'Strong';
      isWeak = false;
    } else if (score >= 40) {
      strength = 'Moderate';
      isWeak = true;
    } else {
      strength = 'Weak';
      isWeak = true;
    }

    return { strength, score, isWeak };
  }, []);

  const passwordAnalysis = analyzePassword(formData.password);

  // Validate form data
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.siteService.trim()) {
      newErrors.siteService = 'Site/Service is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    if (formData.websiteUrl && formData.websiteUrl.trim()) {
      try {
        new URL(formData.websiteUrl);
      } catch {
        newErrors.websiteUrl = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  // Generate strong password
  const generatePassword = useCallback(() => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    let password = "";
    const allChars = lowercase + uppercase + numbers + symbols;
    
    // Ensure variety
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining length
    for (let i = 4; i < 14; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle
    const shuffled = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setFormData(prev => ({ ...prev, password: shuffled }));
    toast.success('Strong password generated!', { autoClose: 2000 });
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    // Warn about weak passwords
    if (passwordAnalysis.isWeak) {
      const confirmSave = window.confirm(
        `⚠️ Warning: This password is ${passwordAnalysis.strength}!\n\n` +
        `Security Score: ${Math.round(passwordAnalysis.score)}/100\n\n` +
        `Save anyway?`
      );
      
      if (!confirmSave) {
        toast.info('Consider generating a stronger password');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const passwordData = {
        siteService: formData.siteService.trim(),
        username: formData.username.trim(),
        password: formData.password,
        category: formData.category,
        websiteUrl: formData.websiteUrl.trim(),
        notes: formData.notes.trim(),
        strength: passwordAnalysis.strength,
        isWeak: passwordAnalysis.isWeak,
        securityScore: Math.round(passwordAnalysis.score)
      };

      await addPassword(passwordData);
      
      toast.success('Password saved successfully!', {
        position: "top-right",
        autoClose: 3000
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to save password:', error);
      toast.error(`Failed to save password: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close with confirmation if form has data
  const handleClose = useCallback(() => {
    const hasData = Object.values(formData).some(value => value.trim());
    
    if (hasData) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmClose) return;
    }
    
    onClose();
  }, [formData, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Save Password</h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Site/Service */}
          <div>
            <label htmlFor="siteService" className="block text-sm font-medium text-gray-700 mb-1">
              Site/Service *
            </label>
            <input
              type="text"
              id="siteService"
              name="siteService"
              value={formData.siteService}
              onChange={handleInputChange}
              placeholder="e.g., Gmail, Facebook, Netflix"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.siteService ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
              required
            />
            {errors.siteService && (
              <p className="text-red-500 text-xs mt-1">{errors.siteService}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username/Email *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="your@email.com or username"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
              required
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 
                    passwordAnalysis.isWeak && formData.password ? 'border-orange-400' : 
                    'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                disabled={isSubmitting}
              >
                Generate
              </button>
            </div>
            
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}

            {/* Password Strength */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Strength: {passwordAnalysis.strength}</span>
                  <span className="text-gray-600">{Math.round(passwordAnalysis.score)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordAnalysis.isWeak ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${passwordAnalysis.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Finance">Finance</option>
              <option value="Social">Social</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Website URL */}
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              id="websiteUrl"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.websiteUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.websiteUrl && (
              <p className="text-red-500 text-xs mt-1">{errors.websiteUrl}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes (optional)"
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              disabled={isSubmitting}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2 ${
                passwordAnalysis.isWeak && formData.password
                  ? 'bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500'
                  : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  {passwordAnalysis.isWeak && formData.password ? '⚠️ Save Weak Password' : '✅ Save Password'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

SavePassword.propTypes = {
  addPassword: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

export default SavePassword;
