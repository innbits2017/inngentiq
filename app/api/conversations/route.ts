
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getOrganizationId() {
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

// GET: Retrieve organization conversations
export async function GET(request: NextRequest) {
  try {
    const { user, organizationId } = await getOrganizationId();

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

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const channel = searchParams.get("channel");
    const search = searchParams.get("search");

    const parsedLimit = Number(searchParams.get("limit")) || 50;
    const limit = Math.min(Math.max(parsedLimit, 1), 100);

    // 1. Get organization agents
    const { data: agents, error: agentsError } =
      await supabaseAdmin
        .from("agents")
        .select("id, name")
        .eq("organization_id", organizationId);

    if (agentsError) {
      console.error("Fetch agents error:", agentsError);
      throw agentsError;
    }

    const agentIds = (agents || []).map((agent) => agent.id);

    if (agentIds.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
        total: 0,
      });
    }

    // 2. Get conversations
    let query = supabaseAdmin
      .from("conversations")
      .select("*")
      .in("agent_id", agentIds)
      .order("last_message_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(limit);

    if (
      status &&
      ["open", "pending", "resolved"].includes(status)
    ) {
      query = query.eq("status", status);
    }

    if (
      channel &&
      ["website", "whatsapp", "email"].includes(channel)
    ) {
      query = query.eq("channel", channel);
    }

    if (search?.trim()) {
      const term = search.trim().replace(/[,%()]/g, "");

      if (term) {
        query = query.or(
          `visitor_name.ilike.%${term}%,visitor_email.ilike.%${term}%,visitor_phone.ilike.%${term}%,visitor_id.ilike.%${term}%`
        );
      }
    }

    const { data: conversations, error: conversationsError } =
      await query;

    if (conversationsError) {
      console.error("Fetch conversations error:", conversationsError);
      throw conversationsError;
    }

    const conversationList = conversations || [];

    if (conversationList.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
        total: 0,
      });
    }

    // 3. Prepare agent lookup
    const agentMap = new Map(
      (agents || []).map((agent) => [agent.id, agent])
    );

    // 4. Get assigned team members separately
    const assignedUserIds = [
      ...new Set(
        conversationList
          .map((conversation) => conversation.assigned_to)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    let userMap = new Map<string, any>();

    if (assignedUserIds.length > 0) {
      const { data: users, error: usersError } =
        await supabaseAdmin
          .from("user_profiles")
          .select("id, email")
          .in("id", assignedUserIds);

      if (usersError) {
        console.error("Fetch assigned users error:", usersError);
      } else {
        userMap = new Map(
          (users || []).map((user) => [user.id, user])
        );
      }
    }

    // 5. Get messages for these conversations
    const conversationIds = conversationList.map(
      (conversation) => conversation.id
    );

    const { data: messages, error: messagesError } =
      await supabaseAdmin
        .from("conversation_messages")
        .select("id, conversation_id, role, content, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

    if (messagesError) {
      console.error("Fetch messages error:", messagesError);
      throw messagesError;
    }

    // 6. Find latest message for each conversation
    const latestMessages = new Map<string, any>();

    for (const message of messages || []) {
      if (!latestMessages.has(message.conversation_id)) {
        latestMessages.set(message.conversation_id, message);
      }
    }

    // 7. Build final response
    const result = conversationList.map((conversation) => ({
      ...conversation,

      agent: agentMap.get(conversation.agent_id) || null,

      assignee: conversation.assigned_to
        ? userMap.get(conversation.assigned_to) || null
        : null,

      latest_message:
        latestMessages.get(conversation.id) || null,
    }));

    return NextResponse.json({
      success: true,
      conversations: result,
      total: result.length,
    });

  } catch (error) {
    console.error("Get conversations error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load conversations",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
