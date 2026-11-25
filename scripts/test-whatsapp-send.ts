
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = "170443432822430";
  const apiVersion = "v26.0";

  if (!token) {
    throw new Error("Meta access token missing.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "919036082478",
        type: "text",
        text: {
          preview_url: false,
          body: "Testing Inngentiq local API",
        },
      }),
    }
  );

  const result = await response.json();

  console.log("HTTP Status:", response.status);
  console.log("Meta response:", JSON.stringify(result, null, 2));

  if (!response.ok) {
    throw new Error("WhatsApp API request failed.");
  }

  console.log("WhatsApp message accepted successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
