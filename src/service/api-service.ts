import type { HttpClient, HttpResponse, HttpMethod } from "../http";
import type { FatSecretEnvironment } from "../config";
import type { AuthManager } from "../auth/auth-manager";
import type { FatSecretMethod } from "../types";

interface ApiServiceOptions {
  http: HttpClient;
  environment: FatSecretEnvironment;
  authManager: AuthManager;
}

type QueryValue = string | number | boolean | undefined;

export class ApiService {
  constructor(private readonly options: ApiServiceOptions) {}

  async callMethod<TResponse>(
    method: FatSecretMethod | string,
    queryParams: Record<string, QueryValue> = {},
  ): Promise<TResponse> {
    const url = `${this.options.environment.apiBaseUrl}/server.api`;
    const query = {
      method: typeof method === "string" ? method : method,
      format: "json",
      ...queryParams,
    };

    const auth = await this.options.authManager.getAuth({
      method: "GET",
      url,
      query: stringifyRecord(query),
    });

    const response = await this.sendRequest<TResponse>({
      method: "GET",
      url,
      query: {
        ...query,
        ...(auth.query ?? {}),
      },
      headers: auth.headers,
    });

    return response;
  }

  async postJson<TResponse>(
    url: string,
    body: Record<string, unknown>,
  ): Promise<TResponse> {
    const auth = await this.options.authManager.getAuth({
      method: "POST",
      url,
    });

    return this.sendRequest<TResponse>({
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        ...(auth.headers ?? {}),
      },
      body,
    });
  }

  private async sendRequest<T>({
    method,
    url,
    query,
    headers,
    body,
  }: {
    method: HttpMethod;
    url: string;
    query?: Record<string, QueryValue>;
    headers?: Record<string, string>;
    body?: Record<string, unknown> | string | URLSearchParams;
  }): Promise<T> {
    const response: HttpResponse<T> = await this.options.http.send<T>({
      method,
      url,
      query,
      headers,
      body,
    });

    if (response.status !== 200) {
      throw new Error(`FatSecret API error: ${response.status}`);
    }

    const data = response.data;
    if (isErrorPayload(data)) {
      throw new Error(data.error.message ?? "FatSecret API error");
    }
    return data;
  }
}

function stringifyRecord(
  params: Record<string, QueryValue>,
): Record<string, string> {
  return Object.entries(params).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value === undefined) return acc;
      acc[key] = String(value);
      return acc;
    },
    {},
  );
}

function isErrorPayload(
  data: unknown,
): data is { error: { message?: string } } {
  return Boolean(
    data &&
      typeof data === "object" &&
      "error" in (data as Record<string, unknown>),
  );
}
