import { NextRequest, NextResponse } from "next/server";
import { searchKnowledge } from "@/lib/knowledge/search";

export async function POST(req: NextRequest) {
  try {
    const { knowledgeBaseId, question } = await req.json();

    const results = await searchKnowledge(
      knowledgeBaseId,
      question
    );

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}