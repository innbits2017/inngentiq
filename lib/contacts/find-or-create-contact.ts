
import { supabaseAdmin } from "@/lib/supabase/admin";

interface FindOrCreateContactParams {
  organizationId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string;
  metadata?: Record<string, unknown>;
}

interface Contact {
  id: string;
  organization_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface FindOrCreateContactResult {
  contact: Contact;
  created: boolean;
}

// Normalize email.
function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

// Remove formatting from phone numbers.
// This does not assume or add a country code.
function normalizePhone(phone?: string | null) {
  if (!phone) return null;

  const cleaned = phone.trim().replace(/[^\d+]/g, "");

  return cleaned || null;
}

export async function findOrCreateContact({
  organizationId,
  name,
  email,
  phone,
  company,
  source = "manual",
  metadata = {},
}: FindOrCreateContactParams): Promise<FindOrCreateContactResult> {
  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  const cleanName = name?.trim() || null;
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);
  const cleanCompany = company?.trim() || null;

  if (!cleanEmail && !cleanPhone) {
    throw new Error(
      "Email or phone number is required to identify a contact."
    );
  }

  // Search by email.
  let emailMatches: Contact[] = [];

  if (cleanEmail) {
    const { data, error } = await supabaseAdmin
      .from("contacts")
      .select("*")
      .eq("organization_id", organizationId)
      .ilike("email", cleanEmail)
      .limit(2);

    if (error) throw error;

    emailMatches = (data || []) as Contact[];
  }

  // Search by phone.
  let phoneMatches: Contact[] = [];

  if (cleanPhone) {
    const { data, error } = await supabaseAdmin
      .from("contacts")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("phone", cleanPhone)
      .limit(2);

    if (error) throw error;

    phoneMatches = (data || []) as Contact[];
  }

  // Never select an arbitrary record if duplicates already exist.
  if (emailMatches.length > 1 || phoneMatches.length > 1) {
    throw new Error(
      "Multiple matching contacts found. Manual review is required."
    );
  }

  const emailContact = emailMatches[0] || null;
  const phoneContact = phoneMatches[0] || null;

  // Email and phone point to different records.
  // Do not automatically merge them.
  if (
    emailContact &&
    phoneContact &&
    emailContact.id !== phoneContact.id
  ) {
    throw new Error(
      "Email and phone belong to different contacts. Manual review is required."
    );
  }

  const existingContact = emailContact || phoneContact;

  // Update an existing contact without overwriting
  // previously stored information with empty values.
  if (existingContact) {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (!existingContact.name && cleanName) {
      updates.name = cleanName;
    }

    if (!existingContact.email && cleanEmail) {
      updates.email = cleanEmail;
    }

    if (!existingContact.phone && cleanPhone) {
      updates.phone = cleanPhone;
    }

    if (!existingContact.company && cleanCompany) {
      updates.company = cleanCompany;
    }

    const { data, error } = await supabaseAdmin
      .from("contacts")
      .update(updates)
      .eq("id", existingContact.id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) throw error;

    return {
      contact: data as Contact,
      created: false,
    };
  }

  // Create a new contact.
  const { data, error } = await supabaseAdmin
    .from("contacts")
    .insert({
      organization_id: organizationId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      company: cleanCompany,
      source,
      metadata,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    contact: data as Contact,
    created: true,
  };
}
