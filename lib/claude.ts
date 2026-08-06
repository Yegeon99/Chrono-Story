// Server-only Claude API client (DIRECTIVE §6).
// Never import from client components. Used by server routes and scripts.
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const MODEL = "claude-sonnet-4-6";

let _client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (server-side only)."
    );
  }
  if (!_client) _client = new Anthropic();
  return _client;
}

// Shared judgment contract (DIRECTIVE §6):
// cite evidence fact IDs; no evidence -> no violation; JSON only; lower severity when unsure.
export const JUDGE_CONTRACT = `판정 규칙:
1. 모든 판정에는 근거 팩트 ID를 반드시 인용한다.
2. 근거 팩트를 인용할 수 없으면 위반을 보고하지 않는다.
3. 출력은 지시된 JSON 형식만 사용한다. JSON 외의 텍스트, 마크다운 코드펜스를 출력하지 않는다.
4. 판단이 불확실하면 severity를 한 단계 낮춘다.`;

function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function stripFences(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1] : t;
}

/**
 * Ask Claude for a JSON answer validated by a zod schema.
 * On parse failure, retries once with a format-correction instruction.
 * Throws after the second failure; callers record it as a parse-error, never swallow.
 */
export async function askJson<T>(opts: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
}): Promise<T> {
  const client = getClient();
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: opts.user }];

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 2000,
      temperature: 0.2,
      system: opts.system,
      messages,
    });
    const raw = extractText(response);
    try {
      const parsed = opts.schema.safeParse(JSON.parse(stripFences(raw)));
      if (parsed.success) return parsed.data;
      throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
    } catch (err) {
      if (attempt === 1) {
        throw new Error(
          `LLM JSON parse failed after retry: ${err instanceof Error ? err.message : err}`
        );
      }
      messages.push(
        { role: "assistant", content: raw },
        {
          role: "user",
          content:
            "출력이 요구된 JSON 형식이 아니다. 설명·코드펜스 없이 유효한 JSON만 다시 출력하라.",
        }
      );
    }
  }
  throw new Error("unreachable");
}
