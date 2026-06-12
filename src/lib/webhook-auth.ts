// Server-only HMAC verification helpers for public webhook routes.
// Caller must POST with headers:
//   x-webhook-timestamp: <unix-seconds>
//   x-webhook-signature: hex(hmac-sha256(secret, `${timestamp}.${rawBody}`))
import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_SKEW_SECONDS = 300; // 5 minutes

export type VerifyResult =
  | { ok: true }
  | { ok: false; status: number; reason: string };

export async function verifyWebhookRequest(request: Request): Promise<{ result: VerifyResult; rawBody: string }> {
  const rawBody = await request.text();
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook-auth] WEBHOOK_SECRET not configured");
    return { result: { ok: false, status: 500, reason: "server_misconfigured" }, rawBody };
  }
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";
  if (!signature || !timestamp) {
    return { result: { ok: false, status: 401, reason: "missing_signature" }, rawBody };
  }
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > MAX_SKEW_SECONDS) {
    return { result: { ok: false, status: 401, reason: "expired_or_invalid_timestamp" }, rawBody };
  }
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { result: { ok: false, status: 401, reason: "invalid_signature" }, rawBody };
  }
  return { result: { ok: true }, rawBody };
}

export function rejectionResponse(reason: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error: reason }), {
    status,
    headers: { "content-type": "application/json" },
  });
}
