
"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function PlaygroundPage() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! 👋 I'm your AI assistant.\nAsk me anything about your business.",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage() {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: "ad19dcb9-368b-40ec-a197-7345336e495a",
          message: userMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Unable to get a response."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.answer ||
            data.error ||
            "Something went wrong.",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Unable to contact the AI server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-5xl flex-col p-8">
      <h1 className="mb-6 text-4xl font-bold">
        AI Playground
      </h1>

      <div className="flex-1 overflow-y-auto rounded-xl border bg-gray-50 p-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-6 flex ${
              msg.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-xl whitespace-pre-wrap rounded-2xl px-5 py-4 shadow ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "border bg-white"
              }`}
            >
              <div className="mb-2 font-semibold">
                {msg.role === "user"
                  ? "You"
                  : "AI Assistant"}
              </div>

              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl border bg-white px-5 py-4 shadow">
              <div className="mb-2 font-semibold">
                AI Assistant
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <span className="animate-pulse">
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="mt-6 flex gap-4">
        <input
          className="flex-1 rounded-xl border p-4"
          placeholder="Ask anything..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading || !message.trim()}
          className="rounded-xl bg-blue-600 px-8 text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
