import { consoleAuthFailure } from "@/lib/console-auth";
import { LEAD_STATUSES, messagesDb, updateMessage, type LeadStatus } from "@/lib/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" } as const;
const MAX_BODY_BYTES = 16 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const invalid = () => Response.json({ error: "invalid" }, { status: 400, headers: noStore });

/** Console: set a message's status, optionally with a note. Body `{ actor, status, note? }`. Signed requests only. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return Response.json({ error: "tooLarge" }, { status: 413, headers: noStore });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return Response.json({ error: "tooLarge" }, { status: 413, headers: noStore });
  const denied = consoleAuthFailure(request, raw, process.env.CONSOLE_API_SECRET);
  if (denied) return denied;

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return invalid();
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const actor = typeof b.actor === "string" ? b.actor.trim() : "";
  const status = b.status;
  const note = b.note === undefined ? undefined : typeof b.note === "string" ? b.note.trim() : null;
  if (!actor || actor.length > 254 || !EMAIL_RE.test(actor)) return invalid();
  if (typeof status !== "string" || !(LEAD_STATUSES as readonly string[]).includes(status)) return invalid();
  if (note === null || (note !== undefined && note.length > 2000)) return invalid();

  const { id } = await params;
  if (!id || id.length > 100) return invalid();
  const db = await messagesDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503, headers: noStore });
  const found = await updateMessage(db, id, { actor, status: status as LeadStatus, note: note || undefined });
  return found
    ? Response.json({ ok: true }, { headers: noStore })
    : Response.json({ error: "notFound" }, { status: 404, headers: noStore });
}
