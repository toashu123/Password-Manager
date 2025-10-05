import React, { useState } from 'react';
import { useSignIn, useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';

const MFALoginFlow = ({ onSuccess, onError }) => {
  const { signIn, setActive } = useSignIn();
  const { user } = useUser();
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Handle MFA verification
  const handleMFAVerification = async () => {
    // Fixed validation logic for different code types
    const minLength = useBackupCode ? 8 : 6;
    if (!verificationCode || verificationCode.length < minLength) {
      toast.error(`Please enter a valid ${useBackupCode ? 'backup code' : 'verification code'}`);
      return;
    }

    // Check if signIn is available
    if (!signIn) {
      toast.error('Sign-in not initialized. Please try again.');
      onError?.(new Error('SignIn not available'));
      return;
    }

    try {
      setIsVerifying(true);

      // Attempt to complete the sign-in with TOTP or backup code
      const completeSignIn = await signIn.attemptSecondFactor({
        strategy: useBackupCode ? 'backup_code' : 'totp',
        code: verificationCode,
      });

      if (completeSignIn.status === 'complete') {
        // Sign in was successful
        await setActive({ session: completeSignIn.createdSessionId });
        toast.success('Successfully signed in with MFA!');
        onSuccess?.();
      } else {
        // Handle other statuses if needed
        console.log('Sign-in status:', completeSignIn.status);
        toast.error('Sign-in incomplete. Please try again.');
      }
    } catch (error) {
      console.error('MFA verification failed:', error);
      
      // Enhanced error handling
      if (error.errors?.[0]?.code === 'form_code_incorrect') {
        toast.error('Invalid verification code. Please try again.');
      } else if (error.errors?.[0]?.code === 'form_identifier_not_found') {
        toast.error('Session expired. Please sign in again.');
      } else if (error.errors?.[0]?.code === 'too_many_requests') {
        toast.error('Too many attempts. Please wait before trying again.');
      } else {
        toast.error('Verification failed. Please try again.');
      }
      
      onError?.(error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-600 text-sm">
          {useBackupCode 
            ? 'Enter one of your backup codes (8-10 characters)'
            : 'Enter the 6-digit code from your authenticator app'
          }
        </p>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => {
            const value = useBackupCode 
              ? e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
              : e.target.value.replace(/\D/g, '').slice(0, 6);
            setVerificationCode(value);
          }}
          placeholder={useBackupCode ? 'Enter backup code' : 'Enter 6-digit code'}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={useBackupCode ? "10" : "6"}
        />

        <button
          onClick={handleMFAVerification}
          // Fixed validation condition
          disabled={isVerifying || verificationCode.length < (useBackupCode ? 8 : 6)}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>

        <div className="text-center">
          <button
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setVerificationCode('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MFALoginFlow;
