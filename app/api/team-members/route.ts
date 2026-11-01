import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Resolve the active workspace.
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    let organizationId = membership?.organization_id;

    // Fallback to user profile.
    if (!organizationId) {
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      organizationId = profile?.organization_id;
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Fetch all active workspace members.
    const { data: memberships, error: membersError } =
      await supabaseAdmin
        .from("organization_members")
        .select("user_id, role")
        .eq("organization_id", organizationId)
        .eq("status", "active");

    if (membersError) throw membersError;

    const userIds = [
      ...new Set((memberships || []).map((member) => member.user_id)),
    ];

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        members: [],
      });
    }

    // Fetch member email addresses and profile roles.
    const { data: profiles, error: profilesError } =
      await supabaseAdmin
        .from("user_profiles")
        .select("id, email, role")
        .in("id", userIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map(
      (profiles || []).map((profile) => [profile.id, profile])
    );

    const members = (memberships || []).map((member) => {
      const profile = profileMap.get(member.user_id);

      return {
        id: member.user_id,
        email: profile?.email || "Email unavailable",
        role: member.role || profile?.role || "Member",
      };
    });

    return NextResponse.json({
    success: true,
    currentUserId: user.id,
    members,
    });
  } catch (error) {
    console.error("Fetch team members error:", error);

    return NextResponse.json(
      { error: "Unable to load team members" },
      { status: 500 }
    );
  }
}