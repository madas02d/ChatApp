/**
 * End-to-End Encryption Utilities
 * Uses Web Crypto API for AES-GCM encryption
 */

/**
 * Generate a new encryption key for a conversation
 * @returns {Promise<CryptoKey>}
 */
export async function generateEncryptionKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive a shared key from a password using PBKDF2
 * @param {string} password - The password to derive key from
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKeyFromPassword(password, salt) {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a key to a string format for storage
 * @param {CryptoKey} key - The key to export
 * @returns {Promise<string>}
 */
export async function exportKey(key) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import a key from a string format
 * @param {string} keyString - The key string to import
 * @returns {Promise<CryptoKey>}
 */
export async function importKey(keyString) {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random IV (Initialization Vector) for encryption
 * @returns {Uint8Array}
 */
function generateIV() {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Encrypt text content using AES-GCM
 * @param {string} text - The text to encrypt
 * @param {CryptoKey} key - The encryption key
 * @returns {Promise<string>} - Base64 encoded encrypted data with IV
 */
export async function encryptText(text, key) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const iv = generateIV();
    
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      key,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt text content using AES-GCM
 * @param {string} encryptedText - The base64 encoded encrypted text with IV
 * @param {CryptoKey} key - The decryption key
 * @returns {Promise<string>} - The decrypted text
 */
export async function decryptText(encryptedText, key) {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    // Don't log expected decryption errors (wrong key, corrupted data, etc.)
    // These are handled gracefully by the calling component
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Encrypt a file/blob using AES-GCM
 * @param {Blob} file - The file to encrypt
 * @param {CryptoKey} key - The encryption key
 * @returns {Promise<Blob>} - Encrypted blob
 */
export async function encryptFile(file, key) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const iv = generateIV();
    
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      key,
      arrayBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return new Blob([combined], { type: 'application/octet-stream' });
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt a file/blob using AES-GCM
 * @param {Blob} encryptedBlob - The encrypted blob
 * @param {CryptoKey} key - The decryption key
 * @returns {Promise<Blob>} - Decrypted blob
 */
export async function decryptFile(encryptedBlob, key) {
  try {
    const arrayBuffer = await encryptedBlob.arrayBuffer();
    const combined = new Uint8Array(arrayBuffer);
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      key,
      encryptedData
    );

    return new Blob([decryptedData]);
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
}

/**
 * Key exchange utility - generates a key pair for key exchange
 * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
 */
export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Derive a shared secret from a key pair
 * @param {CryptoKey} privateKey - Our private key
 * @param {CryptoKey} publicKey - Other party's public key
 * @returns {Promise<CryptoKey>}
 */
export async function deriveSharedSecret(privateKey, publicKey) {
  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Simple key storage in localStorage (in production, use secure storage)
 */
export const keyStorage = {
  async saveConversationKey(conversationId, key) {
    const keyString = await exportKey(key);
    localStorage.setItem(`e2e_key_${conversationId}`, keyString);
  },

  async getConversationKey(conversationId) {
    const keyString = localStorage.getItem(`e2e_key_${conversationId}`);
    if (!keyString) return null;
    return await importKey(keyString);
  },

  removeConversationKey(conversationId) {
    localStorage.removeItem(`e2e_key_${conversationId}`);
  },
};





