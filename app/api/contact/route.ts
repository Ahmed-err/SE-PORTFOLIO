import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { name, email, message } = await request.json();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  // If RESEND_API_KEY is configured, send via Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "Portfolio Contact <onboarding@resend.dev>",
        to: "hello@alexcarter.dev",
        subject: `New message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      });

      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  }

  // Fallback: log to console in development
  console.log("Contact form submission:", { name, email, message });
  return NextResponse.json({ success: true });
}
