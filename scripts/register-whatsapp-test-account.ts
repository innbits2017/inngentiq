
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { encryptWhatsAppToken } from "../lib/whatsapp/encryption";

loadEnvConfig(process.cwd());

const ORGANIZATION_ID = "13358d7d-c365-4ef6-8c8e-ce15188f159e";
const WABA_ID = "189690484220374";
const PHONE_NUMBER_ID = "170443432822430";
const DISPLAY_PHONE_NUMBER = "+1 555-077-4840";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

  if (!supabaseUrl || !serviceRoleKey || !accessToken) {
    throw new Error(
      "Missing Supabase credentials or Meta access token."
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Encrypt the Meta token before database storage.
  const encryptedToken = encryptWhatsAppToken(accessToken);

  // Check whether this phone number is already registered.
  const { data: existing, error: lookupError } = await supabase
    .from("whatsapp_business_accounts")
    .select("id, organization_id")
    .eq("phone_number_id", PHONE_NUMBER_ID)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Account lookup failed: ${lookupError.message}`);
  }

  if (existing && existing.organization_id !== ORGANIZATION_ID) {
    throw new Error(
      "This phone number is already assigned to another workspace. Registration stopped."
    );
  }

  const accountData = {
    organization_id: ORGANIZATION_ID,
    waba_id: WABA_ID,
    phone_number_id: PHONE_NUMBER_ID,
    display_phone_number: DISPLAY_PHONE_NUMBER,
    access_token_encrypted: encryptedToken,
    connection_status: "connected",
    updated_at: new Date().toISOString(),
  };

  const result = existing
    ? await supabase
        .from("whatsapp_business_accounts")
        .update(accountData)
        .eq("id", existing.id)
        .select("id")
        .single()
    : await supabase
        .from("whatsapp_business_accounts")
        .insert(accountData)
        .select("id")
        .single();

  if (result.error) {
    throw new Error(`Registration failed: ${result.error.message}`);
  }

  console.log("WhatsApp test account registered successfully.");
  console.log("Workspace: Innbits Technologies");
  console.log("Phone Number ID:", PHONE_NUMBER_ID);
  console.log("Connection status: connected");
  console.log("Token stored encrypted.");
}

main()
  .catch((error) => {
    console.error("WhatsApp registration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    delete process.env.META_WHATSAPP_ACCESS_TOKEN;
  });
