
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let organizationId: string | null = null;
  let agentId: string | null = null;

  try {
    const body = await req.json();

    const companyName =
      typeof body.companyName === "string"
        ? body.companyName.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // Validate input
    if (!companyName || !email || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    if (companyName.length > 100) {
      return NextResponse.json(
        { success: false, error: "Business name is too long." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const baseSlug = slugify(companyName);

    if (!baseSlug) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid business name." },
        { status: 400 }
      );
    }

    // 1. Create Auth User
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) throw authError;

    userId = authData.user.id;

    // 2. Generate a unique organization slug
    const { data: existingOrganization } =
      await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("slug", baseSlug)
        .maybeSingle();

    const organizationSlug = existingOrganization
      ? `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`
      : baseSlug;

    // 3. Create Organization
    const { data: organization, error: organizationError } =
      await supabaseAdmin
        .from("organizations")
        .insert({
          name: companyName,
          slug: organizationSlug,
          plan: "starter",
          status: "active",
          owner_id: userId,
        })
        .select()
        .single();

    if (organizationError) throw organizationError;

    organizationId = organization.id;

    // 4. Create User Profile
    const { error: profileError } =
      await supabaseAdmin
        .from("user_profiles")
        .insert({
          id: userId,
          organization_id: organizationId,
          email,
          role: "owner",
        });

    if (profileError) throw profileError;

    // 5. Create Organization Membership
    const { error: membershipError } =
      await supabaseAdmin
        .from("organization_members")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          role: "owner",
          status: "active",
        });

    if (membershipError) throw membershipError;

    // 6. Create Default AI Agent
    const { data: agent, error: agentError } =
      await supabaseAdmin
        .from("agents")
        .insert({
          organization_id: organizationId,
          name: "AI Assistant",
          description: "Your default AI Assistant",
          provider: "openai",
          model: "gpt-4.1-mini",
          status: "active",
        })
        .select()
        .single();

    if (agentError) throw agentError;

    agentId = agent.id;

    // 7. Create Default Knowledge Base
    const { error: knowledgeBaseError } =
      await supabaseAdmin
        .from("knowledge_bases")
        .insert({
          organization_id: organizationId,
          agent_id: agentId,
          name: "Default Knowledge Base",
          description: "Default knowledge base",
        });

    if (knowledgeBaseError) throw knowledgeBaseError;

    return NextResponse.json({
      success: true,
      message: "Account created successfully.",
      organizationId,
    });

  } catch (error) {
    console.error("Signup API error:", error);

    // Cleanup partially created records if signup fails
    if (agentId) {
      await supabaseAdmin
        .from("knowledge_bases")
        .delete()
        .eq("agent_id", agentId);

      await supabaseAdmin
        .from("agents")
        .delete()
        .eq("id", agentId);
    }

    if (organizationId) {
      await supabaseAdmin
        .from("organization_members")
        .delete()
        .eq("organization_id", organizationId);

      await supabaseAdmin
        .from("user_profiles")
        .delete()
        .eq("organization_id", organizationId);

      await supabaseAdmin
        .from("organizations")
        .delete()
        .eq("id", organizationId);
    }

    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create account.",
      },
      { status: 500 }
    );
  }
}
