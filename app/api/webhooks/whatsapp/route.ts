
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

// Meta webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token &&
    verifyToken &&
    token === verifyToken &&
    challenge
  ) {
    return new Response(challenge, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json(
    { success: false, error: "Webhook verification failed" },
    { status: 403 }
  );
}

// Receive WhatsApp webhook events
export async function POST(request: NextRequest) {
  try {
    const appSecret = process.env.META_APP_SECRET;

    if (!appSecret) {
      console.error("META_APP_SECRET is not configured");

      return NextResponse.json(
        { success: false, error: "Webhook configuration error" },
        { status: 500 }
      );
    }

    const signature = request.headers.get("x-hub-signature-256");

    if (!signature || !signature.startsWith("sha256=")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid signature" },
        { status: 401 }
      );
    }

    const rawBody = await request.text();

    const expectedSignature =
      "sha256=" +
      createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json(
        { success: false, error: "Unsupported webhook object" },
        { status: 400 }
      );
    }

    // Log incoming WhatsApp events during initial integration testing.
    console.log(
      "WhatsApp webhook received:",
      JSON.stringify(body)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
