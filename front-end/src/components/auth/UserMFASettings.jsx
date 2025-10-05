import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import MFASetup from './MFASetup';

const UserMFASettings = () => {
  const { user, isLoaded } = useUser();
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaStatus, setMfaStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track MFA status changes
  useEffect(() => {
    if (user?.twoFactorEnabled !== undefined) {
      setMfaStatus(user.twoFactorEnabled);
    }
  }, [user?.twoFactorEnabled]);

  // Refresh user data to get latest MFA status
  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      setIsRefreshing(true);
      await user.reload();
      setMfaStatus(user.twoFactorEnabled);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      toast.error('Failed to refresh security settings');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle MFA setup completion
  const handleMFAComplete = async () => {
    setShowMFASetup(false);
    
    // Refresh user data to reflect changes
    await refreshUserData();
    
    // Show success message based on the action taken
    if (user?.twoFactorEnabled) {
      toast.success('MFA settings updated successfully!');
    }
  };

  // Handle setup button click
  const handleSetupClick = () => {
    if (!isLoaded) {
      toast.error('User data still loading. Please wait...');
      return;
    }
    
    if (!user) {
      toast.error('User not authenticated. Please sign in again.');
      return;
    }
    
    setShowMFASetup(true);
  };

  // Show loading state while user data is loading
  if (!isLoaded) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading security settings...</span>
        </div>
      </div>
    );
  }

  // Handle case where user is not available
  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
        <div className="text-center py-8">
          <span className="text-red-600">❌ User not authenticated</span>
          <p className="text-sm text-gray-600 mt-2">Please sign in to manage security settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
        {isRefreshing && (
          <div className="flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Refreshing...
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {/* MFA Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Security lock">🔐</span>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Multi-Factor Authentication</h4>
              <p className="text-sm text-gray-600">
                {mfaStatus 
                  ? 'Your account is protected with MFA' 
                  : 'Add an extra layer of security to your account'
                }
              </p>
              
              {/* Additional MFA info */}
              {mfaStatus && (
                <p className="text-xs text-green-700 mt-1">
                  TOTP authentication is active
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {/* Status Badge */}
            <span 
              className={`text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                mfaStatus
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
              aria-label={`MFA is ${mfaStatus ? 'enabled' : 'disabled'}`}
            >
              {mfaStatus ? '✅ Enabled' : '❌ Disabled'}
            </span>
            
            {/* Action Button */}
            <button
              onClick={handleSetupClick}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              aria-label={mfaStatus ? 'Manage MFA settings' : 'Setup MFA authentication'}
            >
              {isRefreshing ? 'Loading...' : (mfaStatus ? 'Manage' : 'Setup MFA')}
            </button>
          </div>
        </div>
        
        {/* Account Recovery Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Recovery key">🔑</span>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Account Recovery</h4>
              <p className="text-sm text-gray-600">
                Backup codes and recovery options for your account
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              ℹ️ Available
            </span>
            <button
              onClick={handleSetupClick}
              disabled={isRefreshing}
              className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              View Codes
            </button>
          </div>
        </div>

        {/* Email Verification Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label="Email">📧</span>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Email Verification</h4>
              <p className="text-sm text-gray-600">
                {user.emailAddresses?.[0]?.verification?.status === 'verified'
                  ? `Primary email (${user.emailAddresses[0].emailAddress}) is verified`
                  : 'Primary email needs verification'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span 
              className={`text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                user.emailAddresses?.[0]?.verification?.status === 'verified'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {user.emailAddresses?.[0]?.verification?.status === 'verified' 
                ? '✅ Verified' 
                : '⚠️ Pending'
              }
            </span>
          </div>
        </div>
      </div>

      {/* MFA Setup Modal */}
      {showMFASetup && (
        <MFASetup 
          onComplete={handleMFAComplete}
          showSetup={showMFASetup}
        />
      )}
    </div>
  );
};

export default UserMFASettings;
