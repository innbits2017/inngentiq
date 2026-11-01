import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { searchKnowledge } from "@/lib/knowledge/search";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { detectIntent } from "@/lib/ai/intent";

export async function POST(req: Request) {
  try {
    const { agentId, message } = await req.json();
    const intent = detectIntent(message);

    // Get Agent
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select("system_prompt")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Get Knowledge Base
    const { data: knowledgeBase, error: kbError } = await supabaseAdmin
      .from("knowledge_bases")
      .select("id")
      .eq("agent_id", agentId)
      .single();

    if (kbError || !knowledgeBase) {
      return NextResponse.json(
        { error: "Knowledge Base not found" },
        { status: 404 }
      );
    }

    // Search the Knowledge Base
    const chunks = await searchKnowledge(
      knowledgeBase.id,
      message,
      5
    );

    const context = chunks
      .map((chunk: any) => chunk.content)
      .join("\n\n");
      

    // Ask OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
${agent.system_prompt}

You are an AI assistant that answers ONLY using the supplied knowledge.

If the answer is not present in the knowledge, reply exactly:

"I don't have that information."

Knowledge:
${context}
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return NextResponse.json({
      answer: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}