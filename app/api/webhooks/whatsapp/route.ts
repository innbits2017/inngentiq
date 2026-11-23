
import { NextRequest, NextResponse } from "next/server";
import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { processWhatsAppMessage } from "../../../../lib/whatsapp/process-message";
import { sendWhatsAppMessage } from "../../../../lib/whatsapp/send-message";

export const runtime = "nodejs";
export const maxDuration = 60;

interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp?: string;
  type: string;
  text?: {
    body: string;
  };
  profile?: {
    name?: string;
  };
}

interface WhatsAppWebhookValue {
  metadata?: {
    phone_number_id?: string;
    display_phone_number?: string;
  };
  contacts?: Array<{
    profile?: {
      name?: string;
    };
    wa_id?: string;
  }>;
  messages?: WhatsAppMessage[];
}

interface WhatsAppWebhookBody {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: WhatsAppWebhookValue;
    }>;
  }>;
}

function verifySignature(
  rawBody: string,
  signature: string | null,
  appSecret: string
): boolean {
  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }

  const expected =
    "sha256=" +
    createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

// Meta webhook subscription verification.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token &&
    verifyToken &&
    token === verifyToken &&
    challenge
  ) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json(
    { success: false, error: "Webhook verification failed" },
    { status: 403 }
  );
}

// Find the account, workspace and default AI agent.
async function getWhatsAppAccount(phoneNumberId: string) {
  const { data: account, error: accountError } =
    await supabaseAdmin
      .from("whatsapp_business_accounts")
      .select(`
        id,
        organization_id,
        phone_number_id,
        access_token_encrypted,
        connection_status
      `)
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

  if (accountError) {
    throw accountError;
  }

  if (!account || account.connection_status !== "connected") {
    throw new Error("WhatsApp account not found or disconnected.");
  }

  const { data: organization, error: organizationError } =
    await supabaseAdmin
      .from("organizations")
      .select("id, default_whatsapp_agent_id")
      .eq("id", account.organization_id)
      .single();

  if (organizationError || !organization) {
    throw new Error("WhatsApp workspace not found.");
  }

  const agentId = organization.default_whatsapp_agent_id;

  if (!agentId) {
    throw new Error("No default WhatsApp AI agent configured.");
  }

  const { data: agent, error: agentError } =
    await supabaseAdmin
      .from("agents")
      .select("id")
      .eq("id", agentId)
      .eq("organization_id", account.organization_id)
      .eq("is_active", true)
      .single();

  if (agentError || !agent) {
    throw new Error("Default WhatsApp AI agent is unavailable.");
  }

  return {
    account,
    agent,
  };
}

// Find or create the customer's WhatsApp conversation.
async function getOrCreateConversation(params: {
  accountId: string;
  agentId: string;
  visitorPhone: string;
  visitorName: string | null;
}) {
  const {
    accountId,
    agentId,
    visitorPhone,
    visitorName,
  } = params;

  const { data: existing, error: lookupError } =
    await supabaseAdmin
      .from("conversations")
      .select("id, status, human_handover, assigned_to")
      .eq("whatsapp_business_account_id", accountId)
      .eq("agent_id", agentId)
      .eq("visitor_id", visitorPhone)
      .eq("channel", "whatsapp")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existing) {
    return existing;
  }

  const { data: created, error: createError } =
    await supabaseAdmin
      .from("conversations")
      .insert({
        agent_id: agentId,
        whatsapp_business_account_id: accountId,
        visitor_id: visitorPhone,
        visitor_phone: visitorPhone,
        visitor_name: visitorName,
        channel: "whatsapp",
        status: "open",
        human_handover: false,
      })
      .select("id, status, human_handover, assigned_to")
      .single();

  if (createError || !created) {
    throw createError || new Error("Conversation creation failed.");
  }

  return created;
}

// Atomically claim a message for processing.
async function claimMessage(messageId: string) {
  const { data, error } = await supabaseAdmin
    .from("conversation_messages")
    .update({
      processing_status: "processing",
    })
    .eq("id", messageId)
    .eq("processing_status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

// Process one incoming WhatsApp text message.
async function handleIncomingMessage(
  message: WhatsAppMessage,
  value: WhatsAppWebhookValue
) {
  if (message.type !== "text" || !message.text?.body?.trim()) {
    return;
  }

  const phoneNumberId = value.metadata?.phone_number_id;

  if (!phoneNumberId) {
    throw new Error("WhatsApp phone number ID is missing.");
  }

  const visitorPhone = message.from;
  const messageText = message.text.body.trim();

  const contact = value.contacts?.find(
    (item) => item.wa_id === visitorPhone
  );

  const visitorName =
    contact?.profile?.name ||
    message.profile?.name ||
    null;

  const { account, agent } =
    await getWhatsAppAccount(phoneNumberId);

  const conversation = await getOrCreateConversation({
    accountId: account.id,
    agentId: agent.id,
    visitorPhone,
    visitorName,
  });

  // Store the inbound message.
  const { data: insertedMessage, error: insertError } =
    await supabaseAdmin
      .from("conversation_messages")
      .insert({
        conversation_id: conversation.id,
        role: "user",
        content: messageText,
        external_message_id: message.id,
        processing_status: "pending",
      })
      .select("id")
      .single();

  let inboundMessageId: string | null =
    insertedMessage?.id || null;

  if (insertError) {
    if (insertError.code !== "23505") {
      throw insertError;
    }

    // This Meta message was already received.
    const { data: existingMessage, error: existingError } =
      await supabaseAdmin
        .from("conversation_messages")
        .select("id, processing_status")
        .eq("external_message_id", message.id)
        .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existingMessage) {
      throw new Error("Duplicate message record could not be found.");
    }

    if (
      existingMessage.processing_status === "completed" ||
      existingMessage.processing_status === "processing"
    ) {
      return;
    }

    if (existingMessage.processing_status === "failed") {
      const { error: resetError } = await supabaseAdmin
        .from("conversation_messages")
        .update({ processing_status: "pending" })
        .eq("id", existingMessage.id)
        .eq("processing_status", "failed");

      if (resetError) {
        throw resetError;
      }
    }

    inboundMessageId = existingMessage.id;
  }

  if (!inboundMessageId) {
    throw new Error("Incoming message could not be saved.");
  }

  const claimed = await claimMessage(inboundMessageId);

  if (!claimed) {
    return;
  }

  const now = new Date().toISOString();

  await supabaseAdmin
    .from("conversations")
    .update({
      last_message_at: now,
      updated_at: now,
      visitor_name: visitorName || undefined,
    })
    .eq("id", conversation.id);

  try {
    // Do not automatically reply during human handover
    // or after the conversation has been resolved.
    if (
      conversation.human_handover ||
      conversation.status === "resolved"
    ) {
      await supabaseAdmin
        .from("conversation_messages")
        .update({ processing_status: "completed" })
        .eq("id", inboundMessageId);

      return;
    }

    // Generate the AI response using conversation history.
    const answer = await processWhatsAppMessage({
      agentId: agent.id,
      conversationId: conversation.id,
      message: messageText,
      excludeMessageId: inboundMessageId,
    });

    // Send the response through Meta Cloud API.
    const outgoingMessageId = await sendWhatsAppMessage({
      phoneNumberId: account.phone_number_id,
      encryptedAccessToken: account.access_token_encrypted,
      recipientPhone: visitorPhone,
      message: answer,
    });

    // Save the outgoing message in the existing Inbox.
    const { error: outgoingError } =
      await supabaseAdmin
        .from("conversation_messages")
        .insert({
          conversation_id: conversation.id,
          role: "assistant",
          content: answer,
          external_message_id: outgoingMessageId,
          processing_status: "completed",
        });

    if (outgoingError) {
      // Meta may already have delivered the response.
      // Do not send it again automatically.
      console.error(
        "WhatsApp reply delivered but database save failed:",
        outgoingError.message
      );

      throw outgoingError;
    }

    const completedAt = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("conversation_messages")
      .update({ processing_status: "completed" })
      .eq("id", inboundMessageId);

    if (updateError) {
      throw updateError;
    }

    await supabaseAdmin
      .from("conversations")
      .update({
        last_message_at: completedAt,
        updated_at: completedAt,
      })
      .eq("id", conversation.id);

  } catch (error) {
    await supabaseAdmin
      .from("conversation_messages")
      .update({ processing_status: "failed" })
      .eq("id", inboundMessageId);

    throw error;
  }
}

// Receive WhatsApp webhook events.
export async function POST(request: NextRequest) {
  try {
    const appSecret = process.env.META_APP_SECRET;

    if (!appSecret) {
      console.error("META_APP_SECRET is not configured");

      return NextResponse.json(
        { success: false, error: "Webhook configuration error" },
        { status: 500 }
      );
    }

    const rawBody = await request.text();

    const signature = request.headers.get(
      "x-hub-signature-256"
    );

    if (!verifySignature(rawBody, signature, appSecret)) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody) as WhatsAppWebhookBody;

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json(
        { success: false, error: "Unsupported webhook object" },
        { status: 400 }
      );
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages" || !change.value) {
          continue;
        }

        for (const message of change.value.messages || []) {
          await handleIncomingMessage(message, change.value);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(
      "WhatsApp webhook processing error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        success: false,
        error: "WhatsApp webhook processing failed",
      },
      { status: 500 }
    );
  }
}
