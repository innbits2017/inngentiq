
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

async function getOwnedConversation(
  conversationId: string,
  organizationId: string
) {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select(`
      id,
      agent_id,
      assigned_to,
      status,
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

  return data;
}

function formatError(error: unknown) {
  if (error && typeof error === "object") {
    const dbError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    return {
      details: dbError.message || "Unknown database error",
      databaseDetails: dbError.details || null,
      code: dbError.code || null,
      hint: dbError.hint || null,
    };
  }

  return {
    details: String(error),
    databaseDetails: null,
    code: null,
    hint: null,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
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

    const { id } = await params;
    const body = await request.json();

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

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Assignment
    if (
      Object.prototype.hasOwnProperty.call(body, "assigned_to")
    ) {
      const assignedTo = body.assigned_to;

      if (assignedTo !== null) {
        if (
          typeof assignedTo !== "string" ||
          !assignedTo.trim()
        ) {
          return NextResponse.json(
            { error: "Invalid team member ID" },
            { status: 400 }
          );
        }

        const { data: membership, error: memberError } =
          await supabaseAdmin
            .from("organization_members")
            .select("user_id")
            .eq("user_id", assignedTo)
            .eq("organization_id", organizationId)
            .eq("status", "active")
            .maybeSingle();

        if (memberError) {
          console.error("Team member validation error:", memberError);
          throw memberError;
        }

        if (!membership) {
          return NextResponse.json(
            {
              error: "Team member is not active in this workspace",
            },
            { status: 400 }
          );
        }
      }

      updates.assigned_to = assignedTo;
    }

    // Conversation status
    if (
      Object.prototype.hasOwnProperty.call(body, "status")
    ) {
      const allowedStatuses = ["open", "pending", "resolved"];

      if (
        typeof body.status !== "string" ||
        !allowedStatuses.includes(body.status)
      ) {
        return NextResponse.json(
          { error: "Invalid conversation status" },
          { status: 400 }
        );
      }

      updates.status = body.status;
    }

    // Human handover
    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "human_handover"
      )
    ) {
      if (typeof body.human_handover !== "boolean") {
        return NextResponse.json(
          { error: "human_handover must be true or false" },
          { status: 400 }
        );
      }

      updates.human_handover = body.human_handover;

      if (body.human_handover === false) {
        updates.assigned_to = null;
      }
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json(
        { error: "No valid fields provided" },
        { status: 400 }
      );
    }

    const { data: updatedConversation, error: updateError } =
      await supabaseAdmin
        .from("conversations")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

    if (updateError) {
      console.error("Conversation update error:", updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "Conversation updated successfully",
      conversation: updatedConversation,
    });

  } catch (error: unknown) {
    const formatted = formatError(error);

    console.error("Update conversation error:", formatted);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update conversation",
        ...formatted,
      },
      { status: 500 }
    );
  }
}
