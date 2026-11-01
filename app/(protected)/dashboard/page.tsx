
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bot,
  MessageSquare,
  Users,
  BookOpen,
  Plus,
  Globe,
  Image,
  Workflow,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

import StatCard from "@/components/dashboard/stat-card";
import UsageChart from "@/components/dashboard/usage-chart";
import SubscriptionCard from "@/components/dashboard/subscription-card";
import RecentConversations from "@/components/dashboard/recent-conversations";
import LatestLeads from "@/components/dashboard/latest-leads";
import LogoutButton from "@/components/logout-button";

const quickActions = [
  {
    title: "Create AI Agent",
    description: "Build a new AI assistant",
    icon: Bot,
    href: "/dashboard/agents",
    color: "bg-[#F0EEFF] text-[#5149E8]",
  },
  {
    title: "Connect Website",
    description: "Add your business website",
    icon: Globe,
    href: "/dashboard/website",
    color: "bg-[#EAF8F6] text-[#20AAA6]",
  },
  {
    title: "Generate Content",
    description: "Create AI marketing content",
    icon: Image,
    href: "/dashboard/content-studio",
    color: "bg-[#F0EEFF] text-[#7565F5]",
  },
  {
    title: "Create Automation",
    description: "Automate business workflows",
    icon: Workflow,
    href: "/dashboard/automations",
    color: "bg-[#FDF6E7] text-[#A78337]",
  },
];

export default async function DashboardPage() {
  // 1. Authenticate user
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Find user's active organization
  const { data: membership, error: membershipError } =
    await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

  if (membershipError) {
    console.error("Membership lookup error:", membershipError);
  }

  let organizationId: string | null =
    membership?.organization_id ?? null;

  // Fallback to user_profiles
  if (!organizationId) {
    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from("user_profiles")
        .select("organization_id, role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
    }

    organizationId = profile?.organization_id ?? null;
  }

  if (!organizationId) {
    return (
      <div className="rounded-xl border border-[#EAE8FA] bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-[#20234A]">
          Workspace not found
        </h2>
        <p className="mt-2 text-sm text-[#9293B2]">
          We couldn't find a workspace associated with your account.
          Please contact support.
        </p>
      </div>
    );
  }

  // 3. Fetch workspace-specific dashboard data
  const [
    agentsResult,
    leadsResult,
    knowledgeBasesResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("agents")
      .select("id", { count: "exact" })
      .eq("organization_id", organizationId),

    supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),

    supabaseAdmin
      .from("knowledge_bases")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
  ]);

  if (agentsResult.error) {
    console.error("Agents query error:", agentsResult.error);
  }

  if (leadsResult.error) {
    console.error("Leads query error:", leadsResult.error);
  }

  if (knowledgeBasesResult.error) {
    console.error("Knowledge bases query error:", knowledgeBasesResult.error);
  }

  // 4. Count conversations for this organization's agents
  const agentIds = (agentsResult.data ?? []).map(
    (agent) => agent.id
  );

  let conversationCount = 0;

  if (agentIds.length > 0) {
    const { count, error } = await supabaseAdmin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .in("agent_id", agentIds);

    if (error) {
      console.error("Conversations query error:", error);
    } else {
      conversationCount = count ?? 0;
    }
  }

  const agentCount = agentsResult.count ?? 0;
  const leadCount = leadsResult.count ?? 0;
  const knowledgeBaseCount = knowledgeBasesResult.count ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">

      {/* Welcome */}
      <section className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#E8E5FF] bg-[#F0EEFF] px-3 py-1 text-[11px] font-semibold text-[#5149E8]">
            <Sparkles size={13} />
            AI Business Command Center
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#20234A] sm:text-3xl">
            Welcome back <span aria-hidden="true">👋</span>
          </h1>

          <p className="mt-1.5 text-sm text-[#777A99]">
            Manage your AI agents, customers and business growth from one place.
          </p>
        </div>

        <Link
          href="/dashboard/agents"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5149E8] to-[#7565F5] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#5149E8]/15 transition hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
        >
          <Plus size={17} />
          Create AI Agent
        </Link>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="AI Agents"
          value={agentCount}
          icon={<Bot size={21} />}
          description="Configured agents"
          accent="blue"
        />

        <StatCard
          title="Conversations"
          value={conversationCount}
          icon={<MessageSquare size={21} />}
          description="Customer interactions"
          accent="green"
        />

        <StatCard
          title="Total Leads"
          value={leadCount}
          icon={<Users size={21} />}
          description="Captured enquiries"
          accent="orange"
        />

        <StatCard
          title="Knowledge Bases"
          value={knowledgeBaseCount}
          icon={<BookOpen size={21} />}
          description="Available knowledge bases"
          accent="violet"
        />
      </section>

      {/* Analytics and Subscription */}
      <section className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <UsageChart />
        </div>

        <div className="min-w-0">
          <SubscriptionCard />
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-[#20234A]">
            Quick Actions
          </h2>
          <p className="mt-0.5 text-xs text-[#9293B2]">
            Get more done with Inngentiq
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-[#EAE8FA] bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D8D3FF] hover:shadow-md"
              >
                <div className={`shrink-0 rounded-lg p-2.5 ${action.color}`}>
                  <Icon size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-bold text-[#20234A]">
                    {action.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#9293B2]">
                    {action.description}
                  </p>
                </div>

                <ArrowUpRight
                  size={15}
                  className="shrink-0 text-[#C0BED5] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#5149E8]"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <RecentConversations />
        <LatestLeads />
      </section>

      {/* Footer */}
      <div className="flex justify-end border-t border-[#EAE8FA] pt-3">
        <LogoutButton />
      </div>
    </div>
  );
}
