/**
 * END-TO-END ENCRYPTION (E2EE) PROVIDER
 * Uses native Web Crypto API for maximum security.
 * Logic: RSA-OAEP 2048 for key exchange, AES-GCM 256 for content.
 */

const KEY_ALGO = {
  name: "RSA-OAEP",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

const SYMM_ALGO = {
  name: "AES-GCM",
  length: 256,
};

// --- Storage Keys ---
const PRIVATE_KEY_STORAGE = "samarpan_chat_private_v1";
const PUBLIC_KEY_STORAGE = "samarpan_chat_public_v1";

/**
 * Generate a new RSA-OAEP Key Pair for the user.
 */
export async function generateChatKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    KEY_ALGO,
    true, // extractable
    ["encrypt", "decrypt"]
  );

  const publicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

  localStorage.setItem(PUBLIC_KEY_STORAGE, JSON.stringify(publicKey));
  localStorage.setItem(PRIVATE_KEY_STORAGE, JSON.stringify(privateKey));

  return { publicKey, privateKey };
}

/**
 * Get the current user's Keys from localStorage.
 */
export function getLocalKeys() {
  const pub = localStorage.getItem(PUBLIC_KEY_STORAGE);
  const priv = localStorage.getItem(PRIVATE_KEY_STORAGE);
  if (!pub || !priv) return null;
  return { publicKey: JSON.parse(pub), privateKey: JSON.parse(priv) };
}

/**
 * Encrypt a message string for a specific recipient.
 * @param content Plain text message
 * @param recipientPublicKeyJWK Recipient's public key from the server
 */
export async function encryptChatMessage(content: string, recipientPublicKeyJWK: string) {
  try {
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      JSON.parse(recipientPublicKeyJWK),
      KEY_ALGO,
      true,
      ["encrypt"]
    );

    // 1. Generate a one-time AES key
    const aesKey = await window.crypto.subtle.generateKey(
      SYMM_ALGO,
      true,
      ["encrypt", "decrypt"]
    );

    // 2. Encrypt content with AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedContent = new TextEncoder().encode(content);
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      encodedContent
    );

    // 3. Encrypt AES key with Recipient's RSA Public Key
    const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    const encryptedAesKey = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      exportedAesKey
    );

    // 4. Return the bundle
    return JSON.stringify({
      eak: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey))), // Encrypted AES Key
      iv: btoa(String.fromCharCode(...iv)), // Initialization Vector
      ct: btoa(String.fromCharCode(...new Uint8Array(encryptedContent))), // Ciphertext
      v: 1 // version
    });
  } catch (err) {
    console.error("Encryption failed", err);
    throw new Error("Neural encryption failed");
  }
}

/**
 * Decrypt a message bundle using the local private key.
 */
export async function decryptChatMessage(bundleBase64: string) {
  try {
    const keys = getLocalKeys();
    if (!keys) throw new Error("Private key missing");

    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      keys.privateKey,
      KEY_ALGO,
      true,
      ["decrypt"]
    );

    const bundle = JSON.parse(bundleBase64);
    
    // Decode from Base64
    const encryptedAesKey = new Uint8Array(atob(bundle.eak).split("").map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(bundle.iv).split("").map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(bundle.ct).split("").map(c => c.charCodeAt(0)));

    // 1. Decrypt AES Key using RSA Private Key
    const decryptedAesKeyRaw = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedAesKey
    );

    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      decryptedAesKeyRaw,
      SYMM_ALGO,
      true,
      ["decrypt"]
    );

    // 2. Decrypt content using AES Key
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      ciphertext
    );

    return new TextDecoder().decode(decryptedContent);
  } catch (err) {
    console.warn("Decryption failed. This may be an old message or keys shifted.", err);
    return "[LOCKED: Neural Key Mismatch]";
  }
}
