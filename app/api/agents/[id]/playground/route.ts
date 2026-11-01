
import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { searchKnowledge } from "@/lib/knowledge/search";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrganization } from "@/lib/getOrganization";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // getOrganization returns the organization ID directly
    const organizationId = await getOrganization();

    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required." },
        { status: 400 }
      );
    }

    const latestMessage = messages[messages.length - 1];

    if (
      latestMessage?.role !== "user" ||
      typeof latestMessage?.content !== "string" ||
      !latestMessage.content.trim()
    ) {
      return NextResponse.json(
        { error: "A valid user message is required." },
        { status: 400 }
      );
    }

    const trimmedMessage = latestMessage.content.trim();

    // Detect services overview questions
    const isServicesOverview =
      /\b(services?|offerings?|what do you offer|what services do you provide)\b/i.test(
        trimmedMessage
      );

    // Fetch agent belonging to the authenticated organization
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .select(
        "id, organization_id, name, provider, model, system_prompt, temperature, max_tokens"
      )
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (agentError) {
      console.error("Agent lookup error:", agentError);
      return NextResponse.json(
        { error: "Unable to fetch agent." },
        { status: 500 }
      );
    }

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found." },
        { status: 404 }
      );
    }

    // Fetch agent knowledge base
    const { data: knowledgeBase, error: knowledgeBaseError } =
      await supabaseAdmin
        .from("knowledge_bases")
        .select("id")
        .eq("agent_id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

    if (knowledgeBaseError) {
      console.error("Knowledge base error:", knowledgeBaseError);

      return NextResponse.json(
        { error: "Unable to access the knowledge base." },
        { status: 500 }
      );
    }

    // Retrieve relevant knowledge
    let knowledgeContext = "";

    if (knowledgeBase) {
      const knowledgeResults = await searchKnowledge(
        knowledgeBase.id,
        trimmedMessage,
        isServicesOverview ? 10 : 5
      );

      knowledgeContext = (knowledgeResults || [])
        .map((item: any) => item.content || "")
        .filter(Boolean)
        .join("\n\n");
    }

    // Base agent instructions
    const basePrompt =
      agent.system_prompt ||
      "You are a helpful and professional AI assistant.";

    // Special instructions for services overview
    const servicesInstruction = isServicesOverview
      ? `
IMPORTANT - SERVICES OVERVIEW:

The user is asking for an overview of the services offered.

- List ALL main service categories available in the provided knowledge.
- Do NOT list subcategories or individual activities.
- Give only the main service names in a numbered list.
- Include every main service category found in the knowledge.
- Do not stop after listing only a few services.
- Do not invent services that are not in the knowledge.
- Keep the introduction short.
- Do not add unnecessary explanations.
`
      : "";

    const systemPrompt = `
${basePrompt}

GENERAL RESPONSE RULES:
- Answer using the provided knowledge base wherever relevant.
- Do not invent company information, services, features, or facts.
- Give clear and helpful answers.
- Keep answers concise unless the user requests details.
- If information is unavailable, clearly say so.

${servicesInstruction}

KNOWLEDGE BASE:
${knowledgeContext || "No relevant knowledge was found."}
`;

    // Keep recent conversation context
    const conversationMessages = messages
      .slice(-12)
      .filter(
        (message: any) =>
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string"
      )
      .map((message: any) => ({
        role: message.role as "user" | "assistant",
        content: message.content.slice(0, 6000),
      }));

    // Token limit
    const maxTokens = isServicesOverview
      ? 300
      : Number(agent.max_tokens ?? 100);

    // Generate response
    const completion = await openai.chat.completions.create({
      model: agent.model || "gpt-4.1-mini",
      temperature: Number(agent.temperature ?? 0.7),
      max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationMessages,
      ],
    });

    const answer =
      completion.choices[0]?.message?.content?.trim() ||
      "I couldn't generate a response. Please try again.";

    return NextResponse.json({
      success: true,
      answer,
      agentId: agent.id,
    });
  } catch (error) {
    console.error("Playground API error:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating the response." },
      { status: 500 }
    );
  }
}
