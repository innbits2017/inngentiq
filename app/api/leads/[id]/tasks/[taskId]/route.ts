
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Params = {
  params: Promise<{
    id: string;
    taskId: string;
  }>;
};

async function getOrganizationId() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
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

// PATCH: Update task and notify new assignee.
export async function PATCH(
  req: NextRequest,
  { params }: Params
) {
  try {
    const { id, taskId } = await params;

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

    // Fetch existing task before updating.
    // This lets us detect whether its assignee has changed.
    const { data: existingTask, error: existingTaskError } =
      await supabaseAdmin
        .from("lead_tasks")
        .select("id, title, assigned_to")
        .eq("id", taskId)
        .eq("lead_id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

    if (existingTaskError) {
      throw existingTaskError;
    }

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const previousAssignee = existingTask.assigned_to || null;

    const updates: Record<string, unknown> = {};

    // Task title
    if (typeof body.title === "string") {
      const title = body.title.trim();

      if (!title) {
        return NextResponse.json(
          { error: "Task title cannot be empty" },
          { status: 400 }
        );
      }

      updates.title = title;
    }

    // Description
    if (
      typeof body.description === "string" ||
      body.description === null
    ) {
      updates.description = body.description;
    }

    // Due date
    if (
      body.due_date === null ||
      typeof body.due_date === "string"
    ) {
      if (
        body.due_date &&
        Number.isNaN(Date.parse(body.due_date))
      ) {
        return NextResponse.json(
          { error: "Invalid due date" },
          { status: 400 }
        );
      }

      updates.due_date = body.due_date;
    }

    // Priority
    if (body.priority !== undefined) {
      if (!["Low", "Medium", "High"].includes(body.priority)) {
        return NextResponse.json(
          { error: "Invalid priority" },
          { status: 400 }
        );
      }

      updates.priority = body.priority;
    }

    // Status
    if (body.status !== undefined) {
      if (!["Pending", "Completed"].includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid task status" },
          { status: 400 }
        );
      }

      updates.status = body.status;
    }

    // Task assignment
    if (body.assigned_to !== undefined) {
      if (
        body.assigned_to !== null &&
        typeof body.assigned_to !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid assigned member" },
          { status: 400 }
        );
      }

      if (body.assigned_to !== null) {
        // Verify selected user is an active member
        // of the current organization.
        const { data: member, error: memberError } =
          await supabaseAdmin
            .from("organization_members")
            .select("user_id")
            .eq("user_id", body.assigned_to)
            .eq("organization_id", organizationId)
            .eq("status", "active")
            .maybeSingle();

        if (memberError) {
          console.error(
            "Verify assigned member error:",
            memberError
          );

          throw memberError;
        }

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

      updates.assigned_to = body.assigned_to;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid changes provided" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    // Update task
    const { data: task, error } = await supabaseAdmin
      .from("lead_tasks")
      .update(updates)
      .eq("id", taskId)
      .eq("lead_id", id)
      .eq("organization_id", organizationId)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // ------------------------------------------------
    // CREATE NOTIFICATION WHEN ASSIGNEE CHANGES
    // ------------------------------------------------

    const newAssignee = task.assigned_to || null;

    const assigneeChanged =
      body.assigned_to !== undefined &&
      previousAssignee !== newAssignee;

    if (assigneeChanged && newAssignee) {
      const isReassignment = !!previousAssignee;

      const notification = {
        organization_id: organizationId,
        user_id: newAssignee,
        title: isReassignment
          ? "Task reassigned to you"
          : "New task assigned to you",
        message: isReassignment
          ? `The task "${task.title}" has been reassigned to you.`
          : `You have been assigned a new task: "${task.title}".`,
        type: isReassignment
          ? "task_reassigned"
          : "task_assigned",
        entity_type: "task",
        entity_id: task.id,
      };

      const { error: notificationError } = await supabaseAdmin
        .from("notifications")
        .insert(notification);

      if (notificationError) {
        // Do not fail task update if notification creation fails.
        console.error(
          "Task notification creation error:",
          notificationError
        );
      }
    }

    return NextResponse.json({
      success: true,
      task,
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("Update lead task error:", error);

    return NextResponse.json(
      { error: "Unable to update task" },
      { status: 500 }
    );
  }
}
