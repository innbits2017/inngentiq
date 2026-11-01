
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { openai } from "@/lib/openai";
import { searchKnowledge } from "@/lib/knowledge/search";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { detectIntent } from "@/lib/ai/intent";


const MAX_REQUEST_BYTES = 10 * 1024;
const MAX_MESSAGE_LENGTH = 1000;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function corsHeaders(origin?: string | null) {
  const headers = new Headers();

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");

  return headers;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders("*"),
  });
}

function isLocalOrigin(origin: string) {
  return (
    process.env.NODE_ENV === "development" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  );
}

function isAllowedDomain(origin: string, domains: unknown) {
  if (!Array.isArray(domains)) return false;

  try {
    const hostname = new URL(origin).hostname;

    return domains.some((domain) => {
      if (typeof domain !== "string") return false;

      const cleanDomain = domain
        .trim()
        .replace(/^https?:\/\//, "")
        .split("/")[0]
        .split(":")[0]
        .toLowerCase();

      return (
        hostname.toLowerCase() === cleanDomain ||
        hostname.toLowerCase().endsWith(`.${cleanDomain}`)
      );
    });
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const headers = corsHeaders(origin);

    // Reject oversized requests before parsing the body.
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { error: "Request body is too large." },
        { status: 413, headers }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json." },
        { status: 415, headers }
      );
    }

    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).length > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { error: "Request body is too large." },
        { status: 413, headers }
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400, headers }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400, headers }
      );
    }

    const {
      agentId,
      message,
      conversationId,
      visitorId,
    } = body as Record<string, unknown>;

    // Validate required fields and identifier formats.
    if (
      typeof agentId !== "string" ||
      !isUuid(agentId.trim()) ||
      typeof visitorId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(visitorId.trim()) ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return NextResponse.json(
        {
          error: "A valid agentId, visitorId and message are required.",
        },
        { status: 400, headers }
      );
    }

    if (
      conversationId !== undefined &&
      conversationId !== null &&
      conversationId !== "" &&
      (typeof conversationId !== "string" ||
        !isUuid(conversationId.trim()))
    ) {
      return NextResponse.json(
        { error: "Invalid conversationId." },
        { status: 400, headers }
      );
    }

    // Validate requesting website.
    if (origin && !isLocalOrigin(origin)) {
      const { data: deployment, error: deploymentError } =
        await supabaseAdmin
          .from("agent_deployments")
          .select("allowed_domains, is_active")
          .eq("agent_id", agentId)
          .maybeSingle();

      if (
        deploymentError ||
        !deployment ||
        !deployment.is_active ||
        !isAllowedDomain(origin, deployment.allowed_domains)
      ) {
        return NextResponse.json(
          { error: "Origin not allowed" },
          { status: 403, headers: corsHeaders(null) }
        );
      }
    }

    // Reject oversized messages before doing database or AI work.
    const trimmedMessage = message.trim();
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Message is too long. Please keep it under 1,000 characters." },
        { status: 413, headers }
      );
    }

    const activeVisitorId = visitorId.trim();

    // Rate limit each agent + client IP to 20 requests per 60 seconds.
    // Hash the key so raw IP addresses are not stored in the rate-limit table.
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp =
      request.headers.get("x-real-ip") ||
      forwardedFor?.split(",")[0]?.trim() ||
      "unknown";

    const rateLimitKey = createHash("sha256")
      .update(`${agentId}:${clientIp}`)
      .digest("hex");

    const { data: rateLimitAllowed, error: rateLimitError } =
      await supabaseAdmin.rpc("consume_public_chat_rate_limit", {
        p_key_hash: rateLimitKey,
        p_limit: 20,
        p_window_seconds: 60,
      });

    if (rateLimitError) {
      console.error("Public chat rate limit failed:", rateLimitError);

      return NextResponse.json(
        { error: "Chat is temporarily unavailable. Please try again shortly." },
        { status: 503, headers }
      );
    }

    if (rateLimitAllowed !== true) {
      const rateLimitHeaders = corsHeaders(origin);
      rateLimitHeaders.set("Retry-After", "60");

      return NextResponse.json(
        { error: "You're sending messages too quickly. Please wait a minute and try again." },
        { status: 429, headers: rateLimitHeaders }
      );
    }

    const intent = detectIntent(trimmedMessage);

    // Get agent.
    const { data: agent, error: agentError } =
      await supabaseAdmin
        .from("agents")
        .select("system_prompt")
        .eq("id", agentId)
        .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404, headers }
      );
    }

    // Get knowledge base.
    const { data: knowledgeBase, error: kbError } =
      await supabaseAdmin
        .from("knowledge_bases")
        .select("id")
        .eq("agent_id", agentId)
        .single();

    if (kbError || !knowledgeBase) {
      return NextResponse.json(
        { error: "Knowledge Base not found" },
        { status: 404, headers }
      );
    }

    // Find or create conversation.
    let activeConversationId: string | undefined =
      typeof conversationId === "string" && conversationId.trim()
        ? conversationId.trim()
        : undefined;

    let humanHandover = false;
    let assignedTo: string | null = null;

    if (activeConversationId) {
      const { data: existingConversation, error } =
        await supabaseAdmin
          .from("conversations")
          .select("id, human_handover, status, assigned_to")
          .eq("id", activeConversationId)
          .eq("agent_id", agentId)
          .eq("visitor_id", activeVisitorId)
          .maybeSingle();

      if (error) {
        console.error("Conversation lookup failed:", error);

        return NextResponse.json(
          { error: "Could not load conversation" },
          { status: 500, headers }
        );
      }

      if (!existingConversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404, headers }
        );
      }

      humanHandover =
        existingConversation.human_handover ?? false;

      assignedTo = existingConversation.assigned_to ?? null;
    } else {
      const { data: newConversation, error } =
        await supabaseAdmin
          .from("conversations")
          .insert({
            agent_id: agentId,
            visitor_id: activeVisitorId,
            channel: "website",
            status: "open",
            human_handover: false,
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();

      if (error || !newConversation) {
        console.error("Conversation creation failed:", error);

        return NextResponse.json(
          { error: "Could not create conversation" },
          { status: 500, headers }
        );
      }

      activeConversationId = newConversation.id;
    }

    // Save visitor message.
    const { error: userMessageError } =
      await supabaseAdmin
        .from("conversation_messages")
        .insert({
          conversation_id: activeConversationId,
          role: "user",
          content: trimmedMessage,
        });

    if (userMessageError) {
      console.error("Saving user message failed:", userMessageError);

      return NextResponse.json(
        { error: "Could not save user message" },
        { status: 500, headers }
      );
    }

    // Update conversation activity.
    const now = new Date().toISOString();

    const { error: updateUserMessageError } =
      await supabaseAdmin
        .from("conversations")
        .update({
          updated_at: now,
          last_message_at: now,
        })
        .eq("id", activeConversationId);

    if (updateUserMessageError) {
      console.error(
        "Conversation timestamp update failed:",
        updateUserMessageError
      );
    }

    // HUMAN HANDOVER:
    // Save visitor messages but do not generate an AI response.
    if (humanHandover) {
      return NextResponse.json(
        {
          success: true,
          answer:
            "Your message has been received. A team member will assist you shortly.",
          intent,
          conversationId: activeConversationId,
          visitorId: activeVisitorId,
          handover: true,
          assignedTo,
        },
        { headers }
      );
    }

    // Search knowledge base.
    const chunks = await searchKnowledge(
      knowledgeBase.id,
      trimmedMessage,
      5
    );

    const context = chunks
      .map((chunk: any) => chunk.content)
      .join("\n\n");

    // Generate AI response.
    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.2,
        max_tokens: 100,
        messages: [
          {
            role: "system",
            content: `
${agent.system_prompt || ""}

You are a helpful, conversational AI assistant.

Rules:
- Answer in a friendly, natural, conversational tone.
- Keep the answer to 2–3 short sentences, ideally under 45 words.
- For broad questions, mention only the 3–5 most relevant categories.
- Never list every service or feature unless the user explicitly asks for a full list.
- Ask at most one short follow-up question.
- Use ONLY the supplied knowledge. Never invent details.
- If the answer is not present in the supplied knowledge, reply exactly:
"I don't have that information."

Knowledge:
${context || "No relevant knowledge was found."}
`,
          },
          {
            role: "user",
            content: trimmedMessage,
          },
        ],
      });

    const answer =
      completion.choices[0].message.content?.trim() ||
      "I don't have that information.";

    // Save assistant response.
    const { error: assistantMessageError } =
      await supabaseAdmin
        .from("conversation_messages")
        .insert({
          conversation_id: activeConversationId,
          role: "assistant",
          content: answer,
        });

    if (assistantMessageError) {
      console.error(
        "Saving assistant response failed:",
        assistantMessageError
      );

      return NextResponse.json(
        { error: "Could not save assistant response" },
        { status: 500, headers }
      );
    }

    // Update conversation timestamp after AI response.
    const { error: updateError } =
      await supabaseAdmin
        .from("conversations")
        .update({
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .eq("id", activeConversationId);

    if (updateError) {
      console.error("Conversation update failed:", updateError);
    }

    return NextResponse.json(
      {
        success: true,
        answer,
        intent,
        conversationId: activeConversationId,
        visitorId: activeVisitorId,
        handover: false,
        assignedTo: null,
      },
      { headers }
    );
  } catch (error) {
    console.error("Public chat error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
