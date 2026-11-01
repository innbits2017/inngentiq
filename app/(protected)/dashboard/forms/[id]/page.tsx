
"use client";

import { use, useEffect, useState } from "react";
import AddFieldDialog from "@/components/forms/AddFieldDialog";
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import EditFieldDialog from "@/components/forms/EditFieldDialog";

interface Agent {
  id: string;
  name: string;
}

export default function FormBuilder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);

  const [selectedField, setSelectedField] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("manual");
  const [isActive, setIsActive] = useState(true);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load available AI agents
  const loadAgents = async () => {
    try {
      const response = await fetch("/api/agents");

      if (!response.ok) {
        throw new Error("Could not load AI agents");
      }

      const data = await response.json();

      const agentList = Array.isArray(data)
        ? data
        : data.agents || [];

      setAgents(agentList);
    } catch (error) {
      console.error("Agent loading error:", error);
    } finally {
      setAgentsLoading(false);
    }
  };

  // Load form and fields
  const loadFields = async () => {
    try {
      const [fieldsRes, formRes] = await Promise.all([
        fetch(`/api/forms/${id}`),
        fetch(`/api/forms/${id}/fields`),
      ]);

      if (!fieldsRes.ok || !formRes.ok) {
        throw new Error("Could not load form details");
      }

      const [formData, fieldsData] = await Promise.all([
        fieldsRes.json(),
        formRes.json(),
      ]);

      setFields(fieldsData);
      setForm(formData);

      setName(formData.name || "");
      setDescription(formData.description || "");
      setTriggerType(formData.trigger_type || "manual");
      setIsActive(formData.is_active ?? true);
      setAgentId(formData.agent_id || "");
    } catch (error) {
      console.error("Form loading error:", error);
    }
  };

  useEffect(() => {
    loadFields();
    loadAgents();
  }, [id]);

  // Save form settings
  const saveForm = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          trigger_type: triggerType,
          is_active: isActive,
          agent_id: agentId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save form");
      }

      alert("Form saved successfully!");
      await loadFields();
    } catch (error) {
      console.error("Save form error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Could not save form"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Form Builder
          </h1>

          <div className="flex gap-3">
            <Link
              href={`/dashboard/forms/${id}/preview`}
              className="border rounded-xl px-5 py-3"
            >
              Preview
            </Link>

            <button
              onClick={() => setOpen(true)}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl"
            >
              + Add Field
            </button>
          </div>
        </div>

        {/* Form Settings */}
        <div className="border rounded-xl p-6 mb-8 space-y-5">
          <h2 className="text-xl font-semibold">
            Form Settings
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">
              Form Name
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Form Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Description"
            />
          </div>

          {/* AI Agent Assignment */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Assign to AI Agent
            </label>

            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              disabled={agentsLoading}
              className="w-full border rounded-lg px-3 py-3 bg-white"
            >
              <option value="">
                {agentsLoading
                  ? "Loading agents..."
                  : "Select an AI Agent"}
              </option>

              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>

            <p className="text-xs text-gray-500 mt-2">
              Select the AI agent that should use this form.
            </p>

            {!agentsLoading && agents.length === 0 && (
              <p className="text-sm text-red-500 mt-2">
                No agents found. Please check the agents API.
              </p>
            )}
          </div>

          {/* Trigger Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Trigger Type
            </label>

            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="manual">Manual</option>
              <option value="pricing">Pricing</option>
              <option value="quote">Quote</option>
              <option value="contact">Contact</option>
              <option value="callback">Callback</option>
              <option value="demo">Demo</option>
              <option value="booking">Booking</option>
            </select>
          </div>

          {/* Active */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>

          <button
            onClick={saveForm}
            disabled={saving}
            className="bg-green-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Form"}
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold mb-4">
            Form Fields
          </h2>

          {fields.map((field) => (
            <div
              key={field.id}
              className="border rounded-xl p-5 flex justify-between items-start"
            >
              <div>
                <div className="font-semibold">
                  {field.label}
                </div>

                <div className="text-sm text-gray-500">
                  {field.field_type}
                </div>

                {field.placeholder && (
                  <div className="text-sm mt-1 text-gray-400">
                    {field.placeholder}
                  </div>
                )}

                {field.options?.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {field.options.map((option: string) => (
                      <span
                        key={option}
                        className="px-2 py-1 rounded bg-gray-100 text-sm"
                      >
                        {option}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedField(field);
                    setEditOpen(true);
                  }}
                  className="text-blue-600"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={async () => {
                    await fetch(`/api/form-fields/${field.id}/move`, {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        sort_order: field.sort_order - 1,
                      }),
                    });

                    loadFields();
                  }}
                >
                  <ArrowUp size={18} />
                </button>

                <button
                  onClick={async () => {
                    await fetch(`/api/form-fields/${field.id}/move`, {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        sort_order: field.sort_order + 1,
                      }),
                    });

                    loadFields();
                  }}
                >
                  <ArrowDown size={18} />
                </button>

                <button
                  onClick={async () => {
                    if (!confirm("Delete field?")) return;

                    await fetch(`/api/form-fields/${field.id}`, {
                      method: "DELETE",
                    });

                    loadFields();
                  }}
                  className="text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="border rounded-xl p-10 text-center text-gray-500">
              No fields yet
            </div>
          )}
        </div>
      </div>

      <AddFieldDialog
        formId={id}
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={loadFields}
      />

      <EditFieldDialog
        open={editOpen}
        field={selectedField}
        onClose={() => {
          setEditOpen(false);
          setSelectedField(null);
        }}
        onSuccess={loadFields}
      />
    </>
  );
}
