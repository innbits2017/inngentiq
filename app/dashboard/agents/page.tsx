"use client";

import { useState } from "react";

export default function AgentsPage() {
  const [name, setName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  async function createAgent() {
    console.log({
      name,
      welcomeMessage,
      systemPrompt,
    });

    alert("Agent Saved");
  }

  return (
    <div className="p-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">
        Create Agent
      </h1>

      <input
        className="border p-2 w-full mb-4"
        placeholder="Agent Name"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

      <textarea
        className="border p-2 w-full mb-4"
        placeholder="Welcome Message"
        value={welcomeMessage}
        onChange={(e) =>
          setWelcomeMessage(e.target.value)
        }
      />

      <textarea
        className="border p-2 w-full mb-4 h-40"
        placeholder="System Prompt"
        value={systemPrompt}
        onChange={(e) =>
          setSystemPrompt(e.target.value)
        }
      />

      <button
        onClick={createAgent}
        className="border px-4 py-2"
      >
        Save Agent
      </button>
    </div>
  );
}