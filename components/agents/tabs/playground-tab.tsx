
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  User,
  Plus,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  agent: any;
}

export default function PlaygroundTab({ agent }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();

    if (!text || loading) return;

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `/api/agents/${agent.id}/playground`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: updatedMessages,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || "Unable to generate response."
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
      // Remove the unanswered user message so it can be retried.
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    if (loading) return;

    setMessages([]);
    setInput("");
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(32,35,74,0.05)]">

      {/* Playground Header */}
      <div className="flex flex-col justify-between gap-3 bg-white p-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#5149E8]">
            <Bot size={21} />
          </div>

          <div>
            <h2 className="font-bold text-[#20234A]">
              Agent Playground
            </h2>
            <p className="text-xs text-slate-500">
              Test how {agent.name} responds to customers.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={startNewChat}
          disabled={loading || messages.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F0EEFF] px-3 py-2 text-sm font-medium text-[#5149E8] transition-colors hover:bg-[#E7E3FF] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          New Test
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex h-[480px] flex-col bg-[#F4F3FF]/60">

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">

          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EEFF] text-[#5149E8]">
                <Bot size={30} />
              </div>

              <h3 className="mt-4 font-bold text-[#20234A]">
                Test your AI Agent
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Send a message to see how your agent responds using
                its instructions and connected knowledge base.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {[
                  "What can you help me with?",
                  "Tell me about your services.",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="rounded-xl bg-white px-3 py-2 text-xs text-[#5149E8] shadow-sm transition-colors hover:bg-[#F0EEFF]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                message.role === "user"
                  ? "flex-row-reverse"
                  : ""
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  message.role === "assistant"
                    ? "bg-[#F0EEFF] text-[#5149E8]"
                    : "bg-[#EAF8F6] text-[#16877F]"
                }`}
              >
                {message.role === "assistant" ? (
                  <Bot size={17} />
                ) : (
                  <User size={17} />
                )}
              </div>

              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "rounded-tl-sm bg-white text-[#20234A] shadow-sm"
                    : "rounded-tr-sm bg-[#5149E8] text-white"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EEFF] text-[#5149E8]">
                <Bot size={17} />
              </div>

              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                <Loader2
                  size={15}
                  className="animate-spin text-[#5149E8]"
                />
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 rounded-xl bg-[#F4F3FF] p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${agent.name}...`}
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-[#20234A] outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5149E8] text-white transition-colors hover:bg-[#433BD1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between px-1">
            <p className="text-[11px] text-slate-400">
              Playground messages are not saved as customer conversations.
            </p>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={startNewChat}
                disabled={loading}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#5149E8] disabled:opacity-40"
              >
                <RotateCcw size={11} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
