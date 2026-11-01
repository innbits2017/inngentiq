
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const agentId = searchParams.get("agentId");
    const visitorId = searchParams.get("visitorId");

    if (!agentId || !visitorId) {
      return NextResponse.json(
        { error: "agentId and visitorId are required" },
        { status: 400 }
      );
    }

    // Fetch all conversations for this visitor and agent
    const { data: conversations, error: conversationError } =
      await supabaseAdmin
        .from("conversations")
        .select("id, created_at, updated_at")
        .eq("agent_id", agentId)
        .eq("visitor_id", visitorId)
        .order("updated_at", { ascending: false });

    if (conversationError) {
      console.error("Conversation fetch error:", conversationError);
      return NextResponse.json(
        { error: "Could not fetch conversations" },
        { status: 500 }
      );
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
      });
    }

    const conversationIds = conversations.map((item) => item.id);

    // Fetch messages belonging to these conversations
    const { data: messages, error: messageError } = await supabaseAdmin
      .from("conversation_messages")
      .select("conversation_id, role, content, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (messageError) {
      console.error("Message fetch error:", messageError);
      return NextResponse.json(
        { error: "Could not fetch conversation messages" },
        { status: 500 }
      );
    }

    // Find the latest message for each conversation
    const latestMessages = new Map();

    for (const message of messages || []) {
      if (!latestMessages.has(message.conversation_id)) {
        latestMessages.set(message.conversation_id, message);
      }
    }

    const result = conversations.map((conversation) => {
      const lastMessage = latestMessages.get(conversation.id);

      return {
        id: conversation.id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        last_message: lastMessage?.content || "",
        last_message_at: lastMessage?.created_at || conversation.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      conversations: result,
    });
  } catch (error) {
    console.error("Conversation list API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
