
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import LeadsClient from "./leads-client";

export default async function LeadsPage() {
  const supabase = await createClient();

  // Verify logged-in user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user's organization
  const { data: profile, error: profileError } =
    await supabaseAdmin
      .from("user_profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return (
      <div className="rounded-2xl bg-white p-8">
        <h2 className="text-xl font-bold text-[#20234A]">
          Workspace not found
        </h2>
        <p className="mt-2 text-slate-500">
          Your account is not associated with an organization.
        </p>
      </div>
    );
  }

  // Fetch only leads belonging to this organization
  const { data: leads, error: leadsError } =
    await supabaseAdmin
      .from("leads")
      .select(`
        id,
        name,
        email,
        phone,
        company,
        source,
        status,
        message,
        created_at
      `)
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

  if (leadsError) {
    console.error("Leads fetch error:", leadsError);

    return (
      <div className="rounded-2xl bg-white p-8">
        <h2 className="text-lg font-bold text-[#20234A]">
          Unable to load leads
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Please refresh the page and try again.
        </p>
      </div>
    );
  }

  return <LeadsClient leads={leads ?? []} />;
}
