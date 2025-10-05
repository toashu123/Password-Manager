import React, { useState, useCallback } from "react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";

export default function CustomLogin() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signUp } = useSignUp();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  // MFA state
  const [needsMFA, setNeedsMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  // Clear error when user starts typing
  const clearError = useCallback(() => {
    if (error) setError("");
  }, [error]);

  // Validate email format
  const isValidEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Handle sign in
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!isLoaded || isLoading) return;

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.create({ 
        identifier: email.trim(), 
        password 
      });

      // Check if MFA is required
      if (result.status === 'needs_second_factor') {
        setNeedsMFA(true);
        toast.info('Please enter your 2FA code to continue');
        return;
      }

      // Check if sign-in is complete
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast.success('Welcome back! Successfully signed in.');
      } else {
        setError('Sign-in incomplete. Please try again.');
      }

    } catch (err) {
      console.error('Sign-in error:', err);
      
      // Handle specific error cases
      if (err.errors?.[0]?.code === 'form_identifier_not_found') {
        setError('No account found with this email address.');
      } else if (err.errors?.[0]?.code === 'form_password_incorrect') {
        setError('Incorrect password. Please try again.');
      } else if (err.errors?.[0]?.code === 'too_many_requests') {
        setError('Too many failed attempts. Please wait before trying again.');
      } else {
        setError(err.errors?.[0]?.message || 'Sign-in failed. Please try again.');
      }
      
      toast.error('Sign-in failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle MFA verification
  const handleMFAVerification = async (e) => {
    e.preventDefault();
    if (!isLoaded || isLoading) return;

    if (!mfaCode || mfaCode.length < 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code: mfaCode
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast.success('Successfully signed in with MFA!');
      } else {
        setError('MFA verification incomplete. Please try again.');
      }

    } catch (err) {
      console.error('MFA error:', err);
      
      if (err.errors?.[0]?.code === 'form_code_incorrect') {
        setError('Invalid verification code. Please try again.');
      } else {
        setError(err.errors?.[0]?.message || 'MFA verification failed.');
      }
      
      toast.error('MFA verification failed. Please check your code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign up (basic implementation)
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isLoaded || isLoading) return;

    // Validation
    if (!email.trim() || !isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      toast.info('Please check your email for a verification code');
      
      // You might want to redirect to verification page here
      
    } catch (err) {
      console.error('Sign-up error:', err);
      setError(err.errors?.[0]?.message || 'Sign-up failed. Please try again.');
      toast.error('Sign-up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Reset form when switching between sign in/up
  const handleModeSwitch = useCallback(() => {
    setIsSignUp(prev => !prev);
    setEmail("");
    setPassword("");
    setError("");
    setNeedsMFA(false);
    setMfaCode("");
    setShowPassword(false);
  }, []);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="max-w-sm mx-auto p-6 bg-white shadow-lg rounded-lg">
        <div className="flex items-center justify-center">
          <FaSpinner className="animate-spin w-8 h-8 text-blue-600" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // MFA verification form
  if (needsMFA) {
    return (
      <div className="max-w-sm mx-auto p-6 bg-white shadow-lg rounded-lg border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-600 text-sm">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <form onSubmit={handleMFAVerification} noValidate>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              id="mfaCode"
              value={mfaCode}
              onChange={(e) => {
                setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                clearError();
              }}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength="6"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || mfaCode.length < 6}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin w-4 h-4 mr-2" />
                Verifying...
              </>
            ) : (
              'Verify & Sign In'
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setNeedsMFA(false);
              setMfaCode("");
              setError("");
            }}
            className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Back to Sign In
          </button>
        </form>
      </div>
    );
  }

  // Main login/signup form
  return (
    <div className="max-w-sm mx-auto p-6 bg-white shadow-lg rounded-lg border border-gray-200">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-600 text-sm">
          {isSignUp 
            ? 'Sign up to secure your passwords' 
            : 'Sign in to access your password vault'
          }
        </p>
      </div>

      <form onSubmit={isSignUp ? handleSignUp : handleSignIn} noValidate>
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Email Input */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError();
            }}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            required
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
              disabled={isLoading}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={isSignUp ? "8" : "6"}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              disabled={isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin w-4 h-4 mr-2" />
              {isSignUp ? 'Creating Account...' : 'Signing In...'}
            </>
          ) : (
            isSignUp ? 'Create Account' : 'Sign In'
          )}
        </button>

        {/* Toggle Sign In/Up */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleModeSwitch}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline disabled:opacity-50"
          >
            {isSignUp 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up"
            }
          </button>
        </div>

        {/* Forgot Password (for sign in only) */}
        {!isSignUp && (
          <div className="mt-3 text-center">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-800 text-sm underline"
              onClick={() => toast.info('Password reset feature coming soon!')}
            >
              Forgot your password?
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
