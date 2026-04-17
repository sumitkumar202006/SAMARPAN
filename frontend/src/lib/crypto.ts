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
    const recipientKey = await window.crypto.subtle.importKey(
      "jwk",
      JSON.parse(recipientPublicKeyJWK),
      KEY_ALGO,
      true,
      ["encrypt"]
    );

    const localKeys = getLocalKeys();
    let senderKey = null;
    if (localKeys) {
      senderKey = await window.crypto.subtle.importKey(
        "jwk",
        localKeys.publicKey,
        KEY_ALGO,
        true,
        ["encrypt"]
      );
    }

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

    // 3. Encrypt AES key for BOTH parties
    const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    
    // Encrypt for Recipient
    const encryptedAesKeyRec = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      recipientKey,
      exportedAesKey
    );

    // Encrypt for Sender (Self-Decryption)
    let encryptedAesKeySen = "";
    if (senderKey) {
      const encryptedRaw = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        senderKey,
        exportedAesKey
      );
      encryptedAesKeySen = btoa(String.fromCharCode(...new Uint8Array(encryptedRaw)));
    }

    // 4. Return the bundle
    return JSON.stringify({
      eak: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKeyRec))), // Primary (Recipient)
      seak: encryptedAesKeySen, // Secondary (Sender/Self)
      iv: btoa(String.fromCharCode(...iv)),
      ct: btoa(String.fromCharCode(...new Uint8Array(encryptedContent))),
      v: 2
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
    
    // Choose which encrypted key to use (Recipient or Sender)
    // We try the primary (eak) first, then the self-recovery key (seak)
    const possibleKeys = [bundle.eak, bundle.seak].filter(Boolean);
    
    let decryptedAesKeyRaw = null;
    let lastError = null;

    for (const encKeyStr of possibleKeys) {
      try {
        const encryptedAesKey = new Uint8Array(atob(encKeyStr).split("").map(c => c.charCodeAt(0)));
        decryptedAesKeyRaw = await window.crypto.subtle.decrypt(
          { name: "RSA-OAEP" },
          privateKey,
          encryptedAesKey
        );
        if (decryptedAesKeyRaw) break;
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!decryptedAesKeyRaw) {
      throw lastError || new Error("No usable key found in bundle");
    }

    const iv = new Uint8Array(atob(bundle.iv).split("").map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(bundle.ct).split("").map(c => c.charCodeAt(0)));

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
