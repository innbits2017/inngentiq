
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function corsHeaders(origin: string | null) {
  const headers = new Headers();

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return headers;
}

async function isAllowedOrigin(
  origin: string | null,
  agentId: string
) {
  if (!origin) return true;

  if (
    process.env.NODE_ENV === "development" &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  ) {
    return true;
  }

  const { data } = await supabaseAdmin
    .from("agent_deployments")
    .select("allowed_domains")
    .eq("agent_id", agentId)
    .maybeSingle();

  if (!Array.isArray(data?.allowed_domains)) return false;

  try {
    const hostname = new URL(origin).hostname.toLowerCase();

    return data.allowed_domains.some((domain: string) => {
      const cleanDomain = domain
        .replace(/^https?:\/\//, "")
        .split("/")[0]
        .split(":")[0]
        .toLowerCase();

      return (
        hostname === cleanDomain ||
        hostname.endsWith(`.${cleanDomain}`)
      );
    });
  } catch {
    return false;
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const origin = request.headers.get("origin");

  try {
    if (!agentId) {
      return NextResponse.json(
        { success: false, error: "Agent ID is required" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    if (!(await isAllowedOrigin(origin, agentId))) {
      return NextResponse.json(
        { success: false, error: "Origin not allowed" },
        { status: 403 }
      );
    }

    const headers = corsHeaders(origin);

    // Verify agent
    const { data: agent, error: agentError } =
      await supabaseAdmin
        .from("agents")
        .select("id, organization_id, is_active")
        .eq("id", agentId)
        .maybeSingle();

    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404, headers }
      );
    }

    if (agent.is_active === false) {
      return NextResponse.json(
        { success: false, error: "Agent is inactive" },
        { status: 403, headers }
      );
    }

    // Fetch active forms assigned to this agent
    const { data: forms, error: formsError } =
      await supabaseAdmin
        .from("forms")
        .select(`
          id,
          name,
          description,
          trigger_type,
          is_active,
          agent_id
        `)
        .eq("agent_id", agentId)
        .eq("organization_id", agent.organization_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (formsError) {
      console.error("Forms fetch error:", formsError);

      return NextResponse.json(
        { success: false, error: "Could not fetch forms" },
        { status: 500, headers }
      );
    }

    if (!forms || forms.length === 0) {
      return NextResponse.json(
        { success: true, forms: [] },
        { headers }
      );
    }

    const formIds = forms.map((form) => form.id);

    // Fetch fields for all assigned forms
    const { data: fields, error: fieldsError } =
      await supabaseAdmin
        .from("form_fields")
        .select(`
          id,
          form_id,
          label,
          field_key,
          field_type,
          placeholder,
          required,
          options,
          sort_order
        `)
        .in("form_id", formIds)
        .order("sort_order", { ascending: true });

    if (fieldsError) {
      console.error("Form fields fetch error:", fieldsError);

      return NextResponse.json(
        { success: false, error: "Could not fetch form fields" },
        { status: 500, headers }
      );
    }

    const result = forms.map((form) => ({
      ...form,
      fields: (fields || []).filter(
        (field) => field.form_id === form.id
      ),
    }));

    return NextResponse.json(
      {
        success: true,
        forms: result,
      },
      { headers }
    );
  } catch (error) {
    console.error("Public forms API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      {
        status: 500,
        headers: corsHeaders(origin),
      }
    );
  }
}
