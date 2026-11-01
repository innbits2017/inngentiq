import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function runTaskReminders(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET?.trim();

const authorization = req.headers.get("authorization");

const providedSecret = authorization
  ?.replace(/^Bearer\s+/i, "")
  .trim();

console.log("CRON DEBUG:", {
  secretExists: Boolean(cronSecret),
  configuredSecretLength: cronSecret?.length ?? 0,
  authorizationReceived: Boolean(authorization),
  providedSecretLength: providedSecret?.length ?? 0,
  matches: Boolean(cronSecret && providedSecret === cronSecret),
});

if (!cronSecret) {
  return NextResponse.json(
    { success: false, error: "CRON_SECRET is not configured" },
    { status: 500 }
  );
}

if (providedSecret !== cronSecret) {
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 }
  );
}

    const now = new Date();
    const next24Hours = new Date(
      now.getTime() + 24 * 60 * 60 * 1000
    );

    // Fetch tasks that have a due date.
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from("lead_tasks")
      .select(
        "id, lead_id, organization_id, title, due_date, status, assigned_to"
      )
      .not("due_date", "is", null);

    if (tasksError) {
      console.error("Task fetch error:", tasksError);

      return NextResponse.json(
        { success: false, error: "Unable to fetch tasks" },
        { status: 500 }
      );
    }

    let remindersCreated = 0;
    let skipped = 0;
    let errors = 0;

    for (const task of tasks || []) {
      try {
        // Do not notify for completed tasks.
        if (
          task.status?.toLowerCase() === "completed" ||
          !task.assigned_to ||
          !task.organization_id
        ) {
          skipped++;
          continue;
        }

        const dueDate = new Date(task.due_date);

        if (Number.isNaN(dueDate.getTime())) {
          skipped++;
          continue;
        }

        let reminderType: "task_due" | "task_overdue";
        let notificationTitle: string;
        let notificationMessage: string;

        if (dueDate < now) {
          // Task is overdue.
          reminderType = "task_overdue";
          notificationTitle = "Task overdue";
          notificationMessage = `Your task "${task.title}" is overdue. Please take action.`;
        } else if (dueDate <= next24Hours) {
          // Task is due within the next 24 hours.
          reminderType = "task_due";
          notificationTitle = "Task due soon";
          notificationMessage = `Your task "${task.title}" is due within the next 24 hours.`;
        } else {
          continue;
        }

        // Claim this reminder type for this task.
        // The unique constraint prevents duplicate reminders.
        const { data: reminderLog, error: logError } =
          await supabaseAdmin
            .from("notification_reminder_logs")
            .insert({
              task_id: task.id,
              reminder_type: reminderType,
            })
            .select("id")
            .single();

        if (logError) {
          // A duplicate means this reminder was already processed.
          if (logError.code === "23505") {
            skipped++;
            continue;
          }

          console.error("Reminder log error:", logError);
          errors++;
          continue;
        }

        // Create the in-app notification.
        const { data: notification, error: notificationError } =
          await supabaseAdmin
            .from("notifications")
            .insert({
              organization_id: task.organization_id,
              user_id: task.assigned_to,
              title: notificationTitle,
              message: notificationMessage,
              type: reminderType,
              entity_type: "task",
              entity_id: task.id,
            })
            .select("id")
            .single();

        if (notificationError) {
          console.error(
            "Notification creation error:",
            notificationError
          );

          // Remove the reminder log so a later run can retry.
          await supabaseAdmin
            .from("notification_reminder_logs")
            .delete()
            .eq("id", reminderLog.id);

          errors++;
          continue;
        }

        // Link the notification to its reminder log.
        await supabaseAdmin
          .from("notification_reminder_logs")
          .update({
            notification_id: notification.id,
          })
          .eq("id", reminderLog.id);

        remindersCreated++;
      } catch (taskError) {
        console.error("Task reminder processing error:", taskError);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Task reminders processed",
      totalTasks: tasks?.length || 0,
      remindersCreated,
      skipped,
      errors,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Task reminders API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return runTaskReminders(req);
}

export async function POST(req: Request) {
  return runTaskReminders(req);
}