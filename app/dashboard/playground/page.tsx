"use client";

import { useState } from "react";

export default function PlaygroundPage() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");

  async function sendMessage() {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agentId: "4ba4216e-96da-44f0-b3ab-b189ea26d713",
      message,
    }),
  });

  const data = await res.json();

  console.log("API Response:", data);

  alert(JSON.stringify(data, null, 2));

  setAnswer(data.answer || "No answer returned");
}

  return (
    <div className="p-10">

      <h1 className="text-2xl font-bold mb-4">
        AI Playground
      </h1>

      <textarea
        className="border w-full p-2"
        value={message}
        onChange={(e) =>
          setMessage(e.target.value)
        }
      />

      <button
        onClick={sendMessage}
        className="border px-4 py-2 mt-4"
      >
        Ask AI
      </button>

      <div className="mt-8 border p-4">
        {answer}
      </div>

    </div>
  );
}