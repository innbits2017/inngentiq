
"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Send,
  User,
  X,
} from "lucide-react";

interface WidgetPreviewProps {
  settings: any;
}

interface Message {
  id: number;
  role: "assistant" | "user";
  content: string;
}

export default function WidgetPreview({
  settings,
}: WidgetPreviewProps) {
  const [open, setOpen] = useState(true);

  const primaryColor = settings?.primary_color || "#5149E8";
  const textColor = settings?.text_color || "#ffffff";
  const agentName = settings?.widget_title || "AI Assistant";
  const borderRadius = settings?.border_radius ?? 20;

  const welcome =
    settings?.welcome_message ||
    "Hello! How can I help you today?";

  const avatar = settings?.avatar_url || "";

  const position =
    settings?.position === "bottom-left" ? "left" : "right";

  const isDark = settings?.theme === "dark";

  // Keep hooks above conditional returns
  const fakeMessages = useMemo<Message[]>(
    () => [
      {
        id: 1,
        role: "assistant",
        content: welcome,
      },
      {
        id: 2,
        role: "user",
        content: "Can you tell me about your services?",
      },
      {
        id: 3,
        role: "assistant",
        content:
          "Absolutely! We provide AI chatbots, automation, and custom software development.",
      },
    ],
    [welcome]
  );

  if (!settings?.is_active) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-slate-100">
        <div className="text-center">
          <Bot className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p className="font-medium text-slate-600">
            Widget is Disabled
          </p>
          <p className="text-sm text-slate-500">
            Enable the widget to preview it.
          </p>
        </div>
      </div>
    );
  }

  const Launcher = () => (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setOpen((prev) => !prev)}
      className="flex h-14 w-14 items-center justify-center rounded-full shadow-xl"
      style={{
        background: primaryColor,
        color: textColor,
      }}
    >
      {open ? (
        <X size={26} />
      ) : avatar ? (
        <img
          src={avatar}
          alt=""
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <Bot size={26} />
      )}
    </motion.button>
  );

  return (
    <div className="relative h-full w-full rounded-xl">
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems:
            position === "left" ? "flex-start" : "flex-end",
          left: position === "left" ? "12px" : undefined,
          right: position === "right" ? "12px" : undefined,
          maxWidth: "100%",
        }}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`mb-4 flex h-[460px] w-[340px] max-w-full flex-col overflow-hidden shadow-xl ${
                isDark ? "bg-slate-900" : "bg-white"
              }`}
              style={{ borderRadius }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{
                  background: primaryColor,
                  color: textColor,
                }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={agentName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <Bot size={20} />
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="font-semibold">{agentName}</h3>
                  <p className="text-xs opacity-90">
                    Online now
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div
                className={`flex-1 space-y-4 overflow-y-auto p-4 ${
                  isDark ? "bg-black" : "bg-slate-50"
                }`}
              >
                {fakeMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[85%] gap-2 ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          message.role === "assistant"
                            ? isDark
                              ? "bg-zinc-400"
                              : "bg-slate-200"
                            : ""
                        }`}
                        style={
                          message.role === "user"
                            ? {
                                background: primaryColor,
                                color: textColor,
                              }
                            : {}
                        }
                      >
                        {message.role === "assistant" ? (
                          <Bot size={16} />
                        ) : (
                          <User size={16} />
                        )}
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          message.role === "assistant"
                            ? isDark
                              ? "bg-zinc-800 text-white"
                              : "bg-white text-slate-700 shadow"
                            : "text-white"
                        }`}
                        style={
                          message.role === "user"
                            ? { background: primaryColor }
                            : {}
                        }
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input preview */}
              <div
                className={`border-t p-4 ${
                  isDark
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className={`min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none ${
                      isDark
                        ? "border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500"
                        : "border-slate-300 bg-white text-black"
                    }`}
                  />

                  <button
                    type="button"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: primaryColor,
                      color: textColor,
                    }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          <Launcher />
        </motion.div>
      </div>
    </div>
  );
}
