
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrganization } from "@/lib/getOrganization";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const organizationId = await getOrganization();
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("agents")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Agent not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Get agent error:", err);

    return NextResponse.json(
      { error: err.message || "Unable to fetch agent." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const organizationId = await getOrganization();
    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, any> = {};

    const stringFields = [
      "name",
      "description",
      "provider",
      "model",
      "system_prompt",
      "welcome_message",
      "avatar_url",
    ];

    for (const field of stringFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        if (typeof body[field] !== "string") {
          return NextResponse.json(
            { error: `${field} must be a string.` },
            { status: 400 }
          );
        }

        updates[field] = body[field].trim();
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "temperature")) {
      const temperature = Number(body.temperature);

      if (
        !Number.isFinite(temperature) ||
        temperature < 0 ||
        temperature > 2
      ) {
        return NextResponse.json(
          { error: "Temperature must be between 0 and 2." },
          { status: 400 }
        );
      }

      updates.temperature = temperature;
    }

    if (Object.prototype.hasOwnProperty.call(body, "max_tokens")) {
      const maxTokens = Number(body.max_tokens);

      if (!Number.isInteger(maxTokens) || maxTokens < 1) {
        return NextResponse.json(
          { error: "Maximum tokens must be a positive integer." },
          { status: 400 }
        );
      }

      updates.max_tokens = maxTokens;
    }

    // Validate and synchronize agent status fields
    if (Object.prototype.hasOwnProperty.call(body, "status")) {
      if (
        body.status !== "active" &&
        body.status !== "inactive"
      ) {
        return NextResponse.json(
          { error: "Status must be active or inactive." },
          { status: 400 }
        );
      }

      updates.status = body.status;
      updates.is_active = body.status === "active";
    }

    if (Object.prototype.hasOwnProperty.call(body, "is_active")) {
      if (typeof body.is_active !== "boolean") {
        return NextResponse.json(
          { error: "is_active must be a boolean." },
          { status: 400 }
        );
      }

      updates.is_active = body.is_active;

      // Keep status synchronized when only is_active is supplied
      if (!Object.prototype.hasOwnProperty.call(body, "status")) {
        updates.status = body.is_active ? "active" : "inactive";
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(updates, "name") &&
      !updates.name
    ) {
      return NextResponse.json(
        { error: "Agent name is required." },
        { status: 400 }
      );
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid changes provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("agents")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Agent not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: data,
    });
  } catch (err: any) {
    console.error("Update agent error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Unable to update agent.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const organizationId = await getOrganization();
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("agents")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Agent not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Agent deleted successfully.",
      id: data.id,
    });
  } catch (err: any) {
    console.error("Delete agent error:", err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "Unable to delete agent. Check whether related records prevent deletion.",
      },
      { status: 500 }
    );
  }
}
