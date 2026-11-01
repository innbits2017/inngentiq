import { supabaseAdmin } from "./supabase/admin";

export async function getAgents(
  organizationId: string
) {
  const { data, error } = await supabaseAdmin
    .from("agents")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data;
}