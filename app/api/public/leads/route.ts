
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      agentId,
      conversationId,
      visitorId,
      name,
      email,
      phone,
      company,
      message,
    } = body;

    // Basic validation
    if (!agentId || !visitorId) {
      return NextResponse.json(
        { error: "Agent ID and Visitor ID are required" },
        { status: 400 }
      );
    }

    const cleanEmail =
      typeof email === "string" ? email.trim() : "";

    const cleanPhone =
      typeof phone === "string" ? phone.trim() : "";

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json(
        { error: "Please provide an email address or phone number" },
        { status: 400 }
      );
    }

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Fetch agent and its organisation
    const { data: agent, error: agentError } =
      await supabaseAdmin
        .from("agents")
        .select("id, organization_id, is_active")
        .eq("id", agentId)
        .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    if (agent.is_active === false) {
      return NextResponse.json(
        { error: "This agent is inactive" },
        { status: 403 }
      );
    }

    // Verify conversation ownership when supplied
    if (conversationId) {
      const { data: conversation, error: conversationError } =
        await supabaseAdmin
          .from("conversations")
          .select("id")
          .eq("id", conversationId)
          .eq("agent_id", agentId)
          .eq("visitor_id", visitorId)
          .maybeSingle();

      if (conversationError || !conversation) {
        return NextResponse.json(
          { error: "Invalid conversation" },
          { status: 403 }
        );
      }
    }

    // Save lead
    const { data: lead, error: leadError } =
      await supabaseAdmin
        .from("leads")
        .insert({
          organization_id: agent.organization_id,
          agent_id: agent.id,
          conversation_id: conversationId || null,
          visitor_id: visitorId,
          name: typeof name === "string" ? name.trim() : null,
          email: cleanEmail || null,
          phone: cleanPhone || null,
          company:
            typeof company === "string" ? company.trim() : null,
          message:
            typeof message === "string" ? message.trim() : null,
          source: "chatbot",
          status: "new",
        })
        .select()
        .single();

    if (leadError) {
      console.error("Lead creation error:", leadError);

      return NextResponse.json(
        { error: "Could not save lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead saved successfully",
      lead,
    });
  } catch (error) {
    console.error("Lead API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
