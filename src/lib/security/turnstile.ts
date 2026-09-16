import { getTurnstileSecretKey } from "@/lib/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Cloudflare Turnstile token server-side.
 *
 * FAIL-CLOSED policy (P1.3):
 *   - Secret configured → the token must be present and accepted by Cloudflare; any network
 *     or parsing failure returns false.
 *   - Secret missing → in PRODUCTION the request is rejected (identity cannot be verified).
 *     In non-production a clearly-logged dev bypass keeps local forms usable.
 */
export async function verifyTurnstile(token?: string, ip?: string): Promise<boolean> {
  const secret = getTurnstileSecretKey();

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "Turnstile verification rejected: TURNSTILE_SECRET_KEY is not configured in a production deployment."
      );
      return false;
    }
    console.warn(
      "[dev] TURNSTILE_SECRET_KEY is not set — skipping Turnstile verification for local development only."
    );
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: ip,
      }),
      cache: "no-store",
    });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return false;
  }
}
