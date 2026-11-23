
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const keyHex = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY;

  if (!keyHex || !/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error(
      "WHATSAPP_TOKEN_ENCRYPTION_KEY must be a valid 64-character hexadecimal key."
    );
  }

  const key = Buffer.from(keyHex, "hex");

  if (key.length !== KEY_LENGTH) {
    throw new Error("Invalid WhatsApp encryption key length.");
  }

  return key;
}

export function encryptWhatsAppToken(token: string): string {
  if (!token) {
    throw new Error("WhatsApp access token cannot be empty.");
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptWhatsAppToken(encryptedToken: string): string {
  const parts = encryptedToken.split(":");

  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid encrypted WhatsApp token format.");
  }

  const [, ivHex, authTagHex, encryptedHex] = parts;

  if (
    !/^[0-9a-fA-F]{24}$/.test(ivHex) ||
    !/^[0-9a-fA-F]{32}$/.test(authTagHex) ||
    !/^(?:[0-9a-fA-F]{2})+$/.test(encryptedHex)
  ) {
    throw new Error("Invalid encrypted WhatsApp token data.");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
