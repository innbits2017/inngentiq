import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  await supabase.auth.getUser();

  const { data: session } = await supabaseAdmin
    .from("chat_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (!session) {
    notFound();
  }

  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at");

  return (
    <div className="max-w-4xl mx-auto p-8">

      <h1 className="text-3xl font-bold mb-2">
        Conversation
      </h1>

      <p className="text-gray-500 mb-8">
        Visitor: {session.visitor_id}
      </p>

      <div className="space-y-6">

        {messages?.map((msg) => (

          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >

            <div
              className={`max-w-xl rounded-xl p-4 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100"
              }`}
            >

              <div className="font-semibold mb-2">
                {msg.role.toUpperCase()}
              </div>

              <div>
                {msg.message}
              </div>

              <div className="text-xs mt-3 opacity-70">
                {new Date(
                  msg.created_at
                ).toLocaleString()}
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}