import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Params = {
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

  const { data: membership } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  let organizationId = membership?.organization_id;

  if (!organizationId) {
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    organizationId = profile?.organization_id;
  }

  return { user, organizationId };
}

// GET: Retrieve tasks for a lead.
export async function GET(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
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

    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    const { data: tasks, error } = await supabaseAdmin
      .from("lead_tasks")
      .select("*")
      .eq("lead_id", id)
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
    });
  } catch (error) {
    console.error("Get lead tasks error:", error);

    return NextResponse.json(
      { error: "Unable to load tasks" },
      { status: 500 }
    );
  }
}

// POST: Create a task for a lead.
export async function POST(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;
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

    const body = await req.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    const priority = body.priority || "Medium";
    const dueDate = body.due_date || null;

    // Assignment is optional. null means Unassigned.
    const assignedTo =
      body.assigned_to === undefined || body.assigned_to === ""
        ? null
        : body.assigned_to;

    if (!title) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority" },
        { status: 400 }
      );
    }

    if (
      dueDate &&
      (typeof dueDate !== "string" ||
        Number.isNaN(Date.parse(dueDate)))
    ) {
      return NextResponse.json(
        { error: "Invalid due date" },
        { status: 400 }
      );
    }

    if (
      assignedTo !== null &&
      typeof assignedTo !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid assigned member" },
        { status: 400 }
      );
    }

    // Verify the lead belongs to this organization.
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    // Verify the assigned user is an active workspace member.
    if (assignedTo !== null) {
      const { data: member, error: memberError } =
        await supabaseAdmin
          .from("organization_members")
          .select("user_id")
          .eq("user_id", assignedTo)
          .eq("organization_id", organizationId)
          .eq("status", "active")
          .maybeSingle();

      if (memberError) throw memberError;

      if (!member) {
        return NextResponse.json(
          {
            error:
              "Selected user is not an active member of this workspace",
          },
          { status: 400 }
        );
      }
    }

    const { data: task, error } = await supabaseAdmin
      .from("lead_tasks")
      .insert({
        lead_id: id,
        organization_id: organizationId,
        title,
        description,
        due_date: dueDate,
        priority,
        status: "Pending",
        assigned_to: assignedTo,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      task,
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("Create lead task error:", error);

    return NextResponse.json(
      { error: "Unable to create task" },
      { status: 500 }
    );
  }
}