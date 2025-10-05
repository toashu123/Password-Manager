const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Secure password storage with timeout
let currentMasterPassword = null;
let currentUserId = null;
let passwordTimeout = null;
let keyCache = new Map();

// Security configuration
const CRYPTO_CONFIG = {
  PBKDF2_ITERATIONS: 210000,
  SALT_LENGTH: 32,
  IV_LENGTH: 16,
  KEY_CACHE_TTL: 300000,
  PASSWORD_TIMEOUT: 3600000,
  MAX_PASSWORD_LENGTH: 10000,
};

// Enhanced browser compatibility check
export const checkCryptoSupport = () => {
  const issues = [];
  const warnings = [];

  if (!window.crypto) {
    issues.push('Web Crypto API not available');
  } else {
    if (!window.crypto.subtle) {
      issues.push('SubtleCrypto not available');
    }
    if (!window.crypto.getRandomValues) {
      issues.push('crypto.getRandomValues not available');
    }
  }

  if (!window.TextEncoder) {
    issues.push('TextEncoder not available');
  }
  if (!window.TextDecoder) {
    issues.push('TextDecoder not available');
  }

  if (!window.performance || !window.performance.now) {
    warnings.push('High-resolution timing not available');
  }

  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    warnings.push('Crypto APIs may be limited on non-HTTPS connections');
  }

  if (issues.length > 0) {
    console.error('❌ Crypto support issues:', issues);
    return { supported: false, issues, warnings };
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Crypto support warnings:', warnings);
  }

  console.log('✅ All crypto APIs supported');
  return { supported: true, issues: [], warnings };
};

// FIXED: Generate DETERMINISTIC salt from userId - same user always gets same salt
function getUserSalt(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Valid userId required for salt generation');
  }

  try {
    // Create deterministic salt from userId - NO RANDOM BYTES
    // This ensures the same userId always produces the same salt
    const userBytes = encoder.encode(userId);
    const constantBytes = encoder.encode('SecureVault_Salt_2024_v2');
    
    const salt = new Uint8Array(CRYPTO_CONFIG.SALT_LENGTH);
    
    // Mix user ID with constant in a deterministic way
    for (let i = 0; i < CRYPTO_CONFIG.SALT_LENGTH; i++) {
      salt[i] = userBytes[i % userBytes.length] ^
                constantBytes[i % constantBytes.length] ^
                ((i * 31 + 17) & 0xFF);
    }
    
    return salt;
  } catch (error) {
    console.error('Salt generation failed:', error);
    throw new Error('Failed to generate secure salt');
  }
}

// Enhanced key derivation with caching and validation
async function deriveKey(masterPassword, userId, useCache = true) {
  if (!masterPassword || typeof masterPassword !== 'string') {
    throw new Error("Master password must be a valid string");
  }
  if (masterPassword.length < 8) {
    throw new Error("Master password must be at least 8 characters");
  }
  if (masterPassword.length > CRYPTO_CONFIG.MAX_PASSWORD_LENGTH) {
    throw new Error("Master password too long");
  }
  if (!userId) {
    throw new Error("User ID required for key derivation");
  }

  const cacheKey = `${userId}_${hashString(masterPassword)}`;
  
  // Check cache first
  if (useCache && keyCache.has(cacheKey)) {
    const cached = keyCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CRYPTO_CONFIG.KEY_CACHE_TTL) {
      console.log('🔑 Using cached derived key');
      return cached.key;
    } else {
      keyCache.delete(cacheKey);
    }
  }

  try {
    console.log('🔑 Deriving new key for user:', userId);
    const startTime = performance.now();

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(masterPassword),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    // FIXED: Get deterministic salt
    const salt = getUserSalt(userId);
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    const derivationTime = performance.now() - startTime;
    console.log(`✅ Key derived in ${derivationTime.toFixed(2)}ms`);

    // Cache the key
    if (useCache) {
      keyCache.set(cacheKey, {
        key: derivedKey,
        timestamp: Date.now()
      });
    }

    return derivedKey;
  } catch (error) {
    console.error('Key derivation failed:', error);
    throw new Error('Failed to derive encryption key');
  }
}

// Simple hash function for cache keys (not cryptographic)
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Enhanced master password management
export function setMasterPassword(password, userId) {
  if (!password || typeof password !== 'string') {
    throw new Error("Password must be a valid string");
  }
  if (password.length < 8) {
    throw new Error("Master password must be at least 8 characters");
  }
  if (password.length > CRYPTO_CONFIG.MAX_PASSWORD_LENGTH) {
    throw new Error("Master password too long");
  }
  if (!userId) {
    throw new Error("User ID required");
  }

  // Clear existing password and timeout
  clearMasterPassword();

  currentMasterPassword = password;
  currentUserId = userId;

  // Set automatic timeout for security
  passwordTimeout = setTimeout(() => {
    console.log('🔒 Master password expired for security');
    clearMasterPassword();
  }, CRYPTO_CONFIG.PASSWORD_TIMEOUT);

  console.log(`✅ Master password set for user ${userId}`);
}

// Get current master password with validation
const getMasterPassword = () => {
  if (!currentMasterPassword) {
    throw new Error('Master password not set or expired. Please log in again.');
  }
  if (!currentUserId) {
    throw new Error('User ID not set. Please log in again.');
  }
  return { password: currentMasterPassword, userId: currentUserId };
};

// Enhanced encryption with comprehensive validation
export async function encrypt(plaintext, userId = null) {
  if (!plaintext) {
    throw new Error("Text to encrypt cannot be empty");
  }
  if (typeof plaintext !== "string") {
    throw new Error("Text to encrypt must be a string");
  }
  if (plaintext.length === 0) {
    throw new Error("Text to encrypt cannot be empty");
  }
  if (plaintext.length > CRYPTO_CONFIG.MAX_PASSWORD_LENGTH) {
    throw new Error("Text too long to encrypt");
  }

  const { password: masterPassword, userId: currentUid } = getMasterPassword();
  const uid = userId || currentUid;

  if (!uid) {
    throw new Error("User ID required for encryption");
  }

  try {
    console.log('🔐 Starting encryption...');
    const startTime = performance.now();

    const key = await deriveKey(masterPassword, uid);
    
    // Generate cryptographically secure IV
    const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.IV_LENGTH));
    const encoded = encoder.encode(plaintext);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      { 
        name: "AES-GCM", 
        iv,
        tagLength: 128
      },
      key,
      encoded
    );

    const encryptionTime = performance.now() - startTime;
    console.log(`✅ Encryption completed in ${encryptionTime.toFixed(2)}ms`);

    const result = {
      ciphertext: Array.from(new Uint8Array(ciphertextBuffer)),
      iv: Array.from(iv),
      userId: uid,
      algorithm: 'AES-GCM',
      version: '2.0',
      timestamp: Date.now()
    };

    if (!result.ciphertext || result.ciphertext.length === 0) {
      throw new Error("Encryption produced empty result");
    }
    if (!result.iv || result.iv.length !== CRYPTO_CONFIG.IV_LENGTH) {
      throw new Error("Invalid IV generated");
    }

    return result;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

// Enhanced decryption with comprehensive error handling
export async function decrypt(ciphertext, iv, userId = null) {
  if (!ciphertext) {
    throw new Error("Ciphertext required for decryption");
  }
  if (!Array.isArray(ciphertext) && !(ciphertext instanceof Uint8Array)) {
    throw new Error("Ciphertext must be an array or Uint8Array");
  }
  if (ciphertext.length === 0) {
    throw new Error("Ciphertext cannot be empty");
  }

  if (!iv) {
    throw new Error("IV required for decryption");
  }
  if (!Array.isArray(iv) && !(iv instanceof Uint8Array)) {
    throw new Error("IV must be an array or Uint8Array");
  }
  if (iv.length === 0) {
    throw new Error("IV cannot be empty");
  }

  const { password: masterPassword, userId: currentUid } = getMasterPassword();
  const uid = userId || currentUid;

  if (!uid) {
    throw new Error("User ID required for decryption");
  }

  try {
    console.log('🔓 Starting decryption for user:', uid);
    const startTime = performance.now();

    const key = await deriveKey(masterPassword, uid);

    const ivBytes = iv instanceof Uint8Array ? iv : new Uint8Array(iv);
    const ciphertextBytes = ciphertext instanceof Uint8Array ? ciphertext : new Uint8Array(ciphertext);

    if (ivBytes.length !== CRYPTO_CONFIG.IV_LENGTH && ivBytes.length !== 12) {
      console.warn(`⚠️ Unusual IV length: ${ivBytes.length}`);
    }

    const decryptedBuffer = await crypto.subtle.decrypt(
      { 
        name: "AES-GCM", 
        iv: ivBytes,
        tagLength: 128
      },
      key,
      ciphertextBytes
    );

    const decrypted = decoder.decode(decryptedBuffer);
    const decryptionTime = performance.now() - startTime;
    console.log(`✅ Decryption completed in ${decryptionTime.toFixed(2)}ms`);

    if (typeof decrypted !== 'string') {
      throw new Error("Decryption did not produce a valid string");
    }

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', {
      error: error.message,
      ivLength: iv?.length,
      ciphertextLength: ciphertext?.length,
      userId: uid
    });

    if (error.name === 'OperationError') {
      throw new Error("Decryption failed: Invalid data or wrong password");
    } else if (error.name === 'InvalidAccessError') {
      throw new Error("Decryption failed: Key access denied");
    } else if (error.message.includes('tag')) {
      throw new Error("Decryption failed: Data integrity check failed");
    } else {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }
}

// Comprehensive crypto test
export const testCrypto = async () => {
  try {
    console.log('🧪 Testing crypto functions...');

    if (!window.crypto || !window.crypto.subtle) {
      console.error('❌ Crypto APIs not available');
      return false;
    }
    
    clearMasterPassword();

    const testUserId = 'test-user-' + Date.now();
    setMasterPassword('test-master-password-123', testUserId);

    const testText = 'Hello, SecureVault! 🔒';
    console.log('📝 Original text:', testText);

    try {
      console.log('🔐 Testing encryption...');
      const encrypted = await encrypt(testText, testUserId);
      console.log('✅ Encryption successful');

      console.log('🔓 Testing decryption...');
      const decrypted = await decrypt(encrypted.ciphertext, encrypted.iv, testUserId);
      console.log('✅ Decryption successful');

      const success = testText === decrypted;
      console.log(success ? '✅ Crypto test PASSED!' : '❌ Crypto test FAILED!');

      if (!success) {
        console.error('❌ Text mismatch:', {
          original: testText,
          decrypted: decrypted
        });
      }

      return success;
    } catch (cryptoError) {
      console.error('❌ Crypto operations failed:', cryptoError);
      return false;
    }
  } catch (error) {
    console.error('❌ Crypto test failed with error:', error);
    return false;
  }
};

export const isMasterPasswordSet = () => {
  return !!(currentMasterPassword && currentUserId);
};

export const getMasterPasswordInfo = () => {
  return {
    isSet: isMasterPasswordSet(),
    userId: currentUserId,
    hasTimeout: !!passwordTimeout
  };
};

export const clearMasterPassword = () => {
  if (currentMasterPassword) {
    const passwordArray = Array.from(currentMasterPassword);
    passwordArray.fill('*');
    currentMasterPassword = null;
  }
  
  currentUserId = null;
  
  if (passwordTimeout) {
    clearTimeout(passwordTimeout);
    passwordTimeout = null;
  }
  
  console.log('🔓 Master password cleared');
};

export const clearKeyCache = () => {
  keyCache.clear();
  console.log('🧹 Key cache cleared');
};

export const extendPasswordTimeout = () => {
  if (passwordTimeout && currentMasterPassword) {
    clearTimeout(passwordTimeout);
    passwordTimeout = setTimeout(() => {
      console.log('🔒 Master password expired for security');
      clearMasterPassword();
    }, CRYPTO_CONFIG.PASSWORD_TIMEOUT);
    console.log('⏰ Password timeout extended');
    return true;
  }
  return false;
};

export const generateRandomPassword = (length = 16, options = {}) => {
  const config = {
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
    minLength: 8,
    maxLength: 128,
    ...options
  };

  if (length < config.minLength) {
    length = config.minLength;
  }
  if (length > config.maxLength) {
    length = config.maxLength;
  }

  const charsets = {
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
  };

  if (config.excludeSimilar) {
    charsets.lowercase = charsets.lowercase.replace(/[il]/g, '');
    charsets.uppercase = charsets.uppercase.replace(/[IO]/g, '');
    charsets.numbers = charsets.numbers.replace(/[01]/g, '');
  }

  if (config.excludeAmbiguous) {
    charsets.symbols = charsets.symbols.replace(/[{}()\[\]|\\\/'"`;]/g, '');
  }

  let charPool = '';
  const requiredChars = [];

  if (config.includeLowercase) {
    charPool += charsets.lowercase;
    requiredChars.push(charsets.lowercase[Math.floor(Math.random() * charsets.lowercase.length)]);
  }
  if (config.includeUppercase) {
    charPool += charsets.uppercase;
    requiredChars.push(charsets.uppercase[Math.floor(Math.random() * charsets.uppercase.length)]);
  }
  if (config.includeNumbers) {
    charPool += charsets.numbers;
    requiredChars.push(charsets.numbers[Math.floor(Math.random() * charsets.numbers.length)]);
  }
  if (config.includeSymbols) {
    charPool += charsets.symbols;
    requiredChars.push(charsets.symbols[Math.floor(Math.random() * charsets.symbols.length)]);
  }

  if (!charPool) {
    throw new Error('At least one character type must be enabled');
  }

  let password = [...requiredChars];
  
  const randomValues = crypto.getRandomValues(new Uint32Array(length - requiredChars.length));
  for (let i = 0; i < randomValues.length; i++) {
    password.push(charPool[randomValues[i] % charPool.length]);
  }

  const shuffleValues = crypto.getRandomValues(new Uint32Array(password.length));
  for (let i = password.length - 1; i > 0; i--) {
    const j = shuffleValues[i] % (i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
};

export const analyzePasswordStrength = (password) => {
  if (!password) return { strength: 'Very Weak', score: 0 };

  let score = 0;
  const analysis = {
    length: password.length,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSymbols: /[^a-zA-Z0-9]/.test(password),
    hasRepeats: /(.)\1{2,}/.test(password),
    isCommon: false
  };

  if (analysis.length >= 16) score += 25;
  else if (analysis.length >= 12) score += 20;
  else if (analysis.length >= 8) score += 10;

  if (analysis.hasLowercase) score += 5;
  if (analysis.hasUppercase) score += 5;
  if (analysis.hasNumbers) score += 5;
  if (analysis.hasSymbols) score += 10;

  if (analysis.hasRepeats) score -= 10;
  if (analysis.isCommon) score -= 20;

  let strength;
  if (score >= 70) strength = 'Very Strong';
  else if (score >= 50) strength = 'Strong';
  else if (score >= 30) strength = 'Moderate';
  else if (score >= 10) strength = 'Weak';
  else strength = 'Very Weak';

  return {
    strength,
    score: Math.max(0, Math.min(100, score)),
    analysis
  };
};

export const getCryptoConfig = () => ({ ...CRYPTO_CONFIG });
