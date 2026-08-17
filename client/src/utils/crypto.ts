/**
 * End-to-End Encryption Engine for LoopIN using Web Crypto API (SubtleCrypto)
 * - RSA-OAEP 2048-bit for asymmetric key exchange
 * - AES-GCM 256-bit with 12-byte IV for symmetric payload encryption
 */

// Helper: Convert ArrayBuffer to Base64
const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Helper: Convert Base64 to ArrayBuffer
const base64ToBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// -----------------------------------------------------------------------------
// 1. RSA-OAEP Key Pair (User Identity Keys)
// -----------------------------------------------------------------------------

export interface UserKeyPair {
  publicKeyJwk: string;
  privateKeyJwk: string;
}

export const generateRSAKeyPair = async (): Promise<UserKeyPair> => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

  return {
    publicKeyJwk: JSON.stringify(publicKeyJwk),
    privateKeyJwk: JSON.stringify(privateKeyJwk),
  };
};

export const importRSAPublicKey = async (jwkStr: string): Promise<CryptoKey> => {
  const jwk = JSON.parse(jwkStr);
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
};

export const importRSAPrivateKey = async (jwkStr: string): Promise<CryptoKey> => {
  const jwk = JSON.parse(jwkStr);
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
};

// -----------------------------------------------------------------------------
// 2. AES-256-GCM Conversation Keys
// -----------------------------------------------------------------------------

export const generateAESKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const exportAESKeyBase64 = async (aesKey: CryptoKey): Promise<string> => {
  const raw = await window.crypto.subtle.exportKey('raw', aesKey);
  return bufferToBase64(raw);
};

export const importAESKeyBase64 = async (rawBase64: string): Promise<CryptoKey> => {
  const rawBuffer = base64ToBuffer(rawBase64);
  return await window.crypto.subtle.importKey(
    'raw',
    rawBuffer,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
};

// Encrypt an AES key for a specific user using their RSA Public Key
export const encryptAESKeyForUser = async (
  aesKey: CryptoKey,
  recipientPublicKeyJwk: string
): Promise<string> => {
  const recipientPublicKey = await importRSAPublicKey(recipientPublicKeyJwk);
  const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    recipientPublicKey,
    rawAesKey
  );
  return bufferToBase64(encryptedKeyBuffer);
};

// Decrypt an AES key using the current user's RSA Private Key
export const decryptAESKeyWithUserKey = async (
  encryptedKeyBase64: string,
  userPrivateKeyJwk: string
): Promise<CryptoKey> => {
  const userPrivateKey = await importRSAPrivateKey(userPrivateKeyJwk);
  const encryptedBuffer = base64ToBuffer(encryptedKeyBase64);
  const decryptedRawAesKey = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    userPrivateKey,
    encryptedBuffer
  );
  return await window.crypto.subtle.importKey(
    'raw',
    decryptedRawAesKey,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
};

// -----------------------------------------------------------------------------
// 3. Payload Encryption & Decryption (Text, Image URL, Audio URL)
// -----------------------------------------------------------------------------

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
}

export interface DecryptedPayload {
  textContent?: string;
  imageUrl?: string;
  audioUrl?: string;
}

export const encryptPayload = async (
  payload: DecryptedPayload,
  aesKey: CryptoKey
): Promise<EncryptedPayload> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const dataToEncrypt = encoder.encode(JSON.stringify(payload));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    dataToEncrypt
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv.buffer),
  };
};

export const decryptPayload = async (
  ciphertextBase64: string,
  ivBase64: string,
  aesKey: CryptoKey
): Promise<DecryptedPayload> => {
  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
    aesKey,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonString);
};

// Local Storage Key Management Utilities
const RSA_PRIVATE_KEY_STORAGE_PREFIX = 'loopin_rsa_private_key_';
const RSA_PUBLIC_KEY_STORAGE_PREFIX = 'loopin_rsa_public_key_';

export const getStoredUserKeyPair = (userId: string): UserKeyPair | null => {
  const priv = localStorage.getItem(`${RSA_PRIVATE_KEY_STORAGE_PREFIX}${userId}`);
  const pub = localStorage.getItem(`${RSA_PUBLIC_KEY_STORAGE_PREFIX}${userId}`);
  if (priv && pub) {
    return { privateKeyJwk: priv, publicKeyJwk: pub };
  }
  return null;
};

export const storeUserKeyPair = (userId: string, keyPair: UserKeyPair): void => {
  localStorage.setItem(`${RSA_PRIVATE_KEY_STORAGE_PREFIX}${userId}`, keyPair.privateKeyJwk);
  localStorage.setItem(`${RSA_PUBLIC_KEY_STORAGE_PREFIX}${userId}`, keyPair.publicKeyJwk);
};
