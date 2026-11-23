
import { decryptWhatsAppToken } from "@/lib/whatsapp/encryption";

interface SendWhatsAppMessageParams {
  phoneNumberId: string;
  encryptedAccessToken: string;
  recipientPhone: string;
  message: string;
}

interface WhatsAppSendResponse {
  messages?: Array<{
    id: string;
  }>;
  error?: {
    message?: string;
    code?: number;
    type?: string;
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
    throw new Error("Missing required WhatsApp message parameters.");
  }

  // Decrypt the account-specific access token.
  const accessToken = decryptWhatsAppToken(encryptedAccessToken);

  const apiVersion = process.env.META_GRAPH_API_VERSION;

  if (!apiVersion || !/^v\d+\.\d+$/.test(apiVersion)) {
    throw new Error("META_GRAPH_API_VERSION is not configured correctly.");
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

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

  const result =
    (await response.json()) as WhatsAppSendResponse;

  if (!response.ok) {
    console.error("WhatsApp API request failed:", {
      status: response.status,
      code: result.error?.code,
      type: result.error?.type,
      message: result.error?.message,
    });

    throw new Error(
      result.error?.message || "WhatsApp message delivery failed."
    );
  }

  const messageId = result.messages?.[0]?.id;

  if (!messageId) {
    throw new Error("WhatsApp API did not return a message ID.");
  }

  return messageId;
}
