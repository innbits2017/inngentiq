
import { createHash } from "node:crypto";
import { decryptWhatsAppToken } from "@/lib/whatsapp/encryption";

interface SendWhatsAppMessageParams {
  phoneNumberId: string;
  encryptedAccessToken: string;
  recipientPhone: string;
  message: string;
}

interface WhatsAppSendResponse {
  messaging_product?: string;
  contacts?: Array<{
    input?: string;
    wa_id?: string;
  }>;
  messages?: Array<{
    id: string;
  }>;
  error?: {
    message?: string;
    code?: number;
    type?: string;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export async function sendWhatsAppMessage({
  phoneNumberId,
  encryptedAccessToken,
  recipientPhone,
  message,
}: SendWhatsAppMessageParams): Promise<string> {
  if (
    !phoneNumberId ||
    !encryptedAccessToken ||
    !recipientPhone ||
    !message.trim()
  ) {
    throw new Error(
      "Missing required WhatsApp message parameters."
    );
  }

  // Step 1: Decrypt the account-specific access token.
  const accessToken = decryptWhatsAppToken(
    encryptedAccessToken
  );

  if (!accessToken) {
    throw new Error(
      "WhatsApp access token could not be decrypted."
    );
  }

  // Step 2: Generate a safe token fingerprint.
  // Never log the actual token or encryption key.
  const tokenFingerprint = createHash("sha256")
    .update(accessToken)
    .digest("hex");

  console.log(
    "WhatsApp production token fingerprint:",
    {
      fingerprint: tokenFingerprint,
      tokenLength: accessToken.length,
    }
  );

  // Step 3: Production configuration diagnostics.
  const apiVersion =
    process.env.META_GRAPH_API_VERSION;

  console.log("Production WhatsApp configuration:", {
    tokenDecrypted: true,
    tokenLength: accessToken.length,
    phoneNumberId,
    encryptionKeyConfigured: Boolean(
      process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY
    ),
    apiVersion,
  });

  if (
    !apiVersion ||
    !/^v\d+\.\d+$/.test(apiVersion)
  ) {
    throw new Error(
      "META_GRAPH_API_VERSION is not configured correctly."
    );
  }

  // Step 4: Prepare WhatsApp Cloud API request.
  const url =
    `https://graph.facebook.com/${apiVersion}/` +
    `${phoneNumberId}/messages`;

  console.log("Sending WhatsApp Cloud API request:", {
    phoneNumberId,
    apiVersion,
    recipientPhonePresent: Boolean(recipientPhone),
    messageLength: message.length,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientPhone,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    }),
    cache: "no-store",
  });

  // Step 5: Read Meta response.
  const result =
    (await response.json()) as WhatsAppSendResponse;

  if (!response.ok) {
    console.error("WhatsApp API request failed:", {
      status: response.status,
      code: result.error?.code,
      subcode: result.error?.error_subcode,
      type: result.error?.type,
      message: result.error?.message,
      fbtraceId: result.error?.fbtrace_id,
    });

    throw new Error(
      result.error?.message ||
        "WhatsApp message delivery failed."
    );
  }

  // Step 6: Verify returned message ID.
  const messageId = result.messages?.[0]?.id;

  if (!messageId) {
    throw new Error(
      "WhatsApp API did not return a message ID."
    );
  }

  console.log("WhatsApp message accepted by Meta:", {
    messageId,
    phoneNumberId,
    responseStatus: response.status,
  });

  return messageId;
}
