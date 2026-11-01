
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrganization } from "@/lib/getOrganization";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = await getOrganization();

    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .select("id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) throw error;

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found or access denied." },
        { status: 404 }
      );
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin
    ).replace(/\/+$/, "");

    const embedCode = `
<script src="${appUrl}/widget/widget.bundle.js"></script>
<script>
  window.Inngentiq.init({
    agentId: ${JSON.stringify(id)}
  });
</script>
`.trim();

    return NextResponse.json({
      success: true,
      agentId: id,
      embedCode,
    });
  } catch (error) {
    console.error("Embed generation error:", error);

    return NextResponse.json(
      { error: "Unable to generate embed code." },
      { status: 500 }
    );
  }
}
