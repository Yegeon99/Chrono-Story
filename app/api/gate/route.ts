// Verification gate endpoint — NDJSON streaming of pipeline stages.
// Server-only: the Anthropic key never leaves this route.
import { judgeText } from "@/lib/gate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let text: unknown;
  try {
    ({ text } = await req.json());
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof text !== "string" || text.trim().length < 5) {
    return Response.json({ error: "text is required (min 5 chars)" }, { status: 400 });
  }
  if (text.length > 4000) {
    return Response.json({ error: "text too long (max 4000 chars)" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        send({ stage: "extract" });
        // judgeText performs extraction internally; we surface stage progress here
        send({ stage: "judge" });
        const { result, matched, factCount } = await judgeText(text as string);
        send({
          stage: "done",
          result,
          matched_entities: matched.map((e) => ({ id: e.id, name_ko: e.name_ko })),
          fact_count: factCount,
        });
      } catch (err) {
        send({
          stage: "error",
          message: err instanceof Error ? err.message : "판정 중 오류가 발생했습니다.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
