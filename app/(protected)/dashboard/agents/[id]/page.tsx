
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, RefreshCw } from "lucide-react";

import AgentHeader from "@/components/agents/agent-header";
import AgentTabs from "@/components/agents/agent-tabs";
import GeneralTab from "@/components/agents/tabs/general-tab";
import KnowledgeTab from "@/components/agents/tabs/knowledge-tab";
import PlaygroundTab from "@/components/agents/tabs/playground-tab";
import DeploySettings from "@/components/agents/DeploySettings";

export default function AgentDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [agent, setAgent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadAgent() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/agents/${id}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || data.success === false) {
          throw new Error(data.error || "Unable to load agent.");
        }

        if (!cancelled) {
          setAgent(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Unable to load agent.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAgent();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white shadow-sm">
        <RefreshCw className="h-6 w-6 animate-spin text-[#5149E8]" />
        <p className="mt-3 text-sm text-slate-500">
          Loading agent...
        </p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <Bot className="mx-auto h-8 w-8 text-[#5149E8]" />
        <h2 className="mt-3 font-semibold text-[#20234A]">
          Unable to load agent
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {error || "Agent not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 bg-[#F4F3FF] p-1">
      <AgentHeader agent={agent} />

      <AgentTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "general" && (
        <GeneralTab
          agent={agent}
          onUpdated={setAgent}
        />
      )}

      {activeTab === "knowledge" && (
        <KnowledgeTab agent={agent} />
      )}

      {activeTab === "playground" && (
        <PlaygroundTab agent={agent} />
      )}

      {activeTab === "deploy" && (
        <DeploySettings agentId={agent.id} />
      )}

      {activeTab === "widget" && (
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Widget Builder coming soon...
        </div>
      )}

      {activeTab === "channels" && (
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Channels coming soon...
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Analytics coming soon...
        </div>
      )}

      {activeTab === "settings" && (
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Settings coming soon...
        </div>
      )}
    </div>
  );
}
