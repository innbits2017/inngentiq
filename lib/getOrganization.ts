import { getCurrentUser } from "./auth";
import { supabaseAdmin } from "./supabase/admin";

export async function getOrganization() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("User not logged in");
  }

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  return data.organization_id;
}