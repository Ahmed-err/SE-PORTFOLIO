import { NextResponse } from "next/server";
import { insertMessage, messagesDb } from "@/lib/messages";

const MAX = { name: 120, email: 254, message: 5000 };
const MAX_BODY_BYTES = 32_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Line breaks or other control characters in the name would reach the Subject header.
const CONTROL = /[\u0000-\u001f\u007f]/;

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/**
 * Contact form. Each message is saved first (Postgres, read by the Sarmadax Console), then
 * emailed through Resend. Either one succeeding counts as delivered, so a message is only
 * refused when neither could keep it.
 */
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return bad("Payload too large", 413);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return bad("Payload too large", 413);
    body = JSON.parse(raw) ?? {};
  } catch {
    return bad("Invalid JSON");
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) return bad("All fields are required");
  if (name.length > MAX.name || CONTROL.test(name)) return bad("Invalid name");
  if (email.length > MAX.email || !EMAIL_RE.test(email)) return bad("Invalid email");
  if (message.length > MAX.message) return bad("Message is too long");

  let saved = false;
  try {
    const db = await messagesDb();
    if (db) {
      await insertMessage(db, { name, email, message });
      saved = true;
    }
  } catch (error) {
    console.error("Contact form: saving the message failed:", error);
  }

  let emailed = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      // Resend reports failures (bad key, quota) in `error` instead of throwing.
      const { error } = await resend.emails.send({
        from: "Portfolio Contact <onboarding@resend.dev>",
        to: process.env.CONTACT_EMAIL ?? "ahmedmax0909090909@gmail.com",
        replyTo: email,
        subject: `New message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      });
      if (error) console.error("Contact form: Resend rejected the send:", error.name, error.message);
      else emailed = true;
    } catch (error) {
      console.error("Contact form: Resend send failed:", error);
    }
  }

  if (saved || emailed) return NextResponse.json({ success: true });
  if (process.env.NODE_ENV !== "production") {
    console.log("Contact form submission (not stored, not emailed):", { name, email, message });
    return NextResponse.json({ success: true });
  }
  return bad("Failed to send message", 500);
}
