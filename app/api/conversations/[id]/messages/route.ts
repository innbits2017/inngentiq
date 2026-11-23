
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send-message";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getAuthenticatedOrganization() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, organizationId: null };
  }

  const { data: membership, error: membershipError } =
    await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

  if (membershipError) {
    console.error("Membership lookup error:", membershipError);
  }

  let organizationId = membership?.organization_id;

  if (!organizationId) {
    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("user_profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
    }

    organizationId = profile?.organization_id;
  }

  return { user, organizationId };
}

async function getOwnedConversation(
  conversationId: string,
  organizationId: string
) {
  const { data: conversation, error } = await supabaseAdmin
    .from("conversations")
    .select(`
      id,
      agent_id,
      visitor_id,
      visitor_phone,
      channel,
      whatsapp_business_account_id,
      status,
      assigned_to,
      human_handover,
      agents!inner (
        organization_id
      )
    `)
    .eq("id", conversationId)
    .eq("agents.organization_id", organizationId)
    .maybeSingle();

  if (error) {
    console.error("Conversation lookup error:", error);
    throw error;
  }

  return conversation;
}

// GET: Load complete conversation history
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { user, organizationId } =
      await getAuthenticatedOrganization();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const { id } = await params;

    const conversation = await getOwnedConversation(
      id,
      organizationId
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const { data: messages, error } = await supabaseAdmin
      .from("conversation_messages")
      .select("id, conversation_id, role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch conversation messages error:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      conversationId: id,
      messages: messages || [],
    });
  } catch (error) {
    console.error("Get conversation messages error:", error);

    return NextResponse.json(
      { error: "Unable to load conversation messages" },
      { status: 500 }
    );
  }
}

// POST: Send a human team member reply
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { user, organizationId } =
      await getAuthenticatedOrganization();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const { id } = await params;

    const body = await request.json();

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: "Message is too long" },
        { status: 400 }
      );
    }

    const conversation = await getOwnedConversation(
      id,
      organizationId
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.status === "resolved") {
      return NextResponse.json(
        {
          error:
            "This conversation is resolved. Reopen it before replying.",
        },
        { status: 409 }
      );
    }

    let externalMessageId: string | null = null;

    // Send the reply through WhatsApp Cloud API
    // only for WhatsApp conversations.
    if (conversation.channel === "whatsapp") {
      if (!conversation.whatsapp_business_account_id) {
        return NextResponse.json(
          {
            error:
              "WhatsApp Business Account is not linked to this conversation.",
          },
          { status: 400 }
        );
      }

      if (!conversation.visitor_phone) {
        return NextResponse.json(
          {
            error:
              "Customer WhatsApp phone number is missing from this conversation.",
          },
          { status: 400 }
        );
      }

      const { data: whatsappAccount, error: accountError } =
        await supabaseAdmin
          .from("whatsapp_business_accounts")
          .select(`
            id,
            phone_number_id,
            access_token_encrypted,
            connection_status
          `)
          .eq("id", conversation.whatsapp_business_account_id)
          .eq("organization_id", organizationId)
          .maybeSingle();

      if (accountError) {
        console.error("WhatsApp account lookup error:", accountError);

        return NextResponse.json(
          { error: "Unable to retrieve WhatsApp account" },
          { status: 500 }
        );
      }

      if (
        !whatsappAccount ||
        whatsappAccount.connection_status !== "connected"
      ) {
        return NextResponse.json(
          {
            error:
              "WhatsApp account is not found or disconnected.",
          },
          { status: 400 }
        );
      }

      try {
        externalMessageId = await sendWhatsAppMessage({
          phoneNumberId: whatsappAccount.phone_number_id,
          encryptedAccessToken:
            whatsappAccount.access_token_encrypted,
          recipientPhone: conversation.visitor_phone,
          message: content,
        });

        console.log("Human WhatsApp reply sent:", {
          conversationId: id,
          externalMessageId,
        });
      } catch (whatsappError) {
        console.error(
          "WhatsApp outbound message error:",
          whatsappError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              whatsappError instanceof Error
                ? whatsappError.message
                : "WhatsApp message could not be sent.",
          },
          { status: 502 }
        );
      }
    }

    // Save the message after successful WhatsApp delivery request.
    const { data: message, error: messageError } =
      await supabaseAdmin
        .from("conversation_messages")
        .insert({
          conversation_id: id,
          role: "human",
          content,
          ...(externalMessageId
            ? { external_message_id: externalMessageId }
            : {}),
        })
        .select(
          "id, conversation_id, role, content, created_at, external_message_id"
        )
        .single();

    if (messageError || !message) {
      console.error("Save human reply error:", messageError);

      return NextResponse.json(
        {
          success: false,
          error:
            "Message was sent, but could not be saved in the conversation.",
          externalMessageId,
        },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    const updateData: {
      human_handover: boolean;
      status: string;
      assigned_to?: string;
      updated_at: string;
      last_message_at: string;
    } = {
      human_handover: true,
      status: "open",
      updated_at: now,
      last_message_at: now,
    };

    if (!conversation.assigned_to) {
      updateData.assigned_to = user.id;
    }

    const { error: updateError } = await supabaseAdmin
      .from("conversations")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Conversation update error:", updateError);

      return NextResponse.json(
        {
          success: false,
          error: "Message sent, but conversation update failed.",
          message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
      externalMessageId,
      handover: true,
    });
  } catch (error) {
    console.error("Send conversation reply error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send message",
      },
      { status: 500 }
    );
  }
}
