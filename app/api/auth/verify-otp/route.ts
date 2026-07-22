import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/api/session";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8083";

type Envelope = {
  success?: boolean;
  data?: { token?: string; accessToken?: string; user?: unknown };
  message?: string;
};

/**
 * The only step that needs its own route rather than the generic
 * `/api/backend` proxy: it must read the JWT out of the response and seal it
 * into an httpOnly cookie instead of handing it back to client JS.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetch(`${API_ORIGIN}/workflow/execute/auth.verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const json = (await upstream.json().catch(() => ({}))) as Envelope;

  if (!upstream.ok || json.success === false) {
    return NextResponse.json(json, { status: upstream.status || 400 });
  }

  const token = json.data?.token ?? json.data?.accessToken;
  let user = json.data?.user;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Verification response missing token." },
      { status: 502 },
    );
  }

  if (!user) {
    const meRes = await fetch(`${API_ORIGIN}/workflow/execute/auth.me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meJson = (await meRes.json().catch(() => ({}))) as Envelope;
    user = meJson.data;
  }

  const res = NextResponse.json({ success: true, data: { user } });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
