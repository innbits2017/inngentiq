
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_ORIGINS = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

function getCorsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";

  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : "";

  return {
    ...(allowedOrigin
      ? { "Access-Control-Allow-Origin": allowedOrigin }
      : {}),
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

function jsonResponse(
  request: Request,
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: getCorsHeaders(request),
  });
}

// Handle CORS preflight
export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(req.url);

    const agentId = searchParams.get("agentId");
    const visitorId = searchParams.get("visitorId");

    if (!agentId || !visitorId || !conversationId) {
      return jsonResponse(
        req,
        { error: "conversationId, agentId and visitorId are required" },
        400
      );
    }

    // Verify conversation ownership
    const { data: conversation, error: conversationError } =
      await supabaseAdmin
        .from("conversations")
        .select("id, created_at, updated_at, human_handover")
        .eq("id", conversationId)
        .eq("agent_id", agentId)
        .eq("visitor_id", visitorId)
        .single();

    if (conversationError || !conversation) {
      return jsonResponse(
        req,
        { error: "Conversation not found" },
        404
      );
    }

    // Fetch all messages, including human replies
    const { data: messages, error: messageError } =
      await supabaseAdmin
        .from("conversation_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (messageError) {
      console.error("Message fetch error:", messageError);

      return jsonResponse(
        req,
        { error: "Could not fetch messages" },
        500
      );
    }

    return jsonResponse(req, {
      success: true,
      conversation,
      messages: messages || [],
    });
  } catch (error) {
    console.error("Conversation detail API error:", error);

    return jsonResponse(
      req,
      { error: "Internal server error" },
      500
    );
  }
}
