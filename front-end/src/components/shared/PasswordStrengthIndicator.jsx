import React, { memo } from 'react';
import PropTypes from 'prop-types';

const PasswordStrengthIndicator = memo(({ 
  strength, 
  score = 0, 
  warnings = [], 
  suggestions = [],
  showDetails = true 
}) => {
  const getStrengthConfig = (strengthLevel, actualScore = 0) => {
    const configs = {
      'Very Weak': {
        color: 'bg-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        textColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-200 dark:border-red-600',
        icon: '🔴',
        message: 'Very Weak - High Risk',
        ariaLabel: 'Password strength: Very weak, high security risk'
      },
      'Weak': {
        color: 'bg-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        textColor: 'text-red-600 dark:text-red-300',
        borderColor: 'border-red-200 dark:border-red-600',
        icon: '🟠',
        message: 'Weak - Improve Security',
        ariaLabel: 'Password strength: Weak, needs improvement'
      },
      'Moderate': {
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        borderColor: 'border-yellow-200 dark:border-yellow-600',
        icon: '🟡',
        message: 'Moderate - Good',
        ariaLabel: 'Password strength: Moderate, good security'
      },
      'Strong': {
        color: 'bg-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-700 dark:text-green-300',
        borderColor: 'border-green-200 dark:border-green-600',
        icon: '🟢',
        message: 'Strong - Secure',
        ariaLabel: 'Password strength: Strong, secure password'
      },
      'Very Strong': {
        color: 'bg-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        textColor: 'text-green-800 dark:text-green-300',
        borderColor: 'border-green-200 dark:border-green-600',
        icon: '✅',
        message: 'Very Strong - Excellent',
        ariaLabel: 'Password strength: Very strong, excellent security'
      }
    };
    
    const config = configs[strengthLevel] || configs['Weak'];
    
    // Use actual score for width calculation
    const normalizedScore = Math.max(0, Math.min(100, actualScore));
    config.width = `${normalizedScore}%`;
    config.scoreValue = normalizedScore;
    
    return config;
  };

  // Early return if no strength provided
  if (!strength) return null;

  const config = getStrengthConfig(strength, score);
  const hasWarnings = warnings && warnings.length > 0;
  const hasSuggestions = suggestions && suggestions.length > 0;
  const hasDetails = hasWarnings || hasSuggestions;

  return (
    <div 
      className={`p-3 sm:p-4 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all duration-300 shadow-sm`}
      role="status"
      aria-live="polite"
      aria-label={config.ariaLabel}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg" role="img" aria-hidden="true">
            {config.icon}
          </span>
          <span className={`font-semibold text-sm ${config.textColor}`}>
            Password Strength
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.color} text-white`}>
            {config.message}
          </span>
          {score > 0 && (
            <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 ${config.textColor} font-mono`}>
              {Math.round(config.scoreValue)}/100
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-3">
        <div 
          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden shadow-inner"
          role="progressbar"
          aria-valuenow={config.scoreValue}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={`Password strength score: ${Math.round(config.scoreValue)} out of 100`}
        >
          <div 
            className={`h-full rounded-full transition-all duration-700 ease-out transform origin-left ${config.color}`}
            style={{ 
              width: config.width,
              transformOrigin: 'left center'
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-500 dark:text-gray-400 select-none">
          <span>Weak</span>
          <span className="hidden sm:inline">Moderate</span>
          <span>Strong</span>
        </div>
      </div>

      {/* Details Section */}
      {showDetails && hasDetails && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-600 pt-3">
          {/* Warnings */}
          {hasWarnings && (
            <div className="flex items-start gap-2" role="alert">
              <span 
                className="text-red-500 text-sm flex-shrink-0 mt-0.5" 
                role="img" 
                aria-label="Warning"
              >
                ⚠️
              </span>
              <div className="text-red-600 dark:text-red-400 text-xs flex-1 min-w-0">
                <div className="font-medium mb-1">Security Issues:</div>
                {warnings.slice(0, 3).map((warning, index) => (
                  <div key={index} className="mb-1 break-words">
                    • {warning}
                  </div>
                ))}
                {warnings.length > 3 && (
                  <div className="text-red-500 dark:text-red-400 font-medium">
                    +{warnings.length - 3} more issues
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Suggestions */}
          {hasSuggestions && (
            <div className="flex items-start gap-2">
              <span 
                className="text-blue-500 text-sm flex-shrink-0 mt-0.5" 
                role="img" 
                aria-label="Suggestion"
              >
                💡
              </span>
              <div className="text-blue-600 dark:text-blue-400 text-xs flex-1 min-w-0">
                <div className="font-medium mb-1">Improvements:</div>
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <div key={index} className="mb-1 break-words">
                    • {suggestion}
                  </div>
                ))}
                {suggestions.length > 3 && (
                  <div className="text-blue-500 dark:text-blue-400 font-medium">
                    +{suggestions.length - 3} more suggestions
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {hasWarnings && showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label="Generate a strong password"
            >
              🔄 Generate Strong Password
            </button>
            {config.scoreValue < 60 && (
              <button
                type="button"
                className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                aria-label="View password security tips"
              >
                📚 Security Tips
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// PropTypes for type checking
PasswordStrengthIndicator.propTypes = {
  strength: PropTypes.oneOf(['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong']),
  score: PropTypes.number,
  warnings: PropTypes.arrayOf(PropTypes.string),
  suggestions: PropTypes.arrayOf(PropTypes.string),
  showDetails: PropTypes.bool
};

// Default props
PasswordStrengthIndicator.defaultProps = {
  score: 0,
  warnings: [],
  suggestions: [],
  showDetails: true
};

// Display name for debugging
PasswordStrengthIndicator.displayName = 'PasswordStrengthIndicator';

export default PasswordStrengthIndicator;
