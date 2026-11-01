import { NextResponse } from "next/server";
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

  // Get active organization membership
  const { data: membership } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  let organizationId = membership?.organization_id;

  // Fallback to user profile
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

// GET: Retrieve all tasks for the organization
export async function GET() {
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

    const { data: tasks, error } = await supabaseAdmin
      .from("lead_tasks")
      .select(`
        *,
        lead:leads (
          id,
          name,
          email,
          phone,
          company
        )
      `)
      .eq("organization_id", organizationId)
      .order("due_date", {
        ascending: true,
        nullsFirst: false,
      });

    if (error) {
      console.error("Fetch organization tasks error:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      tasks: tasks || [],
    });

  } catch (error) {
    console.error("Get organization tasks error:", error);

    return NextResponse.json(
      { error: "Unable to load organization tasks" },
      { status: 500 }
    );
  }
}