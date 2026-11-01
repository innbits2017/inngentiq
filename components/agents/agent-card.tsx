
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  ArrowUpRight,
  MoreVertical,
  Power,
  Trash2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AgentCardProps {
  id: string;
  name: string;
  description: string;
  model: string;
  status: string;
}

export default function AgentCard({
  id,
  name,
  description,
  model,
  status,
}: AgentCardProps) {
  const [isActive, setIsActive] = useState(
    status?.toLowerCase() === "active"
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsActive(status?.toLowerCase() === "active");
  }, [status]);

  async function toggleStatus() {
    if (loading) return;

    setLoading(true);

    const nextStatus = isActive ? "inactive" : "active";

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
          is_active: nextStatus === "active",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update agent.");
      }

      setIsActive(nextStatus === "active");
      setMenuOpen(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to update agent."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteAgent() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This action cannot be undone.`
    );

    if (!confirmed || loading) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete agent.");
      }

      // Refresh the list after successful deletion
      window.location.reload();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete agent."
      );
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        border: "none",
        outline: "none",
        boxShadow: "0 2px 12px rgba(32,35,74,0.05)",
      }}
      className="relative rounded-2xl bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#5149E8]">
            <Bot size={21} />
          </div>

          <div className="min-w-0">
            <Link
              href={`/dashboard/agents/${id}`}
              className="font-semibold text-[#20234A] hover:text-[#5149E8]"
            >
              {name}
            </Link>

            <p className="mt-1 truncate text-sm text-slate-500">
              {description || "No description added"}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#F4F3FF] px-2.5 py-1 text-xs font-medium text-[#5149E8]">
                {model}
              </span>

              <Badge
                variant="outline"
                className={`border-0 ${
                  isActive
                    ? "bg-[#EAF8F6] text-[#16877F]"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <span
                  className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-[#20AAA6]" : "bg-slate-400"
                  }`}
                />
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Agent options"
            aria-expanded={menuOpen}
            disabled={loading}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#F4F3FF] hover:text-[#5149E8] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <MoreVertical size={18} />
            )}
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close agent options"
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
              />

              <div className="absolute right-0 top-9 z-20 w-48 rounded-xl bg-white p-1.5 shadow-[0_8px_30px_rgba(32,35,74,0.14)]">
                <button
                  type="button"
                  onClick={toggleStatus}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#20234A] hover:bg-[#F4F3FF]"
                >
                  <Power size={15} className="text-[#5149E8]" />
                  {isActive ? "Deactivate agent" : "Activate agent"}
                </button>

                <button
                  type="button"
                  onClick={deleteAgent}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Delete agent
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Link
          href={`/dashboard/agents/${id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#5149E8] hover:text-[#7565F5]"
        >
          Manage agent
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}
