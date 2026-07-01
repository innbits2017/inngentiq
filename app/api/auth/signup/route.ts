import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      organizationName,
      email,
      password,
    } = body;

    // Create Auth User
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authUser.user.id;

    // Create Organization
    const { data: org, error: orgError } =
      await supabaseAdmin
        .from("organizations")
        .insert({
          name: organizationName,
          slug: organizationName
            .toLowerCase()
            .replace(/\s+/g, "-"),
          owner_id: userId,
        })
        .select()
        .single();

    if (orgError) {
      return NextResponse.json(
        { error: orgError.message },
        { status: 400 }
      );
    }

    // Create User Profile
    await supabaseAdmin
      .from("user_profiles")
      .insert({
        id: userId,
        organization_id: org.id,
        email,
        role: "owner",
      });

    // Create Default Agent
    await supabaseAdmin
      .from("agents")
      .insert({
        organization_id: org.id,
        name: "AI Assistant",
        welcome_message:
          "Hi, how can I help you today?",
        system_prompt:
          "You are a helpful AI assistant.",
      });

    return NextResponse.json({
      success: true,
      organization: org,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}