import { NextResponse } from "next/server";
import { createEmbedding } from "@/lib/embeddings";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const {
      title,
      content,
      organizationId,
    } = await req.json();

    const embedding =
      await createEmbedding(content);

    const { error } =
      await supabaseAdmin
        .from("knowledge_chunks")
        .insert({
          organization_id:
            organizationId,
          title,
          content,
          embedding,
        });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}