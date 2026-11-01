
"use client";

import Link from "next/link";
import { MessageSquare, ArrowUpRight, Inbox } from "lucide-react";

export default function RecentConversations() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Recent Conversations
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your latest customer interactions
          </p>
        </div>

        <Link
          href="/dashboard/conversations"
          className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          View all <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 text-center">
        <div className="mb-3 rounded-2xl bg-blue-50 p-4 text-blue-600">
          <Inbox size={25} />
        </div>

        <h3 className="text-base font-semibold text-slate-800">
          No conversations yet
        </h3>

        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
          Customer conversations will appear here when someone interacts with
          your AI agents.
        </p>

        <Link
          href="/dashboard/agents"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <MessageSquare size={16} />
          View AI Agents
        </Link>
      </div>
    </div>
  );
}
