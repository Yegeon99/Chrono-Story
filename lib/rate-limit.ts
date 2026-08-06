// Sliding-window per-IP rate limiter for the paid LLM route (/api/gate).
//
// LIMITATION (Vercel serverless): this Map lives in one lambda instance's
// memory. Vercel runs several concurrent instances and recycles idle ones, so
// the counter is per-instance and resets on every cold start; the effective
// ceiling is `limit` per instance per window, not a global quota. That is
// accepted on purpose: the goal is to blunt accidental or casual spamming of a
// metered LLM endpoint on a public demo, not to enforce a billing-grade quota.
// A truly global limit needs durable shared state (Vercel KV / Upstash Redis),
// which this project avoids to stay dependency-free and deployable as-is.
// The gate's precomputed demo scenarios exist so the 429 path stays useful:
// a throttled visitor still gets a full verdict, just not a live one.

export const GATE_RATE_LIMIT = { limit: 3, windowMs: 60_000 };

export const RATE_LIMITED_MESSAGE =
  "실시간 판정은 분당 3회까지 실행할 수 있습니다. 데모 시나리오의 사전 계산 결과를 이용해 주세요.";

const hits = new Map<string, number[]>();

// Bound the map on a busy instance: stale buckets are dropped opportunistically.
function prune(now: number, windowMs: number) {
  if (hits.size < 512) return;
  for (const [key, stamps] of hits) {
    if (stamps.every((t) => now - t >= windowMs)) hits.delete(key);
  }
}

export type RateLimitVerdict =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(
  key: string,
  { limit, windowMs } = GATE_RATE_LIMIT,
  now: number = Date.now()
): RateLimitVerdict {
  prune(now, windowMs);
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    const oldest = recent[0]!;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
    };
  }

  recent.push(now);
  hits.set(key, recent);
  return { allowed: true, remaining: limit - recent.length };
}

// Vercel always sets x-forwarded-for; local dev has no proxy header, so every
// local caller shares one bucket (fine, it is a single-developer machine).
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "local";
}

// Test-only escape hatch; the route never calls it.
export function __resetRateLimit() {
  hits.clear();
}
