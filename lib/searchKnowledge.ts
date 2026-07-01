import { createEmbedding } from "./embeddings";
import { supabaseAdmin } from "./supabase/admin";

export async function searchKnowledge(
  question: string,
  organizationId: string
) {
  // Create embedding for the user's question
  const embedding = await createEmbedding(question);

  // Search the vector database for this organization only
  const { data, error } = await supabaseAdmin.rpc(
    "match_knowledge_chunks",
    {
      query_embedding: embedding,
      org_id: organizationId,
      match_count: 5,
    }
  );

  if (error) {
    console.error("Knowledge Search Error:", error);
    throw error;
  }

  return data ?? [];
}