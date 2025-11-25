import type { HttpClient, HttpRequest, HttpResponse } from "./http-client";

function buildUrl(url: string, query?: HttpRequest["query"]): string {
  if (!query || Object.keys(query).length === 0) {
    return url;
  }

  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined) return;
    searchParams.append(key, String(value));
  });
  const qs = searchParams.toString();
  return qs ? `${url}?${qs}` : url;
}

export class FetchHttpClient implements HttpClient {
  async send<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    const url = buildUrl(request.url, request.query);
    const response = await fetch(url, {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" ? undefined : JSON.stringify(request.body),
    });

    const data = (await response.json()) as T;
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      data,
      headers,
    };
  }
}
