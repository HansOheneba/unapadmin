import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/api/session";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8083";

/**
 * BFF proxy: the browser only ever talks to same-origin `/api/backend/*`.
 * This forwards to the real API, attaching the admin JWT from the httpOnly
 * session cookie as `Authorization: Bearer`. Keeps the token off the client
 * entirely and avoids CORS since the browser never calls the API directly.
 */
async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const url = `${API_ORIGIN}/${path.join("/")}${req.nextUrl.search}`;
  const contentType = req.headers.get("content-type");
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const bodyBuffer = hasBody ? await req.arrayBuffer() : undefined;
  const isMultipart = !!contentType?.includes("multipart/form-data");

  let requestPayload: unknown = null;
  if (bodyBuffer && bodyBuffer.byteLength > 0) {
    if (isMultipart) {
      requestPayload = {
        kind: "multipart/form-data",
        bytes: bodyBuffer.byteLength,
        contentType,
        hasBoundary: !!contentType?.includes("boundary="),
      };
    } else {
      try {
        requestPayload = JSON.parse(new TextDecoder().decode(bodyBuffer));
      } catch {
        requestPayload = `[non-json body ${bodyBuffer.byteLength} bytes]`;
      }
    }
  }

  console.log("[bff] →", {
    method: req.method,
    url,
    hasAuth: !!token,
    payload: requestPayload,
  });

  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      // Preserve multipart boundary; never force application/json on uploads.
      ...(contentType ? { "content-type": contentType } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: bodyBuffer,
  });

  const responseBody = await upstream.arrayBuffer();

  let responsePayload: unknown = null;
  const responseText = new TextDecoder().decode(responseBody);
  if (responseText.trim()) {
    try {
      responsePayload = JSON.parse(responseText);
    } catch {
      responsePayload = responseText.slice(0, 500);
    }
  }

  // Node truncates nested arrays as [Array]; expand customer.list so we can
  // see whether the API actually sends totalOrders / totalSpend / etc.
  if (url.includes("customer.list") || url.includes("customer.get")) {
    console.log(
      "[bff] ← customer payload (full)",
      JSON.stringify(
        { method: req.method, url, status: upstream.status, response: responsePayload },
        null,
        2,
      ),
    );
  } else {
    console.log("[bff] ←", {
      method: req.method,
      url,
      status: upstream.status,
      response: responsePayload,
    });
  }

  const res = new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });

  if (upstream.status === 401) {
    res.cookies.delete(SESSION_COOKIE);
  }

  return res;
}

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  return proxy(req, (await params).path);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return proxy(req, (await params).path);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return proxy(req, (await params).path);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return proxy(req, (await params).path);
}
