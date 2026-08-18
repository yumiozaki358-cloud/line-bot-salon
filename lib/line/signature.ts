import { createHmac, timingSafeEqual } from "crypto";

export function verifyLineSignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  const digest = createHmac("sha256", channelSecret)
    .update(body)
    .digest("base64");

  if (digest.length !== signature.length) return false;

  return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}
