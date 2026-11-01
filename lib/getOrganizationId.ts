
import { supabase } from "@/lib/supabase/browser";

export async function getOrganizationId() {
  // Get logged-in user
  const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Fetch profile
  const { data, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data.organization_id;
}
