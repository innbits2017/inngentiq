import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Agent ID is required",
        },
        { status: 400 }
      );
    }

    // Find the Knowledge Base
    const {
      data: knowledgeBase,
      error: kbError,
    } = await supabaseAdmin
      .from("knowledge_bases")
      .select("id")
      .eq("agent_id", agentId)
      .single();

    if (kbError) throw kbError;

    // Fetch Documents
    const {
      data: documents,
      error: documentsError,
    } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("knowledge_base_id", knowledgeBase.id)
      .order("created_at", {
        ascending: false,
      });

    if (documentsError) throw documentsError;

    return NextResponse.json(documents);

  } catch (err: any) {

    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: 500,
      }
    );

  }
}