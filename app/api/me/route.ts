
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
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user's organization memberships
    const { data: memberships, error: membershipError } =
      await supabaseAdmin
        .from("organization_members")
        .select(`
          organization_id,
          role,
          status,
          organizations (
            id,
            name,
            slug,
            plan,
            status
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active");

    if (membershipError) {
      console.error("Membership lookup error:", membershipError);
      return NextResponse.json(
        { success: false, error: "Unable to load organization" },
        { status: 500 }
      );
    }

    // Fallback to existing user profile if membership is missing
    let organizationMembership = memberships?.[0] ?? null;

    if (!organizationMembership) {
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("organization_id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.organization_id) {
        const { data: organization } = await supabaseAdmin
          .from("organizations")
          .select("id, name, slug, plan, status")
          .eq("id", profile.organization_id)
          .maybeSingle();

        if (organization) {
          organizationMembership = {
            organization_id: profile.organization_id,
            role: profile.role || "agent",
            status: "active",
            organizations: organization,
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      user,
      organization: organizationMembership?.organizations ?? null,
      membership: organizationMembership
        ? {
            organization_id: organizationMembership.organization_id,
            role: organizationMembership.role,
            status: organizationMembership.status,
          }
        : null,
      memberships: memberships ?? [],
    });

  } catch (error) {
    console.error("API /me error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
