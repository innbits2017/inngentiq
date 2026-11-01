"use client";

import { useState } from "react";

export default function KnowledgeBasePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function saveKnowledge() {
    console.log({
      title,
      content,
    });

    alert("Saved");
  }

  return (
    <div className="p-10 max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        Knowledge Base
      </h1>

      <input
        className="border p-2 w-full mb-4"
        placeholder="Title"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
      />

      <textarea
        className="border p-2 w-full h-64"
        placeholder="Content"
        value={content}
        onChange={(e) =>
          setContent(e.target.value)
        }
      />

      <button
        className="border px-4 py-2 mt-4"
        onClick={saveKnowledge}
      >
        Save
      </button>

    </div>
  );
}