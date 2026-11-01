import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  Vary: "Origin",
});

async function getAllowedOrigin(origin: string, id: string) {
  // Allow requests without an Origin header (same-origin/server requests).
  if (!origin) return "*";

  // Local development.
  if (
    origin === "http://localhost:5500" ||
    origin === "http://127.0.0.1:5500" ||
    origin === "http://localhost:3000" ||
    origin === "http://127.0.0.1:3000"
  ) {
    return origin;
  }

  // Find the form and its associated agent.
  const { data: form } = await supabaseAdmin
    .from("forms")
    .select("agent_id")
    .eq("id", id)
    .maybeSingle();

  if (!form?.agent_id) return null;

  // Get configured allowed domains.
  const { data: deployment } = await supabaseAdmin
    .from("agent_deployments")
    .select("allowed_domains")
    .eq("agent_id", form.agent_id)
    .maybeSingle();

  const domains = deployment?.allowed_domains;

  if (!Array.isArray(domains)) return null;

  try {
    const hostname = new URL(origin).hostname.toLowerCase();

    const isAllowed = domains.some((domain: string) => {
      const cleanDomain = String(domain)
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");

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

function jsonResponse(
  data: unknown,
  status: number,
  origin: string
) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders(origin),
  });
}

// Handle browser CORS preflight requests.
export async function OPTIONS(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const requestOrigin = req.headers.get("origin") || "";

    const allowedOrigin = await getAllowedOrigin(
      requestOrigin,
      id
    );

    if (!allowedOrigin) {
      return NextResponse.json(
        { error: "Origin not allowed" },
        { status: 403 }
      );
    }

    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(allowedOrigin),
    });
  } catch (error) {
    console.error("Form OPTIONS error:", error);

    return NextResponse.json(
      { error: "CORS preflight failed" },
      { status: 500 }
    );
  }
}

// Submit form.
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const requestOrigin = req.headers.get("origin") || "";

    const allowedOrigin = await getAllowedOrigin(
      requestOrigin,
      id
    );

    if (!allowedOrigin) {
      return jsonResponse(
        { error: "Origin not allowed" },
        403,
        requestOrigin || "*"
      );
    }

    const body = await req.json();

    // Support both normal form submissions and chatbot submissions.
    const formData =
      body.data &&
      typeof body.data === "object" &&
      !Array.isArray(body.data)
        ? body.data
        : body;

    const visitorId = body.visitorId || null;
    const conversationId = body.conversationId || null;

    if (!id || !formData || typeof formData !== "object") {
      return jsonResponse(
        { error: "Invalid form submission" },
        400,
        allowedOrigin
      );
    }

    // Get form details.
    const { data: form, error: formError } =
      await supabaseAdmin
        .from("forms")
        .select("id, organization_id, agent_id, is_active")
        .eq("id", id)
        .maybeSingle();

    if (formError || !form) {
      return jsonResponse(
        { error: "Form not found" },
        404,
        allowedOrigin
      );
    }

    if (form.is_active === false) {
      return jsonResponse(
        { error: "This form is inactive" },
        403,
        allowedOrigin
      );
    }

    // Verify conversation ownership for chatbot submissions.
    if (conversationId) {
      if (!visitorId || !form.agent_id) {
        return jsonResponse(
          { error: "Invalid chatbot submission details" },
          400,
          allowedOrigin
        );
      }

      const { data: conversation, error: conversationError } =
        await supabaseAdmin
          .from("conversations")
          .select("id")
          .eq("id", conversationId)
          .eq("agent_id", form.agent_id)
          .eq("visitor_id", visitorId)
          .maybeSingle();

      if (conversationError || !conversation) {
        return jsonResponse(
          { error: "Invalid conversation" },
          403,
          allowedOrigin
        );
      }
    }

    // Extract common lead fields.
    const name =
      formData.name ||
      formData.full_name ||
      formData.fullname ||
      "";

    const email = formData.email || "";

    const phone =
      formData.phone ||
      formData.mobile ||
      formData.contact ||
      "";

    const company = formData.company || "";

    const message =
      formData.message ||
      formData.enquiry ||
      formData.requirement ||
      "";

    // Save the raw form submission.
    const { data: submission, error: submissionError } =
      await supabaseAdmin
        .from("form_submissions")
        .insert({
          form_id: id,
          organization_id: form.organization_id,
          data: formData,
        })
        .select()
        .single();

    if (submissionError) {
      console.error(
        "Form submission error:",
        submissionError
      );

      return jsonResponse(
        { error: submissionError.message },
        500,
        allowedOrigin
      );
    }

    // Create CRM lead.
    const { data: lead, error: leadError } =
      await supabaseAdmin
        .from("leads")
        .insert({
          organization_id: form.organization_id,
          agent_id: form.agent_id,
          form_id: id,
          conversation_id: conversationId,
          visitor_id: visitorId,
          name,
          email,
          phone,
          company,
          message,
          source: visitorId ? "Chatbot Form" : "AI Form",
          status: "new",
          metadata: formData,
        })
        .select()
        .single();

    if (leadError) {
      console.error("Lead creation error:", leadError);

      return jsonResponse(
        {
          error: leadError.message,
          submissionId: submission.id,
        },
        500,
        allowedOrigin
      );
    }

    // Record lead activity.
    const { error: activityError } = await supabaseAdmin
      .from("lead_activities")
      .insert({
        lead_id: lead.id,
        organization_id: form.organization_id,
        activity_type: "Lead Created",
        title: "Lead captured from AI Form",
        description:
          "Lead was automatically created after form submission.",
      });

    if (activityError) {
      console.error(
        "Lead activity error:",
        activityError
      );
    }

    return jsonResponse(
      {
        success: true,
        submissionId: submission.id,
        leadId: lead.id,
        message: "Form submitted successfully",
      },
      200,
      allowedOrigin
    );
  } catch (error) {
    console.error("Form submission API error:", error);

    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    );
  }
}