const crypto = require("crypto");
const { config } = require("../config/env");

function getEncryptionKey() {
  const envKey = config.ENCRYPTION_KEY;
  if (!envKey) throw new Error("ENCRYPTION_KEY manquante");
  const isHex = /^[0-9a-fA-F]{64}$/.test(envKey);
  const keyBuffer = isHex
    ? Buffer.from(envKey, "hex")
    : Buffer.from(envKey, "utf8");
  if (keyBuffer.length !== 32)
    throw new Error("ENCRYPTION_KEY invalide: attendez 32 octets (64 hex)");
  return keyBuffer;
}

function encrypt(text) {
  const algorithm = "aes-256-gcm";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return {
    encrypted,
    authTag: authTag.toString("hex"),
    iv: iv.toString("hex"),
  };
}

function decrypt(encryptedData) {
  const algorithm = "aes-256-gcm";
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encryptedData.iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, "hex"));
  let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { getEncryptionKey, encrypt, decrypt };
