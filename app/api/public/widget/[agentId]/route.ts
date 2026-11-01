
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getAllowedOrigin(
  request: NextRequest,
  agentId: string
) {
  const origin = request.headers.get("origin");

  if (!origin) return null;

  // Allow localhost during development
  if (
    process.env.NODE_ENV === "development" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return origin;
  }

  // Check configured domains in production
  const { data } = await supabaseAdmin
    .from("agent_deployments")
    .select("allowed_domains")
    .eq("agent_id", agentId)
    .maybeSingle();

  const domains = Array.isArray(data?.allowed_domains)
    ? data.allowed_domains
    : [];

  try {
    const hostname = new URL(origin).hostname;

    const isAllowed = domains.some((domain: string) => {
      const cleanDomain = domain
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .split(":")[0];

      return (
        hostname === cleanDomain ||
        hostname.endsWith(`.${cleanDomain}`)
      );
    });

    return isAllowed ? origin : null;
  } catch {
    return null;
  }
}

function corsHeaders(origin: string | null) {
  const headers = new Headers();

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Vary", "Origin");
  }

  return headers;
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const origin = await getAllowedOrigin(request, agentId);

  if (request.headers.get("origin") && !origin) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const origin = await getAllowedOrigin(request, agentId);
  const headers = corsHeaders(origin);

  if (request.headers.get("origin") && !origin) {
    return NextResponse.json(
      { success: false, message: "Origin not allowed" },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("agent_deployments")
    .select(`
      agent_id,
      is_active,
      widget_title,
      welcome_message,
      primary_color,
      text_color,
      theme,
      position,
      border_radius,
      avatar_url,
      allowed_domains
    `)
    .eq("agent_id", agentId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { success: false, message: "Widget not found" },
      { status: 404, headers }
    );
  }

  if (!data.is_active) {
    return NextResponse.json(
      { success: false, message: "Widget is disabled" },
      { status: 403, headers }
    );
  }

  return NextResponse.json(
    {
      success: true,
      widget: {
        widget_title: data.widget_title,
        welcome_message: data.welcome_message,
        primary_color: data.primary_color,
        text_color: data.text_color,
        theme: data.theme,
        position: data.position,
        border_radius: data.border_radius,
        avatar_url: data.avatar_url,
      },
    },
    { headers }
  );
}
