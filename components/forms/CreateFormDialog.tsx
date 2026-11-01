
"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Agent = {
  id: string;
  name: string;
};

export default function CreateFormDialog({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agentId, setAgentId] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    const loadAgents = async () => {
      setLoadingAgents(true);

      try {
        const res = await fetch("/api/agents");

        if (!res.ok) {
          throw new Error("Failed to load agents");
        }

        const data = await res.json();

        setAgents(Array.isArray(data) ? data : data.agents || []);
      } catch (error) {
        console.error("Agent loading error:", error);
      } finally {
        setLoadingAgents(false);
      }
    };

    loadAgents();
  }, [open]);

  if (!open) return null;

  const createForm = async () => {
    if (!name.trim()) {
      alert("Please enter a form name");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          agent_id: agentId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create form");
      }

      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Create form error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create form"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6">
        <h2 className="text-xl font-semibold mb-6">
          Create Form
        </h2>

        <div className="space-y-4">
          {/* Form Name */}
          <div>
            <label className="text-sm font-medium">
              Form Name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Quotation Form"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              rows={4}
              placeholder="Optional"
            />
          </div>

          {/* AI Agent Assignment */}
          <div>
            <label className="text-sm font-medium">
              Assign to AI Agent
            </label>

            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              disabled={loadingAgents}
              className="mt-1 w-full rounded-lg border px-3 py-3 bg-white"
            >
              <option value="">
                {loadingAgents
                  ? "Loading agents..."
                  : "Select an AI Agent"}
              </option>

              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border px-4 py-2"
          >
            Cancel
          </button>

          <button
            onClick={createForm}
            disabled={saving || loadingAgents}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Form"}
          </button>
        </div>
      </div>
    </div>
  );
}
