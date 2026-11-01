"use client";

import { useState } from "react";

interface Props {
  knowledgeBaseId: string;
}

export default function KnowledgeSearchTest({
  knowledgeBaseId,
}: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  async function search() {
    setLoading(true);

    const res = await fetch("/api/knowledge/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        knowledgeBaseId,
        question,
      }),
    });

    const data = await res.json();

    setResults(data);

    setLoading(false);
  }

  return (
    <div className="rounded-xl border p-6 space-y-4">
      <h2 className="text-lg font-semibold">
        Knowledge Search Test
      </h2>

      <textarea
        className="w-full rounded border p-3"
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask something..."
      />

      <button
        onClick={search}
        disabled={loading}
        className="rounded bg-black px-5 py-2 text-white"
      >
        {loading ? "Searching..." : "Search"}
      </button>

      <div className="space-y-4">
        {results.map((chunk) => (
          <div
            key={chunk.id}
            className="rounded border p-4"
          >
            <div className="text-sm text-green-600">
              Similarity: {chunk.similarity.toFixed(3)}
            </div>

            <p className="mt-2 whitespace-pre-wrap">
              {chunk.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}