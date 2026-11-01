import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const { data: lead, error: leadError } = await supabaseAdmin
    .from("leads")
    .select("organization_id")
    .eq("id", id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json(
      { error: "Lead not found" },
      { status: 404 }
    );
  }

  const { error } = await supabaseAdmin
    .from("lead_activities")
    .insert({
      lead_id: id,
      organization_id: lead.organization_id,
      activity_type: "Note Added",
      title: "Note",
      description: body.note,
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}