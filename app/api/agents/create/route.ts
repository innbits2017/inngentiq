
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrganization } from "@/lib/getOrganization";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = body.name?.trim();
    const description = body.description?.trim() || "";
    const model = body.model?.trim() || "gpt-4.1-mini";

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Agent name is required." },
        { status: 400 }
      );
    }

    const organizationId = await getOrganization();

    const { data, error } = await supabaseAdmin
      .from("agents")
      .insert({
        organization_id: organizationId,
        name,
        description,
        model,
        provider: "openai",
        status: "active",
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      agent: data,
    });
  } catch (err: any) {
    console.error("Agent creation error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Unable to create agent.",
      },
      { status: 500 }
    );
  }
}
