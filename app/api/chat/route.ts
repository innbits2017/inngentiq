import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { searchKnowledge } from "@/lib/searchKnowledge";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { agentId, message } = await req.json();

    // Get the agent
    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .select("organization_id, system_prompt")
      .eq("id", agentId)
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Search knowledge
    const knowledge = await searchKnowledge(
      message,
      agent.organization_id
    );

    const context = knowledge
      ?.map((item: any) => item.content)
      .join("\n\n") || "";

    // Ask OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `
${agent.system_prompt}

Use ONLY the knowledge below.

Knowledge:
${context}

If the answer is not available, reply:
"I don't have that information."
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
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}