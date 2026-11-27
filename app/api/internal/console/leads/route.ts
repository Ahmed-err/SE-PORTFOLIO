import { consoleAuthFailure } from "@/lib/console-auth";
import { LEAD_FILTERS, listMessages, messagesDb, type LeadFilter } from "@/lib/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" } as const;

/** Console: list contact messages (`?status=&page=`). Signed requests only; see lib/console-auth.ts. */
export async function GET(request: Request): Promise<Response> {
  const denied = consoleAuthFailure(request, "", process.env.CONSOLE_API_SECRET);
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const status = params.get("status") || "all";
  const pageRaw = params.get("page") || "1";
  if (!(LEAD_FILTERS as readonly string[]).includes(status) || !/^[1-9][0-9]{0,5}$/.test(pageRaw)) {
    return Response.json({ error: "invalid" }, { status: 400, headers: noStore });
  }
  const db = await messagesDb();
  if (!db) return Response.json({ error: "unavailable" }, { status: 503, headers: noStore });
  return Response.json(await listMessages(db, { status: status as LeadFilter, page: Number(pageRaw) }), { headers: noStore });
}
