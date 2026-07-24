import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/api/session";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8083";

type VerifyPayload = {
  token?: string;
  accessToken?: string;
  user?: unknown;
};

type Envelope = {
  success?: boolean;
  data?: VerifyPayload;
  message?: string;
  error?: string;
};

function asPayload(json: Envelope & VerifyPayload): VerifyPayload {
  if (json.data && typeof json.data === "object") {
    return json.data;
  }
  return {
    token: json.token,
    accessToken: json.accessToken,
    user: json.user,
  };
}

/**
 * Seals the admin JWT into an httpOnly cookie. Hits the shared REST auth
 * surface (`/auth/otp/verify`) from Admin v2 — not the legacy workflow path.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetch(`${API_ORIGIN}/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const json = (await upstream.json().catch(() => ({}))) as Envelope &
    VerifyPayload;

  if (!upstream.ok || json.success === false) {
    return NextResponse.json(
      {
        success: false,
        message:
          json.message ?? json.error ?? "Invalid or expired code.",
      },
      { status: upstream.status || 400 },
    );
  }

  const payload = asPayload(json);
  const token = payload.token ?? payload.accessToken;
  let user = payload.user;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Verification response missing token." },
      { status: 502 },
    );
  }

  if (!user) {
    const meRes = await fetch(`${API_ORIGIN}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meJson = (await meRes.json().catch(() => ({}))) as Envelope & {
      user?: unknown;
    };
    if (meJson.data && typeof meJson.data === "object") {
      const data = meJson.data as { user?: unknown } & Record<string, unknown>;
      user = data.user ?? meJson.data;
    } else {
      user = meJson.user ?? meJson;
    }
  }

  const res = NextResponse.json({ success: true, data: { user } });
  res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return res;
}
