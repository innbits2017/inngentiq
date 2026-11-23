
import { loadEnvConfig } from "@next/env";
import {
  encryptWhatsAppToken,
  decryptWhatsAppToken,
} from "../lib/whatsapp/encryption";

loadEnvConfig(process.cwd());

const testToken = "inngentiq-test-token-12345";

try {
  const encrypted = encryptWhatsAppToken(testToken);
  const decrypted = decryptWhatsAppToken(encrypted);

  console.log("Encryption successful:", encrypted !== testToken);
  console.log("Decryption successful:", decrypted === testToken);

  if (decrypted !== testToken) {
    throw new Error("Decryption result does not match the original token.");
  }

  console.log("WhatsApp encryption test passed.");
} catch (error) {
  console.error("WhatsApp encryption test failed:", error);
  process.exitCode = 1;
}
