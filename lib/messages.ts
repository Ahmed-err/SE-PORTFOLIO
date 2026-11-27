/**
 * Contact-form messages in Postgres (Neon, DATABASE_URL; schema in db/0001_messages.sql).
 * The contact route saves each one before emailing; the Sarmadax Console lists them and sets
 * their status through the signed /api/internal/console/leads* routes, in the same shape as
 * sarmadax.com's leads (see apps/console/src/lib/lead-types.ts in sarmadax-platform).
 */
export const LEAD_STATUSES = ["new", "contacted", "won", "lost", "spam"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const LEAD_FILTERS = ["all", ...LEAD_STATUSES] as const;
export type LeadFilter = (typeof LEAD_FILTERS)[number];
export const PAGE_SIZE = 25;

/** `query(text, params)` returning rows: Neon's `sql.query`, or PGlite in tests. */
export type Query = (text: string, params: unknown[]) => Promise<Record<string, unknown>[]>;

export type Lead = {
  id: string; createdAt: string; kind: "inquiry"; name: string; email: string | null; phone: null;
  projectType: null; budget: null; message: string; status: LeadStatus; note: string | null;
  updatedAt: string | null; updatedBy: string | null;
};

const iso = (v: unknown) => (v == null ? null : new Date(v as string).toISOString());
const toLead = (r: Record<string, unknown>): Lead => ({
  id: r.id as string, createdAt: iso(r.created_at)!, kind: "inquiry", name: r.name as string,
  email: (r.email as string) || null, phone: null, projectType: null, budget: null, message: r.message as string,
  status: r.status as LeadStatus, note: (r.note as string) ?? null, updatedAt: iso(r.updated_at),
  updatedBy: (r.updated_by as string) ?? null,
});

export async function insertMessage(
  q: Query, m: { name: string; email: string; message: string }, now = new Date(), id: string = crypto.randomUUID(),
): Promise<string> {
  await q("INSERT INTO messages (id, created_at, name, email, message) VALUES ($1, $2, $3, $4, $5)", [
    id, now.toISOString(), m.name, m.email, m.message,
  ]);
  return id;
}

export async function listMessages(q: Query, { status, page }: { status: LeadFilter; page: number }) {
  const rows = status === "all"
    ? await q("SELECT * FROM messages ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2", [PAGE_SIZE, (page - 1) * PAGE_SIZE])
    : await q("SELECT * FROM messages WHERE status = $1 ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3", [
      status, PAGE_SIZE, (page - 1) * PAGE_SIZE,
    ]);
  const counted = await q("SELECT status, count(*)::int AS n FROM messages GROUP BY status", []);
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const c of counted) if ((c.status as string) in counts) counts[c.status as LeadStatus] = Number(c.n);
  const total = status === "all" ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[status];
  return { rows: rows.map(toLead), total, page, counts };
}

/** Sets the status; a note is appended as `[date actor] text`. False when the id is unknown. */
export async function updateMessage(
  q: Query, id: string, u: { actor: string; status: LeadStatus; note?: string }, now = new Date(),
): Promise<boolean> {
  const line = u.note ? `[${now.toISOString().slice(0, 10)} ${u.actor}] ${u.note}` : null;
  const rows = await q(
    `UPDATE messages SET status = $1,
       note = CASE WHEN $2::text IS NULL THEN note WHEN note IS NULL THEN $2::text ELSE note || E'\\n' || $2::text END,
       updated_at = $3, updated_by = $4
     WHERE id = $5 RETURNING id`,
    [u.status, line, now.toISOString(), u.actor, id],
  );
  return rows.length > 0;
}

/** Neon over HTTP when DATABASE_URL is set; otherwise undefined (messages are then only emailed). */
export async function messagesDb(): Promise<Query | undefined> {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  return (text, params) => sql.query(text, params) as Promise<Record<string, unknown>[]>;
}
