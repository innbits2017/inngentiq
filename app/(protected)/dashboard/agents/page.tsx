
"use client";

import { useEffect, useState } from "react";
import AgentCard from "@/components/agents/agent-card";
import CreateAgentDialog from "@/components/agents/create-agent-dialog";
import { Bot, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAgents() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/agents", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load agents.");
      }

      setAgents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to load agents:", err);
      setError(err.message || "Unable to load AI agents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
  }, []);

  function handleAgentCreated(agent: any) {
    setAgents((prev) => {
      const exists = prev.some((item) => item.id === agent.id);

      return exists
        ? prev.map((item) =>
            item.id === agent.id ? agent : item
          )
        : [agent, ...prev];
    });
  }

  return (
    <div className="min-h-full space-y-5 bg-[#F4F3FF] p-1">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#5149E8]">
              <Bot size={22} />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#20234A]">
              AI Agents
            </h1>
          </div>

          <p className="mt-1.5 text-sm text-slate-500">
            Create and manage your AI employees.
          </p>
        </div>

        <CreateAgentDialog onCreated={handleAgentCreated} />
      </div>

      {/* Compact Statistics */}
      {!loading && !error && (
        <div className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_2px_10px_rgba(32,35,74,0.05)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#5149E8]">
            <Bot size={19} />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              Total AI Agents
            </p>

            <p className="text-xl font-bold text-[#20234A]">
              {agents.length}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_2px_10px_rgba(32,35,74,0.05)]">
          <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#5149E8]" />

          <p className="mt-2 text-sm text-slate-500">
            Loading AI Agents...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_2px_10px_rgba(32,35,74,0.05)]">
          <p className="font-semibold text-[#20234A]">
            Unable to load AI agents
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <Button
            onClick={loadAgents}
            className="mt-4 rounded-xl bg-[#5149E8] text-white hover:bg-[#433BD1]"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && agents.length === 0 && (
        <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-[0_2px_10px_rgba(32,35,74,0.05)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EEFF] text-[#5149E8]">
            <Bot size={27} />
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#20234A]">
            No AI Agents Yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Create your first AI Agent to answer customer questions,
            automate conversations and power your website, WhatsApp
            and Voice AI.
          </p>

          <div className="mt-5">
            <CreateAgentDialog onCreated={handleAgentCreated} />
          </div>
        </div>
      )}

      {/* Agent Cards */}
      {!loading && !error && agents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              id={agent.id}
              name={agent.name}
              description={
                agent.description || "No description available."
              }
              model={agent.model || "gpt-4.1-mini"}
              status={agent.status || "Inactive"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
