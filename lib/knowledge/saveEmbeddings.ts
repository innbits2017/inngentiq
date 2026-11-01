import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateEmbeddings } from "./embeddings";

export async function saveEmbeddings(documentId: string) {
  const { data: chunks, error } = await supabaseAdmin
    .from("document_chunks")
    .select("id, content")
    .eq("document_id", documentId)
    .order("chunk_index");

  if (error) throw error;

  if (!chunks || chunks.length === 0) {
    return;
  }

  const embeddings = await generateEmbeddings(
    chunks.map((chunk) => chunk.content)
  );

  const updates = chunks.map((chunk, index) =>
    supabaseAdmin
      .from("document_chunks")
      .update({
        embedding: embeddings[index],
      })
      .eq("id", chunk.id)
  );

  await Promise.all(updates);

  console.log(`Generated embeddings for ${chunks.length} chunks`);
}