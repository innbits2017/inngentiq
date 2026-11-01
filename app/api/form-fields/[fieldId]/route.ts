import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const { fieldId } = await params;
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("form_fields")
    .update({
      label: body.label,
      field_type: body.field_type,
      placeholder: body.placeholder,
      required: body.required,
      options: body.options,
    })
    .eq("id", fieldId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> }
) {
  const { fieldId } = await params;

  const { error } = await supabaseAdmin
    .from("form_fields")
    .delete()
    .eq("id", fieldId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}