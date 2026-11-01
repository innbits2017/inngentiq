
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrganization } from "@/lib/getOrganization";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const defaultSettings = {
  is_active: true,
  widget_title: "AI Assistant",
  welcome_message: "Hi! 👋 How can I help you today?",
  primary_color: "#5149E8",
  text_color: "#FFFFFF",
  theme: "light",
  position: "bottom-right",
  border_radius: 20,
  allowed_domains: [],
  avatar_url: "",
};

function isValidColor(value: unknown) {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value);
}

function normalizeDomains(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const domains: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") return null;

    const raw = item.trim();
    if (!raw) continue;

    try {
      const url = new URL(
        raw.includes("://") ? raw : `https://${raw}`
      );

      const domain = url.hostname.toLowerCase();

      if (
        !domain ||
        domain.includes(" ") ||
        domain.startsWith(".") ||
        domain.endsWith(".")
      ) {
        return null;
      }

      if (!domains.includes(domain)) {
        domains.push(domain);
      }
    } catch {
      return null;
    }
  }

  return domains;
}

// GET deployment settings
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const organizationId = await getOrganization();
    const { id } = await params;

    // Verify agent belongs to the current organization
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("id, organization_id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (agentError) throw agentError;

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or access denied." },
        { status: 404 }
      );
    }

    // Find existing deployment
    const { data: existing, error: deploymentError } =
      await supabaseAdmin
        .from("agent_deployments")
        .select("*")
        .eq("agent_id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

    if (deploymentError) throw deploymentError;

    if (existing) {
      return NextResponse.json(existing);
    }

    // Create default deployment if one does not exist
    const { data: deployment, error: insertError } =
      await supabaseAdmin
        .from("agent_deployments")
        .insert({
          agent_id: id,
          organization_id: organizationId,
          ...defaultSettings,
        })
        .select()
        .single();

    if (insertError) {
      // Another request may have created it at the same time.
      const { data: retryDeployment, error: retryError } =
        await supabaseAdmin
          .from("agent_deployments")
          .select("*")
          .eq("agent_id", id)
          .eq("organization_id", organizationId)
          .maybeSingle();

      if (retryError || !retryDeployment) {
        throw insertError;
      }

      return NextResponse.json(retryDeployment);
    }

    return NextResponse.json(deployment);
  } catch (error: any) {
    console.error("Get deployment error:", error);

    return NextResponse.json(
      { error: error.message || "Unable to load deployment settings." },
      { status: 500 }
    );
  }
}

// UPDATE deployment settings
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const organizationId = await getOrganization();
    const { id } = await params;
    const body = await req.json();

    // Verify agent belongs to the current organization
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (agentError) throw agentError;

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or access denied." },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = {};

    // Validate active status
    if ("is_active" in body) {
      if (typeof body.is_active !== "boolean") {
        return NextResponse.json(
          { error: "Invalid widget active status." },
          { status: 400 }
        );
      }

      updates.is_active = body.is_active;
    }

    // Validate text fields
    const textFields = [
      "widget_title",
      "welcome_message",
      "avatar_url",
    ];

    for (const field of textFields) {
      if (field in body) {
        if (typeof body[field] !== "string") {
          return NextResponse.json(
            { error: `${field} must be a string.` },
            { status: 400 }
          );
        }

        updates[field] = body[field].trim();
      }
    }

    if (
      "widget_title" in updates &&
      !updates.widget_title
    ) {
      return NextResponse.json(
        { error: "Widget title is required." },
        { status: 400 }
      );
    }

    if (
      "welcome_message" in updates &&
      !updates.welcome_message
    ) {
      return NextResponse.json(
        { error: "Welcome message is required." },
        { status: 400 }
      );
    }

    // Validate colours
    if ("primary_color" in body) {
      if (!isValidColor(body.primary_color)) {
        return NextResponse.json(
          { error: "Invalid primary colour." },
          { status: 400 }
        );
      }

      updates.primary_color = body.primary_color;
    }

    if ("text_color" in body) {
      if (!isValidColor(body.text_color)) {
        return NextResponse.json(
          { error: "Invalid text colour." },
          { status: 400 }
        );
      }

      updates.text_color = body.text_color;
    }

    // Validate theme
    if ("theme" in body) {
      if (!["light", "dark"].includes(body.theme)) {
        return NextResponse.json(
          { error: "Theme must be light or dark." },
          { status: 400 }
        );
      }

      updates.theme = body.theme;
    }

    // Validate position
    if ("position" in body) {
      if (
        !["bottom-left", "bottom-right"].includes(body.position)
      ) {
        return NextResponse.json(
          { error: "Invalid widget position." },
          { status: 400 }
        );
      }

      updates.position = body.position;
    }

    // Validate border radius
    if ("border_radius" in body) {
      const radius = Number(body.border_radius);

      if (
        !Number.isInteger(radius) ||
        radius < 0 ||
        radius > 30
      ) {
        return NextResponse.json(
          { error: "Border radius must be between 0 and 30." },
          { status: 400 }
        );
      }

      updates.border_radius = radius;
    }

    // Validate and normalize allowed domains
    if ("allowed_domains" in body) {
      const domains = normalizeDomains(body.allowed_domains);

      if (domains === null) {
        return NextResponse.json(
          { error: "One or more allowed domains are invalid." },
          { status: 400 }
        );
      }

      updates.allowed_domains = domains;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid deployment changes provided." },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("agent_deployments")
      .update(updates)
      .eq("agent_id", id)
      .eq("organization_id", organizationId)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Deployment settings not found. Reload the page and try again." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deployment: data,
    });
  } catch (error: any) {
    console.error("Update deployment error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unable to save deployment settings.",
      },
      { status: 500 }
    );
  }
}
