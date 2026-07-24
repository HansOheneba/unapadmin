import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/api/session";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8083";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (token) {
    await fetch(`${API_ORIGIN}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: "{}",
    }).catch(() => undefined);
  }

  const res = NextResponse.json({
    success: true,
    data: { message: "Signed out." },
  });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
