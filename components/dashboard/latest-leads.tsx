
"use client";

import Link from "next/link";
import { ArrowUpRight, Users, UserPlus } from "lucide-react";

export default function LatestLeads() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Latest Leads
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            New business opportunities
          </p>
        </div>

        <Link
          href="/dashboard/leads"
          className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          View all <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 text-center">
        <div className="mb-3 rounded-2xl bg-violet-50 p-4 text-violet-600">
          <Users size={25} />
        </div>

        <h3 className="text-base font-semibold text-slate-800">
          No new leads yet
        </h3>

        <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
          Leads captured through your forms and AI conversations will appear
          here.
        </p>

        <Link
          href="/dashboard/leads"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <UserPlus size={16} />
          Manage Leads
        </Link>
      </div>
    </div>
  );
}
