import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { insertMessage, listMessages, PAGE_SIZE, updateMessage, type Query } from "./messages";

let q: Query;
beforeEach(async () => {
  const pg = new PGlite();
  await pg.exec(readFileSync(new URL("../db/0001_messages.sql", import.meta.url), "utf8"));
  q = async (text, params) => (await pg.query<Record<string, unknown>>(text, params)).rows;
});

const msg = { name: "Sara", email: "sara@example.com", message: "Hello" };

describe("messages", () => {
  it("stores and lists newest first, in the Console's lead shape", async () => {
    const a = await insertMessage(q, msg, new Date("2026-11-27T10:00:00Z"));
    const b = await insertMessage(q, { ...msg, name: "Omar" }, new Date("2026-11-27T11:00:00Z"));
    const r = await listMessages(q, { status: "all", page: 1 });
    expect(r.rows.map((l) => l.id)).toEqual([b, a]);
    expect(r.rows[1]).toEqual({
      id: a, createdAt: "2026-11-27T10:00:00.000Z", kind: "inquiry", name: "Sara", email: "sara@example.com", phone: null,
      projectType: null, budget: null, message: "Hello", status: "new", note: null, updatedAt: null, updatedBy: null,
    });
    expect(r.counts).toEqual({ new: 2, contacted: 0, won: 0, lost: 0, spam: 0 });
  });

  it("updates status and appends notes; unknown ids report false", async () => {
    const id = await insertMessage(q, msg);
    const now = new Date("2026-11-28T09:00:00Z");
    expect(await updateMessage(q, id, { actor: "a@sarmadax.com", status: "contacted", note: "replied" }, now)).toBe(true);
    expect(await updateMessage(q, id, { actor: "b@sarmadax.com", status: "won" }, now)).toBe(true);
    expect(await updateMessage(q, id, { actor: "b@sarmadax.com", status: "won", note: "hired" }, now)).toBe(true);
    const [l] = (await listMessages(q, { status: "won", page: 1 })).rows;
    expect(l!.note).toBe("[2026-11-28 a@sarmadax.com] replied\n[2026-11-28 b@sarmadax.com] hired");
    expect(l!.updatedBy).toBe("b@sarmadax.com");
    expect(await updateMessage(q, "nope", { actor: "a@sarmadax.com", status: "spam" })).toBe(false);
  });

  it("pages by 25", async () => {
    for (let i = 0; i < PAGE_SIZE + 1; i++) await insertMessage(q, msg, new Date(Date.UTC(2026, 10, 1, 0, i)));
    const p2 = await listMessages(q, { status: "new", page: 2 });
    expect(p2.rows).toHaveLength(1);
    expect(p2.total).toBe(PAGE_SIZE + 1);
  });
});
