import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verifies requests from the Sarmadax Console. Same scheme as `@sarmadax/console-auth` in the
 * sarmadax-platform repo (keep the two in step):
 *
 * `Authorization: Sarmadax <ts>.<hex hmac-sha256(secret, ts + "\n" + METHOD + "\n" + pathWithQuery + "\n" + rawBody)>`,
 * `ts` in unix seconds within ±300 s.
 */
export const CONSOLE_SECRET_MIN_LENGTH = 32;
const MAX_SKEW_SECONDS = 300;
const HEADER = /^Sarmadax ([0-9]{1,12})\.([0-9a-f]{64})$/;

type Req = { method: string; pathWithQuery: string; body: string; now?: Date };

export function consoleSecretUsable(secret: string | undefined | null): secret is string {
  return typeof secret === "string" && secret.length >= CONSOLE_SECRET_MIN_LENGTH;
}

function mac(secret: string, ts: number, req: Req): string {
  return createHmac("sha256", secret).update(`${ts}\n${req.method.toUpperCase()}\n${req.pathWithQuery}\n${req.body}`).digest("hex");
}

/** For tests (and parity with the platform package). */
export function signConsoleRequest(secret: string, req: Req): string {
  const ts = Math.floor((req.now ?? new Date()).getTime() / 1000);
  return `Sarmadax ${ts}.${mac(secret, ts, req)}`;
}

export function verifyConsoleRequest(secret: string, header: string | null | undefined, req: Req): boolean {
  if (!consoleSecretUsable(secret) || typeof header !== "string") return false;
  const m = HEADER.exec(header);
  if (!m) return false;
  const ts = Number(m[1]);
  const nowSec = Math.floor((req.now ?? new Date()).getTime() / 1000);
  if (Math.abs(nowSec - ts) > MAX_SKEW_SECONDS) return false;
  const given = Buffer.from(m[2]!, "hex");
  const expected = Buffer.from(mac(secret, ts, req), "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * The response to send when a Console request may not proceed (503 when CONSOLE_API_SECRET is
 * unset or short, 401 when the signature is missing or wrong), or null when it is authentic.
 */
export function consoleAuthFailure(request: Request, rawBody: string, secret: string | undefined, now = new Date()): Response | null {
  if (!consoleSecretUsable(secret)) return new Response("Unavailable", { status: 503 });
  const url = new URL(request.url);
  const ok = verifyConsoleRequest(secret, request.headers.get("authorization"), {
    method: request.method, pathWithQuery: url.pathname + url.search, body: rawBody, now,
  });
  return ok ? null : new Response("Unauthorized", { status: 401 });
}
