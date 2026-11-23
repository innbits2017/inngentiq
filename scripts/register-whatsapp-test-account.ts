
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { decryptWhatsAppToken, encryptWhatsAppToken } from "../lib/whatsapp/encryption";

loadEnvConfig(process.cwd());

const ORGANIZATION_ID =
  "13358d7d-c365-4ef6-8c8e-ce15188f159e";

const WABA_ID = "189690484220374";

const PHONE_NUMBER_ID = "170443432822430";

const DISPLAY_PHONE_NUMBER = "+1 555-077-4840";

const API_VERSION =
  process.env.META_GRAPH_API_VERSION || "v27.0";

async function validateMetaToken(
  token: string,
  label: string
): Promise<boolean> {
  const url =
    `https://graph.facebook.com/${API_VERSION}/` +
    `${PHONE_NUMBER_ID}?fields=display_phone_number,verified_name`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const result = await response.json();

  console.log(`\n${label}:`, {
    success: response.ok,
    status: response.status,
    phoneNumberId: result.id ?? null,
    displayPhoneNumber:
      result.display_phone_number ?? null,
    verifiedName: result.verified_name ?? null,
    errorCode: result.error?.code ?? null,
    error: result.error?.message ?? null,
  });

  return response.ok;
}

async function main() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const accessToken =
    process.env.META_WHATSAPP_ACCESS_TOKEN;

  if (!supabaseUrl || !serviceRoleKey || !accessToken) {
    throw new Error(
      "Missing Supabase credentials or Meta access token."
    );
  }

  if (!/^v\d+\.\d+$/.test(API_VERSION)) {
    throw new Error(
      "META_GRAPH_API_VERSION is invalid."
    );
  }

  console.log("Starting WhatsApp token verification...");

  // Step 1: Validate the new token directly with Meta.
  const tokenIsValid = await validateMetaToken(
    accessToken,
    "NEW SYSTEM USER TOKEN VALIDATION"
  );

  if (!tokenIsValid) {
    throw new Error(
      "The new Meta token failed validation. Supabase was not updated."
    );
  }

  // Step 2: Connect to Supabase.
  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  // Step 3: Encrypt the validated token.
  const encryptedToken =
    encryptWhatsAppToken(accessToken);

  // Step 4: Find the existing WhatsApp account.
  const {
    data: existing,
    error: lookupError,
  } = await supabase
    .from("whatsapp_business_accounts")
    .select("id, organization_id")
    .eq("phone_number_id", PHONE_NUMBER_ID)
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `Account lookup failed: ${lookupError.message}`
    );
  }

  if (
    existing &&
    existing.organization_id !== ORGANIZATION_ID
  ) {
    throw new Error(
      "This WhatsApp number belongs to another workspace."
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

  // Step 5: Update the existing account or insert it.
  const saveResult = existing
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

  if (saveResult.error || !saveResult.data) {
    throw new Error(
      `Supabase registration failed: ${
        saveResult.error?.message || "No account returned"
      }`
    );
  }

  console.log("\nSupabase account updated successfully.");

  // Step 6: Read the encrypted token back from Supabase.
  const {
    data: savedAccount,
    error: readError,
  } = await supabase
    .from("whatsapp_business_accounts")
    .select(
      "id, phone_number_id, access_token_encrypted, connection_status"
    )
    .eq("id", saveResult.data.id)
    .single();

  if (readError || !savedAccount) {
    throw new Error(
      `Could not read saved account: ${readError?.message}`
    );
  }

  // Step 7: Decrypt the actual database value.
  const decryptedToken = decryptWhatsAppToken(
    savedAccount.access_token_encrypted
  );

  // Step 8: Verify the decrypted database token with Meta.
  const storedTokenIsValid = await validateMetaToken(
    decryptedToken,
    "TOKEN READ BACK FROM SUPABASE"
  );

  if (!storedTokenIsValid) {
    throw new Error(
      "The token retrieved from Supabase failed Meta validation."
    );
  }

  // Step 9: Confirm the decrypted token matches the supplied token.
  if (decryptedToken !== accessToken) {
    throw new Error(
      "The decrypted database token does not match the supplied token."
    );
  }

  console.log("\n================================");
  console.log("WHATSAPP TOKEN VERIFICATION PASSED");
  console.log("================================");
  console.log("Workspace: Innbits Technologies");
  console.log("Account ID:", savedAccount.id);
  console.log(
    "Phone Number ID:",
    savedAccount.phone_number_id
  );
  console.log(
    "Connection status:",
    savedAccount.connection_status
  );
  console.log("Meta token validation: SUCCESS");
  console.log("Supabase decryption: SUCCESS");
  console.log("Token comparison: MATCH");
  console.log("Token stored encrypted: YES");
}

main()
  .catch((error) => {
    console.error(
      "\nWhatsApp registration/verification failed:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    process.exitCode = 1;
  })
  .finally(() => {
    delete process.env.META_WHATSAPP_ACCESS_TOKEN;
  });
