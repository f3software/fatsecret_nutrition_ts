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

    let body: BodyInit | undefined;
    if (typeof request.body === "string") {
      body = request.body;
    } else if (request.body instanceof URLSearchParams) {
      body = request.body.toString();
    } else if (request.body && typeof request.body === "object") {
      body = JSON.stringify(request.body);
    }

    const response = await fetch(url, {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" ? undefined : body,
    });

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Check content-type before parsing JSON
    const contentType =
      headers["content-type"] || headers["Content-Type"] || "";
    const isJson =
      contentType.includes("application/json") ||
      contentType.includes("text/json");

    // Read response as text first so we can provide better error messages
    // and handle both JSON and non-JSON responses
    const text = await response.text();

    let data: T;

    if (!response.ok) {
      // For non-OK responses, provide detailed error information
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}. Content-Type: ${contentType || "unknown"}. Response: ${text.substring(0, 500)}`,
      );
    }

    if (isJson) {
      try {
        data = JSON.parse(text) as T;
      } catch (error) {
        throw new Error(
          `Failed to parse JSON response. Status: ${response.status}, Content-Type: ${contentType}, Response preview: ${text.substring(0, 200)}`,
        );
      }
    } else {
      // If not marked as JSON but response is OK, try to parse anyway
      // (some APIs don't set content-type correctly)
      try {
        data = JSON.parse(text) as T;
      } catch {
        throw new Error(
          `Expected JSON response but received ${contentType || "unknown content type"}. Response preview: ${text.substring(0, 200)}`,
        );
      }
    }

    return {
      status: response.status,
      data,
      headers,
    };
  }
}
