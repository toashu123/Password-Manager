import React, { useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";

// Separate reusable button component
const AddPasswordButton = ({ 
  savePassword, 
  disabled = false, 
  loading = false, 
  variant = "default",
  size = "medium",
  showIcon = true,
  children = "Save Password"
}) => {
  const iconRef = useRef(null);
  const [iconLoaded, setIconLoaded] = useState(false);
  const [iconError, setIconError] = useState(false);

  // Handle icon interactions with error handling
  const triggerIconHover = useCallback((state) => {
    try {
      if (iconRef.current && iconLoaded && !iconError) {
        iconRef.current.dispatchEvent(
          new MouseEvent(state, { bubbles: true })
        );
      }
    } catch (error) {
      console.warn('Icon interaction failed:', error);
    }
  }, [iconLoaded, iconError]);

  const handleMouseEnter = useCallback(() => {
    triggerIconHover("mouseenter");
  }, [triggerIconHover]);

  const handleMouseLeave = useCallback(() => {
    triggerIconHover("mouseleave");
  }, [triggerIconHover]);

  // Handle button click with validation
  const handleClick = useCallback((e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    if (typeof savePassword === 'function') {
      try {
        savePassword();
      } catch (error) {
        console.error('Save password function error:', error);
      }
    } else {
      console.error('savePassword is not a function');
    }
  }, [savePassword, disabled, loading]);

  // Handle icon load events
  const handleIconLoad = useCallback(() => {
    setIconLoaded(true);
    setIconError(false);
  }, []);

  const handleIconError = useCallback(() => {
    setIconError(true);
    setIconLoaded(false);
  }, []);

  // Get button styles based on variant and size
  const getButtonStyles = () => {
    const baseStyles = "flex justify-center items-center rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";
    
    // Size variants
    const sizeStyles = {
      small: "px-3 py-1.5 text-sm gap-1",
      medium: "px-4 py-2 text-base gap-2", 
      large: "px-6 py-3 text-lg gap-3"
    };

    // Color variants
    const variantStyles = {
      default: "text-white bg-green-600 hover:bg-green-700 focus:ring-green-500 active:bg-green-800",
      primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800",
      secondary: "text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400",
      success: "text-white bg-green-500 hover:bg-green-600 focus:ring-green-400 active:bg-green-700",
      warning: "text-white bg-orange-500 hover:bg-orange-600 focus:ring-orange-400 active:bg-orange-700",
      danger: "text-white bg-red-500 hover:bg-red-600 focus:ring-red-400 active:bg-red-700"
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  // Get icon size based on button size
  const getIconSize = () => {
    const sizes = {
      small: "20px",
      medium: "24px",
      large: "28px"
    };
    return sizes[size] || "24px";
  };

  // Fallback icon component when lord-icon fails
  const FallbackIcon = () => (
    <svg 
      width={getIconSize()} 
      height={getIconSize()} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );

  return (
    <button 
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      className={getButtonStyles()}
      type="button"
      aria-label={loading ? "Saving password..." : "Save password"}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {/* Loading state */}
      {loading ? (
        <div 
          className="animate-spin rounded-full border-2 border-white border-t-transparent"
          style={{ width: getIconSize(), height: getIconSize() }}
          role="status"
          aria-label="Loading"
        />
      ) : (
        // Icon (only show if showIcon is true and not loading)
        showIcon && (
          <>
            {/* Try to load lord-icon, fallback to SVG */}
            {!iconError ? (
              <lord-icon
                ref={iconRef}
                src="https://cdn.lordicon.com/efxgwrkc.json"
                trigger="hover"
                stroke="bold"
                state="hover-swirl"
                style={{ 
                  width: getIconSize(), 
                  height: getIconSize(),
                  flexShrink: 0
                }}
                onLoad={handleIconLoad}
                onError={handleIconError}
                aria-hidden="true"
              />
            ) : (
              <FallbackIcon />
            )}
          </>
        )
      )}
      
      {/* Button text */}
      <span className="whitespace-nowrap">
        {loading ? "Saving..." : children}
      </span>
    </button>
  );
};

// PropTypes validation
AddPasswordButton.propTypes = {
  savePassword: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  variant: PropTypes.oneOf([
    'default', 'primary', 'secondary', 'success', 'warning', 'danger'
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showIcon: PropTypes.bool,
  children: PropTypes.node
};

// Default props
AddPasswordButton.defaultProps = {
  disabled: false,
  loading: false,
  variant: 'default',
  size: 'medium',
  showIcon: true,
  children: 'Save Password'
};

// Display name for debugging
AddPasswordButton.displayName = 'AddPasswordButton';

export default AddPasswordButton;
