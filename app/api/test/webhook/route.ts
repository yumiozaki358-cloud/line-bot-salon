import { NextResponse } from "next/server";
import { fetchFaqs } from "@/lib/supabase";
import { askClaude } from "@/lib/claude";

export const runtime = "nodejs";

// This endpoint is intentionally restricted to non-production environments.
// In production, set TEST_SECRET in env and pass it as x-test-secret header.
export async function POST(request: Request) {
  const testSecret = process.env.TEST_SECRET;
  const isProduction = process.env.NODE_ENV === "production";
  const hasValidSecret =
    testSecret && request.headers.get("x-test-secret") === testSecret;

  if (isProduction && !hasValidSecret)
    return NextResponse.json(
      { error: "Set TEST_SECRET env var and pass x-test-secret header" },
      { status: 403 }
    );

  const body = await request.json().catch(() => null);
  if (!body || typeof body.message !== "string" || !body.message.trim())
    return NextResponse.json({ error: "message is required" }, { status: 400 });

  const userMessage = body.message.trim();

  const faqs = await fetchFaqs();
  const { answer, confidence } = await askClaude(userMessage, faqs);

  return NextResponse.json({
    message: userMessage,
    answer,
    confidence,
    escalated: confidence <= 5,
  });
}
