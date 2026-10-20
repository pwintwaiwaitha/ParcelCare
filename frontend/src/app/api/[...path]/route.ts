import type { NextRequest } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (path.some((p) => !/^[a-zA-Z0-9_-]+$/.test(p)))
    return Response.json({ detail: "Invalid route." }, { status: 400 });
  const mutation = !["GET", "HEAD"].includes(request.method);
  if (
    mutation &&
    (request.headers.get("x-parcelcare-request") !== "1" ||
      request.headers.get("sec-fetch-site") === "cross-site")
  ) {
    return Response.json(
      { detail: "Request verification failed." },
      { status: 403 },
    );
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 6 * 1024 * 1024)
    return Response.json(
      { detail: "Upload must be smaller than 5 MB." },
      { status: 413 },
    );
  const base =
    process.env.API_INTERNAL_URL ||
    (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000" : "");
  if (!base)
    return Response.json(
      { detail: "The API connection has not been configured." },
      { status: 503 },
    );
  const headers = new Headers();
  for (const name of [
    "cookie",
    "content-type",
    "idempotency-key",
    "x-parcelcare-request",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const body = mutation ? await request.arrayBuffer() : undefined;
    if (body && body.byteLength > 6 * 1024 * 1024)
      return Response.json(
        { detail: "Upload must be smaller than 5 MB." },
        { status: 413 },
      );
    const upstream = await fetch(
      `${base.replace(/\/$/, "")}/${path.join("/")}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(60000),
      },
    );
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    for (const name of [
      "content-type",
      "set-cookie",
      "content-disposition",
      "x-content-type-options",
    ]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        detail:
          "The service is unavailable or starting up. Please retry shortly.",
      },
      { status: 503 },
    );
  }
}
export { proxy as GET, proxy as POST };
