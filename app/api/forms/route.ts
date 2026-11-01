
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } =
    await supabaseAdmin
      .from("user_profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

  if (profileError || !profile?.organization_id) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("forms")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Form name is required" },
        { status: 400 }
      );
    }

    // Get organisation
    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("user_profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 }
      );
    }

    const organizationId = profile.organization_id;

    // Validate selected agent belongs to this organisation
    let selectedAgentId: string | null = null;

    if (body.agent_id) {
      const { data: agent, error: agentError } =
        await supabaseAdmin
          .from("agents")
          .select("id")
          .eq("id", body.agent_id)
          .eq("organization_id", organizationId)
          .single();

      if (agentError || !agent) {
        return NextResponse.json(
          { error: "Selected agent does not belong to your organization" },
          { status: 400 }
        );
      }

      selectedAgentId = agent.id;
    }

    // Create form
    const { data, error } = await supabaseAdmin
      .from("forms")
      .insert({
        organization_id: organizationId,
        agent_id: selectedAgentId,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        trigger_type: body.trigger_type || "manual",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Form creation error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, form: data },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create form API error:", error);

    return NextResponse.json(
      { error: "Failed to create form" },
      { status: 500 }
    );
  }
}
