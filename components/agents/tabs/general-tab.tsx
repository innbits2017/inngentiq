
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bot, Save, Loader2, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  agent: any;
  onUpdated: (agent: any) => void;
}

export default function GeneralTab({ agent, onUpdated }: Props) {
  const [form, setForm] = useState({
    name: agent.name || "",
    description: agent.description || "",
    provider: agent.provider || "openai",
    model: agent.model || "gpt-4.1-mini",
    system_prompt: agent.system_prompt || "",
    welcome_message: agent.welcome_message || "",
    temperature: agent.temperature ?? 0.7,
    max_tokens: agent.max_tokens ?? 4000,
    avatar_url: agent.avatar_url || "",
  });

  const [loading, setLoading] = useState(false);

  // Refresh form if another agent is loaded.
  useEffect(() => {
    setForm({
      name: agent.name || "",
      description: agent.description || "",
      provider: agent.provider || "openai",
      model: agent.model || "gpt-4.1-mini",
      system_prompt: agent.system_prompt || "",
      welcome_message: agent.welcome_message || "",
      temperature: agent.temperature ?? 0.7,
      max_tokens: agent.max_tokens ?? 4000,
      avatar_url: agent.avatar_url || "",
    });
  }, [agent]);

  function updateField(name: string, value: any) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Agent name is required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to save settings.");
      }

      onUpdated(data.agent);
      toast.success("Agent settings saved successfully.");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "h-10 rounded-xl border-0 bg-[#F4F3FF] text-[#20234A] shadow-none focus-visible:ring-2 focus-visible:ring-[#5149E8]/30";

  const labelClass =
    "mb-1.5 block text-sm font-semibold text-[#20234A]";

  return (
    <div className="space-y-4">

      {/* Agent Identity */}
      <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(32,35,74,0.05)] sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#5149E8]">
            <Bot size={21} />
          </div>

          <div>
            <h2 className="font-bold text-[#20234A]">
              Agent Information
            </h2>
            <p className="text-xs text-slate-500">
              Configure your AI agent's identity.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Agent Name *</label>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Sales Assistant"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>AI Provider</label>
            <Input
              value={form.provider}
              onChange={(e) => updateField("provider", e.target.value)}
              placeholder="openai"
              className={fieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="What does this agent do?"
              rows={2}
              className="resize-none rounded-xl border-0 bg-[#F4F3FF] text-[#20234A] shadow-none focus-visible:ring-2 focus-visible:ring-[#5149E8]/30"
            />
          </div>

          <div>
            <label className={labelClass}>AI Model</label>
            <Input
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
              placeholder="gpt-4.1-mini"
              className={fieldClass}
            />
          </div>

          <div>
            <label className={labelClass}>Avatar URL</label>
            <Input
              value={form.avatar_url}
              onChange={(e) => updateField("avatar_url", e.target.value)}
              placeholder="https://..."
              className={fieldClass}
            />
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(32,35,74,0.05)] sm:p-6">
        <div className="mb-5">
          <h2 className="font-bold text-[#20234A]">
            Agent Instructions
          </h2>
          <p className="text-xs text-slate-500">
            Define how your AI agent should behave and respond.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>System Prompt</label>
            <Textarea
              value={form.system_prompt}
              onChange={(e) =>
                updateField("system_prompt", e.target.value)
              }
              placeholder="You are a helpful AI assistant for..."
              rows={7}
              className="resize-y rounded-xl border-0 bg-[#F4F3FF] text-[#20234A] shadow-none focus-visible:ring-2 focus-visible:ring-[#5149E8]/30"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Describe the agent's role, responsibilities, tone and limitations.
            </p>
          </div>

          <div>
            <label className={labelClass}>Welcome Message</label>
            <Textarea
              value={form.welcome_message}
              onChange={(e) =>
                updateField("welcome_message", e.target.value)
              }
              placeholder="Hello! How can I help you today?"
              rows={3}
              className="resize-none rounded-xl border-0 bg-[#F4F3FF] text-[#20234A] shadow-none focus-visible:ring-2 focus-visible:ring-[#5149E8]/30"
            />
          </div>
        </div>
      </section>

      {/* Model Parameters */}
      <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(32,35,74,0.05)] sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF8F6] text-[#20AAA6]">
            <SlidersHorizontal size={20} />
          </div>

          <div>
            <h2 className="font-bold text-[#20234A]">
              Model Parameters
            </h2>
            <p className="text-xs text-slate-500">
              Control the agent's response generation.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Temperature</label>
            <Input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={form.temperature}
              onChange={(e) =>
                updateField("temperature", e.target.value)
              }
              className={fieldClass}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Lower values produce more consistent responses. Range: 0–2.
            </p>
          </div>

          <div>
            <label className={labelClass}>Maximum Tokens</label>
            <Input
              type="number"
              min="1"
              step="100"
              value={form.max_tokens}
              onChange={(e) =>
                updateField("max_tokens", e.target.value)
              }
              className={fieldClass}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Maximum response length allowed by the model.
            </p>
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={loading}
          className="h-10 rounded-xl bg-[#5149E8] px-6 text-white shadow-sm hover:bg-[#433BD1]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
