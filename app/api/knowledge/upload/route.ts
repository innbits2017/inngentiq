import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrganization } from "@/lib/getOrganization";
import { extractText } from "@/lib/knowledge/parser";
import { chunkText } from "@/lib/knowledge/chunker";
import { saveEmbeddings } from "@/lib/knowledge/saveEmbeddings";

export async function POST(req: NextRequest) {
  console.log("Upload API called");

  try {
    const organizationId = await getOrganization();

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const agentId = formData.get("agentId") as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "File is required",
        },
        {
          status: 400,
        }
      );
    }

    // Get Knowledge Base
    const { data: knowledgeBase, error: kbError } = await supabaseAdmin
      .from("knowledge_bases")
      .select("id")
      .eq("agent_id", agentId)
      .single();

    if (kbError) throw kbError;

    const knowledgeBaseId = knowledgeBase.id;

    console.log("Knowledge Base:", knowledgeBaseId);

    // Read file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text
    const extractedText = await extractText(buffer, file.type);

    // Chunk text
    const chunks = chunkText(extractedText);

    console.log(`Extracted ${chunks.length} chunks`);

    // Upload to Storage
    const fileName = `${Date.now()}-${file.name}`;
    const storagePath = `${organizationId}/${knowledgeBaseId}/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("knowledge-base")
      .upload(storagePath, buffer, {
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // Save document
    const { data: document, error: documentError } = await supabaseAdmin
      .from("documents")
      .insert({
        knowledge_base_id: knowledgeBaseId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        status: "uploaded",
      })
      .select()
      .single();

    if (documentError) throw documentError;

    // Save chunks
    const chunkRows = chunks.map((chunk) => ({
      document_id: document.id,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
    }));

    const { error: chunkError } = await supabaseAdmin
      .from("document_chunks")
      .insert(chunkRows);

    if (chunkError) throw chunkError;

    // Verify chunks were saved
    const { data: savedChunks, error: fetchChunkError } = await supabaseAdmin
      .from("document_chunks")
      .select("id, chunk_index")
      .eq("document_id", document.id)
      .order("chunk_index");

    if (fetchChunkError) throw fetchChunkError;

    console.log(`Saved ${savedChunks.length} chunks`);

    await saveEmbeddings(document.id);  

    return NextResponse.json({
      success: true,
      document,
      chunks: savedChunks.length,
    });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);

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