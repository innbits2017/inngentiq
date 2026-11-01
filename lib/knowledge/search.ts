import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateEmbeddings } from "./embeddings";

export async function searchKnowledge(
  knowledgeBaseId: string,
  question: string,
  limit = 5
) {
  const [embedding] = await generateEmbeddings([question]);

  const { data, error } = await supabaseAdmin.rpc(
    "match_knowledge_chunks",
    {
      query_embedding: embedding,
      match_count: limit,
      kb_id: knowledgeBaseId,
    }
  );

  if (error) {
    throw error;
  }

  return data;
}