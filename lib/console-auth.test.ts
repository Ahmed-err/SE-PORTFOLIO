import { describe, expect, it } from "vitest";
import { consoleAuthFailure, signConsoleRequest, verifyConsoleRequest } from "./console-auth";

const SECRET = "s".repeat(40);
const now = new Date("2026-11-27T10:00:00Z");
const path = "/api/internal/console/leads?status=new&page=1";

describe("console auth", () => {
  it("verifies a fresh signature bound to method, path and body", () => {
    const h = signConsoleRequest(SECRET, { method: "GET", pathWithQuery: path, body: "", now });
    expect(verifyConsoleRequest(SECRET, h, { method: "GET", pathWithQuery: path, body: "", now })).toBe(true);
    expect(verifyConsoleRequest(SECRET, h, { method: "POST", pathWithQuery: path, body: "", now })).toBe(false);
    expect(verifyConsoleRequest(SECRET, h, { method: "GET", pathWithQuery: path.replace("page=1", "page=2"), body: "", now })).toBe(false);
    expect(verifyConsoleRequest("x".repeat(40), h, { method: "GET", pathWithQuery: path, body: "", now })).toBe(false);
    const late = new Date(now.getTime() + 301_000);
    expect(verifyConsoleRequest(SECRET, h, { method: "GET", pathWithQuery: path, body: "", now: late })).toBe(false);
  });

  it("matches the platform package's known vector", () => {
    // signConsoleRequest("k"*40, GET /x, "", ts 1764237600) from @sarmadax/console-auth.
    const h = signConsoleRequest("k".repeat(40), { method: "GET", pathWithQuery: "/x", body: "", now: new Date(1764237600_000) });
    expect(h).toBe("Sarmadax 1764237600.17c8990f89a25a02204ff4d8c3812f938a8b5659fb3ac28f53113d826aac30b8");
  });

  it("503s without a usable secret, 401s on a bad signature, passes a good one", () => {
    const req = (authorization: string) => new Request(`https://sarmadax.com${path}`, { headers: { authorization } });
    const good = signConsoleRequest(SECRET, { method: "GET", pathWithQuery: path, body: "" });
    expect(consoleAuthFailure(req(good), "", "short")?.status).toBe(503);
    expect(consoleAuthFailure(req("Sarmadax 1.00"), "", SECRET)?.status).toBe(401);
    expect(consoleAuthFailure(req(good), "", SECRET)).toBeNull();
  });
});
