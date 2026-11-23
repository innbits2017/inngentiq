
import { openai } from "@/lib/openai";
import { searchKnowledge } from "@/lib/knowledge/search";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface ProcessWhatsAppMessageParams {
  agentId: string;
  conversationId: string;
  message: string;
  excludeMessageId: string;
}

export async function processWhatsAppMessage({
  agentId,
  conversationId,
  message,
  excludeMessageId,
}: ProcessWhatsAppMessageParams): Promise<string> {
  const normalizedMessage = message.trim();

  if (
    !agentId ||
    !conversationId ||
    !normalizedMessage ||
    !excludeMessageId
  ) {
    throw new Error(
      "Agent ID, conversation ID, message and message ID are required."
    );
  }

  // 1. Retrieve the AI agent.
  const { data: agent, error: agentError } = await supabaseAdmin
    .from("agents")
    .select("system_prompt")
    .eq("id", agentId)
    .single();

  if (agentError || !agent) {
    throw new Error("AI agent not found.");
  }

  // 2. Retrieve the agent's knowledge base.
  const { data: knowledgeBase, error: kbError } =
    await supabaseAdmin
      .from("knowledge_bases")
      .select("id")
      .eq("agent_id", agentId)
      .single();

  if (kbError || !knowledgeBase) {
    throw new Error("Knowledge base not found.");
  }

  // 3. Search the knowledge base.
  const chunks = await searchKnowledge(
    knowledgeBase.id,
    normalizedMessage,
    5
  );

  const context = chunks
    .map((chunk: any) => chunk.content)
    .join("\n\n");

  // 4. Retrieve the last 20 previous messages.
  // Exclude the current incoming message because it is
  // passed separately to the AI below.
  const { data: history, error: historyError } =
    await supabaseAdmin
      .from("conversation_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .neq("id", excludeMessageId)
      .order("created_at", { ascending: false })
      .limit(20);

  if (historyError) {
    console.error(
      "WhatsApp conversation history error:",
      historyError
    );

    throw new Error(
      "Could not retrieve conversation history."
    );
  }

  // 5. Reverse messages into chronological order.
  const conversationHistory = (history || [])
    .reverse()
    .filter((item) =>
      ["user", "assistant", "human"].includes(item.role)
    )
    .map((item) => ({
      role:
        item.role === "user"
          ? ("user" as const)
          : ("assistant" as const),
      content:
        item.role === "human"
          ? `A human support agent previously replied: ${item.content}`
          : item.content,
    }));

  // 6. Generate the AI response.
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `
${agent.system_prompt}

You are an AI assistant that answers ONLY using the supplied knowledge.

Use previous conversation messages to understand follow-up questions.

Do not treat previous AI responses or human replies as verified knowledge.
Use the supplied knowledge base as the source of factual answers.

If the answer is not present in the knowledge, reply exactly:

"I don't have that information."

Knowledge:
${context || "No relevant knowledge was found."}
`,
      },
      ...conversationHistory,
      {
        role: "user",
        content: normalizedMessage,
      },
    ],
  });

  const answer =
    completion.choices[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error("AI generated an empty response.");
  }

  return answer;
}
