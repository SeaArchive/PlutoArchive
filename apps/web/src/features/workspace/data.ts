export async function workspaceRequest<T>(
  resource: "notes" | "tasks",
  method: "GET" | "POST" | "PATCH" | "DELETE",
  id?: string,
  body?: object,
  signal?: AbortSignal,
): Promise<T> {
  const url = `/api/workspace/${resource}${id ? `?id=${encodeURIComponent(id)}` : ""}`;
  const response = await fetch(url, {
    method,
    signal,
    cache: "no-store",
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(result.error || "요청에 실패했습니다. 다시 시도해 주세요.");
  return result;
}
