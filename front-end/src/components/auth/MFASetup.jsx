import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";

const MFASetup = ({ onComplete, showSetup = false }) => {
  const { user } = useUser();
  const clerk = useClerk();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCodeUri, setQrCodeUri] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState("idle");
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Check if user already has MFA enabled
  useEffect(() => {
    if (user?.twoFactorEnabled) {
      setEnrollmentStatus("complete");
    }
  }, [user]);

  // Clean up localStorage on component unmount
  useEffect(() => {
    return () => {
      if (user?.id) {
        localStorage.removeItem(`mfa_setup_pending_${user.id}`);
      }
    };
  }, [user?.id]);

  const checkAndVerifyEmail = async () => {
    try {
      // Fixed: Add null checks for user and emailAddresses
      if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
        toast.error("No email address found. Please add an email to your account.");
        return false;
      }

      const primaryEmail = user.emailAddresses[0];

      console.log("Email verification status:", primaryEmail?.verification?.status);

      // Fixed: Check if verification object exists
      if (!primaryEmail?.verification) {
        toast.error("Email verification status unavailable. Please try again.");
        return false;
      }

      if (primaryEmail.verification.status !== "verified") {
        toast.error("Please verify your email address first before enabling MFA");
        return false;
      }

      console.log("✅ Email verified, proceeding with MFA setup");
      return true;
    } catch (error) {
      console.error("Email verification check failed:", error);
      toast.error("Failed to check email verification status");
      return false;
    }
  };

  const forceReauthentication = async () => {
    const shouldReauth = confirm(
      "MFA setup failed. Would you like to sign out and sign back in with a fresh session? This often resolves setup issues."
    );
    
    if (shouldReauth) {
      try {
        // Store that user wants to setup MFA after re-auth
        if (user?.id) {
          localStorage.setItem(`mfa_setup_pending_${user.id}`, 'true');
        }
        
        await clerk.signOut();
        toast.info("Please sign in again and try MFA setup");
        
      } catch (error) {
        console.error('Sign out failed:', error);
        toast.error("Failed to sign out. Please manually sign out and try again.");
      }
    }
  };

  // Start TOTP enrollment
  const startTOTPEnrollment = async () => {
    try {
      // Fixed: Add null checks for clerk.session
      if (clerk.session) {
        await clerk.session.reload();
      }

      const emailVerified = await checkAndVerifyEmail();
      if (!emailVerified) return;

      console.log("User object:", user);
      console.log("User MFA status:", user?.twoFactorEnabled);

      setIsEnrolling(true);
      setEnrollmentStatus("generating");

      // Add validation
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Wait a moment to ensure session is fully loaded
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create TOTP factor
      console.log("Creating TOTP factor...");
      const totpFactor = await user.createTOTP();

      if (!totpFactor || !totpFactor.uri) {
        throw new Error("Failed to generate TOTP factor");
      }

      console.log("TOTP Factor created successfully:", totpFactor);

      // Get the QR code URI and secret
      const qrUri = totpFactor.uri;
      const secret = totpFactor.secret;

      setQrCodeUri(qrUri);
      setTotpSecret(secret);
      setEnrollmentStatus("verifying");

      toast.success("Scan the QR code with your authenticator app!");
    } catch (error) {
      console.error("TOTP enrollment failed:", error);
      
      // Enhanced error handling
      if (error.message?.includes("additional verification") || 
          error.errors?.[0]?.code === 'identifier_already_signed_in') {
        forceReauthentication();
      } else if (error.errors?.[0]?.code === 'session_invalid') {
        toast.error("Session expired. Please refresh and try again.");
        setEnrollmentStatus("idle");
      } else {
        toast.error("Failed to start MFA setup. Please try again.");
        setEnrollmentStatus("idle");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  // Verify TOTP and complete enrollment
  const verifyTOTPAndEnroll = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    // Fixed: Add user validation before proceeding
    if (!user) {
      toast.error("User session lost. Please refresh and try again.");
      return;
    }

    try {
      setIsEnrolling(true);

      // Verify the TOTP code
      const totpAttempt = await user.verifyTOTP({ code: verificationCode });

      if (totpAttempt.verification.status === "verified") {
        // Generate backup codes
        const backupCodeResponse = await user.generateBackupCodes();
        setBackupCodes(backupCodeResponse.codes || []);

        setEnrollmentStatus("complete");
        setShowBackupCodes(true);

        toast.success("🎉 MFA setup complete! Save your backup codes.");
        onComplete?.();
      } else {
        toast.error("Invalid verification code. Please try again.");
      }
    } catch (error) {
      console.error("TOTP verification failed:", error);
      
      // Enhanced error handling
      if (error.errors?.[0]?.code === 'form_code_incorrect') {
        toast.error("Invalid verification code. Please check your authenticator app.");
      } else if (error.errors?.[0]?.code === 'session_invalid') {
        toast.error("Session expired. Please start setup again.");
        setEnrollmentStatus("idle");
      } else {
        toast.error("Verification failed. Please check your code and try again.");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  // Disable MFA
  const disableMFA = async () => {
    if (
      !confirm(
        "Are you sure you want to disable Multi-Factor Authentication? This will reduce your account security."
      )
    ) {
      return;
    }

    // Fixed: Add user validation
    if (!user) {
      toast.error("User session not available. Please refresh and try again.");
      return;
    }

    try {
      setIsEnrolling(true);

      // Disable two-factor authentication
      await user.disableTwoFactor();

      // Reset all states
      setEnrollmentStatus("idle");
      setQrCodeUri("");
      setTotpSecret("");
      setBackupCodes([]);
      setShowBackupCodes(false);
      setVerificationCode("");

      toast.success("MFA has been disabled");
    } catch (error) {
      console.error("Failed to disable MFA:", error);
      
      // Enhanced error handling
      if (error.errors?.[0]?.code === 'session_invalid') {
        toast.error("Session expired. Please refresh and try again.");
      } else {
        toast.error("Failed to disable MFA. Please try again.");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  // Fixed: Add copy to clipboard error handling
  const copyBackupCodes = async () => {
    try {
      const codesText = backupCodes.join("\n");
      await navigator.clipboard.writeText(codesText);
      toast.success("Backup codes copied to clipboard!");
    } catch (error) {
      // Fallback for older browsers or permissions issues
      console.error("Clipboard copy failed:", error);
      
      // Create a temporary textarea for fallback
      const textArea = document.createElement('textarea');
      textArea.value = backupCodes.join("\n");
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        toast.success("Backup codes copied to clipboard!");
      } catch (fallbackError) {
        toast.error("Failed to copy codes. Please copy them manually.");
      }
      
      document.body.removeChild(textArea);
    }
  };

  if (!showSetup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center max-h-screen overflow-y-auto">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Multi-Factor Authentication
          </h2>
          <p className="text-gray-600 text-sm">
            Add an extra layer of security to your password manager
          </p>
        </div>

        {/* MFA Status Display */}
        {enrollmentStatus === "complete" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-3">
              <span className="text-green-600 text-2xl">✅</span>
            </div>
            <h3 className="text-green-800 font-semibold mb-2">MFA Enabled</h3>
            <p className="text-green-700 text-sm mb-4">
              Your account is protected with Multi-Factor Authentication
            </p>
            <button
              onClick={disableMFA}
              disabled={isEnrolling}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isEnrolling ? "Disabling..." : "Disable MFA"}
            </button>
          </div>
        )}

        {/* Step 1: Generate QR Code */}
        {enrollmentStatus === "idle" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-800 font-semibold mb-2">
                Setup Authenticator App
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                Use apps like Google Authenticator, Authy, or Microsoft
                Authenticator
              </p>
              <button
                onClick={startTOTPEnrollment}
                disabled={isEnrolling}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isEnrolling ? "Generating..." : "Start Setup"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Show QR Code and Verify */}
        {enrollmentStatus === "verifying" && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Scan QR Code</h3>

              {qrCodeUri && (
                <div className="flex justify-center mb-4">
                  <QRCodeSVG value={qrCodeUri} size={200} />
                </div>
              )}

              <div className="bg-gray-100 p-3 rounded text-sm font-mono break-all mb-4">
                <p className="text-xs text-gray-600 mb-1">Manual Entry Key:</p>
                {totpSecret}
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength="6"
                />

                <button
                  onClick={verifyTOTPAndEnroll}
                  disabled={isEnrolling || verificationCode.length !== 6}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isEnrolling ? "Verifying..." : "Verify & Enable MFA"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Backup Codes Display */}
        {showBackupCodes && backupCodes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="text-yellow-800 font-semibold mb-2">
              ⚠️ Backup Codes
            </h3>
            <p className="text-yellow-700 text-sm mb-3">
              Save these codes in a secure location. You can use them if you
              lose access to your authenticator app.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-white p-2 rounded text-sm font-mono text-center border"
                >
                  {code}
                </div>
              ))}
            </div>
            <button
              onClick={copyBackupCodes}
              className="w-full px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Copy Backup Codes
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={() => onComplete?.()}
          className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MFASetup;
