
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getUserAndOrganization() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      user: null,
      organizationId: null,
    };
  }

  // Get active workspace membership
  const { data: membership } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  let organizationId = membership?.organization_id || null;

  // Fallback to user profile
  if (!organizationId) {
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    organizationId = profile?.organization_id || null;
  }

  return {
    user,
    organizationId,
  };
}

// GET notifications
export async function GET() {
  try {
    const { user, organizationId } = await getUserAndOrganization();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 403 }
      );
    }

    const { data: notifications, error } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Notifications fetch error:", error);

      return NextResponse.json(
        { error: "Unable to fetch notifications" },
        { status: 500 }
      );
    }

    const { count, error: countError } = await supabaseAdmin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .eq("is_read", false);

    if (countError) {
      console.error("Unread count error:", countError);
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: count ?? 0,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// PATCH: Mark one notification or all notifications as read
export async function PATCH(req: Request) {
  try {
    const { user, organizationId } = await getUserAndOrganization();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Mark all notifications as read
    if (body.markAllRead === true) {
      const { error } = await supabaseAdmin
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("organization_id", organizationId)
        .eq("is_read", false);

      if (error) {
        console.error("Mark all notifications error:", error);

        return NextResponse.json(
          { error: "Unable to mark notifications as read" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    // Mark one notification as read
    const notificationId = body.id;

    if (
      typeof notificationId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        notificationId
      )
    ) {
      return NextResponse.json(
        { error: "Valid notification ID is required" },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabaseAdmin
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Mark notification error:", error);

      return NextResponse.json(
        { error: "Unable to update notification" },
        { status: 500 }
      );
    }

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Notifications PATCH error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
