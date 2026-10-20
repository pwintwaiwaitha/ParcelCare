export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.method && options.method !== "GET")
    headers.set("x-parcelcare-request", "1");
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({ detail: "The request failed. Please retry." }));
    const message =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((e: { msg: string }) => e.msg).join(" ")
          : "The request failed. Please retry.";
    throw new ApiError(message, response.status);
  }
  return response.json();
}
export function mutation(body: unknown, key: string): RequestInit {
  return {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Idempotency-Key": key },
  };
}
