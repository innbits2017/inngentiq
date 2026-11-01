
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Plus,
  Users,
  UserCheck,
  Clock3,
  Trophy,
  Building2,
  Mail,
  Phone,
  ArrowUpRight,
  CalendarDays,
  MoreHorizontal,
  Inbox,
  X,
} from "lucide-react";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: string | null;
  message: string | null;
  created_at: string | null;
}

interface Props {
  leads: Lead[];
}

const stages = [
  {
    id: "new",
    label: "New",
    color: "#5149E8",
    background: "#F0EEFF",
  },
  {
    id: "contacted",
    label: "Contacted",
    color: "#7565F5",
    background: "#F2F0FF",
  },
  {
    id: "qualified",
    label: "Qualified",
    color: "#20AAA6",
    background: "#EAF8F6",
  },
  {
    id: "closed_won",
    label: "Closed Won",
    color: "#5149E8",
    background: "#F0EEFF",
  },
  {
    id: "lost",
    label: "Lost",
    color: "#20234A",
    background: "#F1F1F7",
  },
];

function normalizeStatus(status: string | null) {
  const value = (status || "new")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (["contacted", "in_progress", "follow_up"].includes(value)) {
    return "contacted";
  }

  if (["qualified", "proposal", "converted"].includes(value)) {
    return "qualified";
  }

  if (["closed_won", "won", "success"].includes(value)) {
    return "closed_won";
  }

  if (["lost", "closed_lost", "rejected"].includes(value)) {
    return "lost";
  }

  return "new";
}

function formatDate(date: string | null) {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link
      href={`/dashboard/leads/${lead.id}`}
      className="group block rounded-2xl bg-white p-4 shadow-[0_3px_14px_rgba(32,35,74,0.045)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(32,35,74,0.10)]"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#5149E8]">
          <Building2 size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-[#20234A]">
            {lead.company || lead.name || "Unnamed Lead"}
          </h3>

          <p className="mt-1 truncate text-xs text-slate-500">
            {lead.company
              ? lead.name || "Contact not specified"
              : lead.email || "No email"}
          </p>
        </div>

        <ArrowUpRight
          size={16}
          className="shrink-0 text-slate-300 transition group-hover:text-[#5149E8]"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-[#F4DFA6]/40 px-3 py-1 text-xs font-semibold text-[#80621D]">
          {lead.source || "Direct"}
        </span>

        <span className="text-[11px] text-slate-400">
          {formatDate(lead.created_at)}
        </span>
      </div>
    </Link>
  );
}

export default function LeadsClient({ leads }: Props) {
  const [view, setView] = useState<"table" | "kanban">("kanban");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !query ||
        [
          lead.name,
          lead.email,
          lead.phone,
          lead.company,
          lead.source,
        ].some((value) => value?.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" ||
        normalizeStatus(lead.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const stageCounts = stages.map((stage) => ({
    ...stage,
    count: filteredLeads.filter(
      (lead) => normalizeStatus(lead.status) === stage.id
    ).length,
  }));

  const qualifiedCount = leads.filter(
    (lead) => normalizeStatus(lead.status) === "qualified"
  ).length;

  const closedCount = leads.filter(
    (lead) => normalizeStatus(lead.status) === "closed_won"
  ).length;

  const newCount = leads.filter(
    (lead) => normalizeStatus(lead.status) === "new"
  ).length;

  const metrics = [
    {
      label: "Total Leads",
      value: leads.length,
      icon: Users,
      color: "#5149E8",
      background: "#F0EEFF",
    },
    {
      label: "New Leads",
      value: newCount,
      icon: Clock3,
      color: "#7565F5",
      background: "#F2F0FF",
    },
    {
      label: "Qualified",
      value: qualifiedCount,
      icon: UserCheck,
      color: "#20AAA6",
      background: "#EAF8F6",
    },
    {
      label: "Closed Won",
      value: closedCount,
      icon: Trophy,
      color: "#80621D",
      background: "#FCF5DF",
    },
  ];

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-6 sm:space-y-8">

      {/* Page heading */}
      <section className="flex min-w-0 flex-col justify-between gap-4 sm:gap-5 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F0EEFF] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#5149E8]">
            <Users size={14} />
            Pipeline Management
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#20234A] sm:text-3xl lg:text-4xl">
            Leads & CRM
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage relationships and move opportunities forward.
          </p>
        </div>

        <Link
          href="/dashboard/forms"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5149E8] to-[#7565F5] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#5149E8]/20 transition hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
        >
          <Plus size={18} />
          Capture New Leads
        </Link>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="min-w-0 rounded-2xl bg-white p-4 shadow-[0_3px_16px_rgba(32,35,74,0.045)] transition hover:-translate-y-1 hover:shadow-lg sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-500 sm:text-sm">
                    {metric.label}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#20234A] sm:mt-3 sm:text-3xl">
                    {metric.value}
                  </h2>
                </div>

                <div
                  className="shrink-0 rounded-xl p-2.5 sm:rounded-2xl sm:p-4"
                  style={{
                    backgroundColor: metric.background,
                    color: metric.color,
                  }}
                >
                  <Icon size={20} className="sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Pipeline toolbar */}
      <section className="min-w-0 space-y-4">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h2 className="text-lg font-bold text-[#20234A] sm:text-xl">
              Your Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredLeads.length} leads in your current view
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">

            {/* View switch */}
            <div className="col-span-2 flex rounded-xl bg-white p-1 shadow-sm sm:col-span-1">
              <button
                onClick={() => setView("table")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition sm:flex-none sm:px-4 ${
                  view === "table"
                    ? "bg-[#F0EEFF] text-[#5149E8]"
                    : "text-slate-500 hover:text-[#20234A]"
                }`}
              >
                <List size={17} />
                Table
              </button>

              <button
                onClick={() => setView("kanban")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition sm:flex-none sm:px-4 ${
                  view === "kanban"
                    ? "bg-[#F0EEFF] text-[#5149E8]"
                    : "text-slate-500 hover:text-[#20234A]"
                }`}
              >
                <LayoutGrid size={17} />
                Kanban
              </button>
            </div>

            {/* Filter */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-[#F0EEFF] sm:px-4"
              >
                <SlidersHorizontal size={17} />
                Filters
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-2xl bg-white p-3 shadow-xl">
                  <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Lead status
                  </p>

                  {[
                    { value: "all", label: "All leads" },
                    ...stages.map((stage) => ({
                      value: stage.id,
                      label: stage.label,
                    })),
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setShowFilters(false);
                      }}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        statusFilter === option.value
                          ? "bg-[#F0EEFF] font-semibold text-[#5149E8]"
                          : "text-slate-600 hover:bg-[#F7F6FF]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search */}
            <div className="col-span-2 flex min-w-0 items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm sm:col-span-1 sm:w-64">
              <Search size={17} className="shrink-0 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads..."
                className="min-w-0 w-full bg-transparent text-sm text-[#20234A] outline-none placeholder:text-slate-400"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} className="text-slate-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active filters */}
        {(statusFilter !== "all" || search) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">
              Active filters:
            </span>

            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="rounded-full bg-[#F0EEFF] px-3 py-1.5 text-xs font-semibold text-[#5149E8]"
              >
                {stages.find((stage) => stage.id === statusFilter)?.label} ×
              </button>
            )}

            {search && (
              <button
                onClick={() => setSearch("")}
                className="max-w-full truncate rounded-full bg-[#F0EEFF] px-3 py-1.5 text-xs font-semibold text-[#5149E8]"
              >
                Search: {search} ×
              </button>
            )}
          </div>
        )}
      </section>

      {/* Kanban view */}
      {view === "kanban" && (
        <section className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-4">
          <div className="flex w-max min-w-full items-start gap-3 sm:gap-4">
            {stageCounts.map((stage) => {
              const stageLeads = filteredLeads.filter(
                (lead) => normalizeStatus(lead.status) === stage.id
              );

              return (
                <div
                  key={stage.id}
                  className="w-[260px] shrink-0 rounded-2xl p-3 sm:w-[285px]"
                  style={{ backgroundColor: stage.background }}
                >
                  {/* Column heading */}
                  <div
                    className="mb-3 flex items-center justify-between rounded-xl px-3 py-3 text-white sm:px-4"
                    style={{ backgroundColor: stage.color }}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">
                        {stage.label}
                      </h3>

                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                        {stage.count}
                      </span>
                    </div>

                    <MoreHorizontal size={19} />
                  </div>

                  {/* Lead cards */}
                  <div className="space-y-3">
                    {stageLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))}

                    {stageLeads.length === 0 && (
                      <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/80 px-3 text-center">
                        <Inbox size={22} className="text-slate-300" />
                        <p className="mt-2 text-xs text-slate-400">
                          No leads in this stage
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/dashboard/forms"
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition hover:bg-white/70"
                    style={{ color: stage.color }}
                  >
                    <Plus size={16} />
                    Capture Lead
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Table view */}
      {view === "table" && (
        <section className="w-full min-w-0 overflow-hidden rounded-2xl bg-white p-2 shadow-[0_3px_16px_rgba(32,35,74,0.045)] sm:p-5">
          {filteredLeads.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
              <div className="rounded-2xl bg-[#F0EEFF] p-4 text-[#5149E8]">
                <Inbox size={26} />
              </div>

              <h3 className="mt-4 text-base font-bold text-[#20234A]">
                No leads found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try another search or change your filters.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[750px] border-separate border-spacing-y-2 text-left">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-3 sm:px-4">Contact</th>
                    <th className="px-3 py-3 sm:px-4">Company</th>
                    <th className="px-3 py-3 sm:px-4">Source</th>
                    <th className="px-3 py-3 sm:px-4">Status</th>
                    <th className="px-3 py-3 sm:px-4">Created</th>
                    <th className="px-3 py-3 text-right sm:px-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeads.map((lead) => {
                    const stage =
                      stages.find(
                        (item) =>
                          item.id === normalizeStatus(lead.status)
                      ) || stages[0];

                    return (
                      <tr
                        key={lead.id}
                        className="group bg-[#F8F8FD] transition hover:bg-[#F0EEFF]/70"
                      >
                        <td className="rounded-l-xl px-3 py-4 sm:px-4">
                          <div className="font-semibold text-[#20234A]">
                            {lead.name || "Unnamed"}
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={12} />
                            {lead.email || "No email"}
                          </div>

                          {lead.phone && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone size={12} />
                              {lead.phone}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-600 sm:px-4">
                          {lead.company || "—"}
                        </td>

                        <td className="px-3 py-4 sm:px-4">
                          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                            {lead.source || "Direct"}
                          </span>
                        </td>

                        <td className="px-3 py-4 sm:px-4">
                          <span
                            className="inline-flex rounded-full px-3 py-1.5 text-xs font-bold"
                            style={{
                              backgroundColor: stage.background,
                              color: stage.color,
                            }}
                          >
                            {stage.label}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-500 sm:px-4">
                          <div className="flex items-center gap-2">
                            <CalendarDays size={14} />
                            {formatDate(lead.created_at)}
                          </div>
                        </td>

                        <td className="rounded-r-xl px-3 py-4 text-right sm:px-4">
                          <Link
                            href={`/dashboard/leads/${lead.id}`}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-[#5149E8] transition hover:bg-white"
                          >
                            View
                            <ArrowUpRight size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Kanban empty state */}
      {view === "kanban" && filteredLeads.length === 0 && (
        <div className="rounded-2xl bg-white px-5 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EEFF] text-[#5149E8]">
            <Users size={25} />
          </div>

          <h3 className="mt-4 text-lg font-bold text-[#20234A]">
            No leads found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Your leads will appear here when customers submit your forms.
          </p>

          <Link
            href="/dashboard/forms"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#5149E8] px-5 py-3 text-sm font-bold text-white hover:bg-[#433BD0]"
          >
            <Plus size={17} />
            Explore Forms
          </Link>
        </div>
      )}

      {/* Footer tip */}
      <div className="flex items-start gap-3 rounded-2xl bg-[#F0EEFF] p-4 sm:p-5">
        <div className="shrink-0 rounded-xl bg-white p-2.5 text-[#5149E8]">
          <SlidersHorizontal size={19} />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#20234A]">
            Keep your pipeline organized
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            Review new enquiries, follow up with prospects and keep your lead
            information up to date.
          </p>
        </div>
      </div>
    </div>
  );
}
