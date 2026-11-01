"use client";

import { useState } from "react";

export default function AddNote({
  leadId,
}: {
  leadId: string;
}) {
  const [note, setNote] = useState("");

  return (
    <div className="bg-white border rounded-xl p-6">

      <h2 className="text-lg font-semibold mb-4">
        Add Note
      </h2>

      <textarea
        rows={5}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full border rounded-lg p-3"
        placeholder="Write your note..."
      />

      <button
        className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg"
        onClick={async () => {

          if (!note.trim()) return;

          await fetch(`/api/leads/${leadId}/notes`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              note,
            }),
          });

          location.reload();

        }}
      >
        Save Note
      </button>

    </div>
  );
}