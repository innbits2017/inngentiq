
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

import LeadStatus from "@/components/leads/LeadStatus";
import AddNote from "@/components/leads/AddNote";
import LeadTasks from "@/components/leads/LeadTask";

export default async function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  // 1. Verify authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Resolve user's organization
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  let organizationId = profile?.organization_id;

  // Fallback to organization membership
  if (!organizationId) {
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    organizationId = membership?.organization_id;
  }

  if (!organizationId) {
    return (
      <div className="rounded-2xl bg-white p-8">
        <h2 className="text-xl font-bold text-[#20234A]">
          Workspace not found
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Your account is not associated with an organization.
        </p>
      </div>
    );
  }

  // 3. Fetch lead belonging to this organization
  const { data: lead, error: leadError } = await supabaseAdmin
    .from("leads")
    .select(`
      *,
      forms (
        id,
        name
      ),
      agents (
        id,
        name
      )
    `)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (leadError) {
    console.error("Lead details error:", leadError);
  }

  if (!lead) {
    notFound();
  }

  // 4. Fetch activities after verifying lead ownership
  const { data: activities, error: activitiesError } =
    await supabaseAdmin
      .from("lead_activities")
      .select("*")
      .eq("lead_id", lead.id)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

  if (activitiesError) {
    console.error("Lead activities error:", activitiesError);
  }

  // 5. Prepare submitted form data
  const metadata =
    lead.metadata &&
    typeof lead.metadata === "object" &&
    !Array.isArray(lead.metadata)
      ? (lead.metadata as Record<string, unknown>)
      : {};

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (Array.isArray(value)) {
      return value.map(String).join(", ");
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">

      {/* Back navigation */}
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#5149E8]"
      >
        ← Back to Leads
      </Link>

      {/* Header */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5149E8]">
            CRM / Lead Profile
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#20234A] sm:text-3xl">
            {lead.name || "Unnamed Lead"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {lead.email || "No email address provided"}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-[#F0EEFF] px-4 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-[#5149E8]" />
          <span className="text-sm font-semibold text-[#5149E8]">
            Lead ID: {lead.id.slice(0, 8)}
          </span>
        </div>
      </section>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Lead Information */}
        <section className="rounded-2xl bg-white p-5 shadow-[0_3px_16px_rgba(32,35,74,0.045)] sm:p-6">
          <h2 className="text-lg font-bold text-[#20234A]">
            Lead Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Contact details and lead source.
          </p>

          <div className="mt-6 space-y-5">
            <InfoRow label="Name" value={lead.name} />
            <InfoRow label="Email" value={lead.email} />
            <InfoRow label="Phone" value={lead.phone} />
            <InfoRow label="Company" value={lead.company} />
            <InfoRow label="Source" value={lead.source} />

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Lead Status
              </p>

              <LeadStatus
                leadId={lead.id}
                currentStatus={lead.status}
              />
            </div>

            <InfoRow label="Form" value={lead.forms?.name} />
            <InfoRow label="AI Agent" value={lead.agents?.name} />
            <InfoRow label="Created" value={formatDate(lead.created_at)} />

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Conversation
              </p>

              {lead.conversation_id ? (
                <Link
                  href={`/dashboard/conversations/${lead.conversation_id}`}
                  className="text-sm font-semibold text-[#5149E8] hover:underline"
                >
                  View Conversation →
                </Link>
              ) : (
                <p className="text-sm text-slate-500">—</p>
              )}
            </div>
          </div>
        </section>

        {/* Submitted Data */}
        <section className="rounded-2xl bg-white p-5 shadow-[0_3px_16px_rgba(32,35,74,0.045)] sm:p-6">
          <h2 className="text-lg font-bold text-[#20234A]">
            Submitted Data
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Information provided by the visitor.
          </p>

          <div className="mt-6 space-y-4">
            {Object.keys(metadata).length === 0 ? (
              <p className="text-sm text-slate-400">
                No additional submission data available.
              </p>
            ) : (
              Object.entries(metadata).map(([key, value]) => (
                <div
                  key={key}
                  className="border-b border-slate-100 pb-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {key.replace(/_/g, " ")}
                  </p>

                  <p className="mt-1 break-words text-sm font-medium text-[#20234A]">
                    {formatValue(value)}
                  </p>
                </div>
              ))
            )}
          </div>

          {lead.message && (
            <div className="mt-6 rounded-xl bg-[#F4F3FF] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#5149E8]">
                Enquiry Message
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {lead.message}
              </p>
            </div>
          )}
        </section>

        {/* Add Note */}
        <section className="rounded-2xl bg-white p-5 shadow-[0_3px_16px_rgba(32,35,74,0.045)] sm:p-6">
          <h2 className="mb-4 text-lg font-bold text-[#20234A]">
            Add Note
          </h2>

          <AddNote leadId={lead.id} />
        </section>

      </div>

      {/* Follow-up Tasks */}
      <LeadTasks leadId={lead.id} />

      {/* Activity Timeline */}
      <section className="rounded-2xl bg-white p-5 shadow-[0_3px_16px_rgba(32,35,74,0.045)] sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-[#20234A]">
              Activity Timeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track interactions and updates for this lead.
            </p>
          </div>

          <span className="w-fit rounded-full bg-[#F0EEFF] px-3 py-1.5 text-xs font-bold text-[#5149E8]">
            {activities?.length || 0} Activities
          </span>
        </div>

        <div className="mt-7">
          {!activities || activities.length === 0 ? (
            <div className="rounded-xl bg-[#F8F8FD] px-5 py-10 text-center">
              <p className="font-semibold text-[#20234A]">
                No activities yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Notes and lead updates will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="relative flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="z-10 mt-1 h-3 w-3 rounded-full bg-[#5149E8] ring-4 ring-[#F0EEFF]" />

                    {index !== activities.length - 1 && (
                      <div className="min-h-20 w-px flex-1 bg-slate-200" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pb-7">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                      <h3 className="text-sm font-bold text-[#20234A]">
                        {activity.title || activity.activity_type}
                      </h3>

                      <span className="text-xs text-slate-400">
                        {formatDate(activity.created_at)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs font-semibold text-[#5149E8]">
                      {activity.activity_type}
                    </p>

                    {activity.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

// Reusable information row
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="break-words text-sm font-medium text-[#20234A]">
        {value || "—"}
      </p>
    </div>
  );
}
