"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function PlaygroundPage() {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<ChatMessage>([
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
  }, [messages]);

  async function sendMessage() {
    if (!message.trim() || loading) return;

    const userMessage = message;

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

    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Unable to contact the AI server.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto h-screen flex flex-col p-8">

      <h1 className="text-4xl font-bold mb-6">
        AI Playground
      </h1>

      <div className="flex-1 overflow-y-auto border rounded-xl p-6 bg-gray-50">

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
              className={`max-w-xl rounded-2xl px-5 py-4 whitespace-pre-wrap shadow

              ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white border"
              }`}
            >

              <div className="font-semibold mb-2">
                {msg.role === "user"
                  ? "You"
                  : "AI Assistant"}
              </div>

              {msg.content}


            </div>

          </div>

        ))}

        {loading && (

          <div className="flex">

            <div className="bg-white border rounded-xl px-5 py-4 shadow">

              <div className="font-semibold mb-2">
                AI Assistant
              </div>

              Thinking...

            </div>

          </div>

        )}

        <div ref={bottomRef} />

      </div>

      <div className="mt-6 flex gap-4">

        <input
          className="flex-1 border rounded-xl p-4"
          placeholder="Ask anything..."
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white px-8 rounded-xl disabled:opacity-50"
        >
          Send
        </button>

      </div>

    </div>
  );
}