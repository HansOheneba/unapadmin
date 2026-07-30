import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/api/session";

/**
 * Returns the admin JWT from the httpOnly session cookie so the browser can
 * POST multipart uploads straight to the API origin (bypassing the Vercel
 * BFF body size limit). Response is tiny JSON only.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    console.warn("[media-token] no session cookie");
    return NextResponse.json(
      { success: false, message: "Not signed in." },
      { status: 401 },
    );
  }

  console.log("[media-token] issuing token", {
    length: token.length,
    prefix: token.slice(0, 12),
  });

  return NextResponse.json({ success: true, data: { token } });
}
