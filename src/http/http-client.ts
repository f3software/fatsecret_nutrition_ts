export type HttpMethod = 'GET' | 'POST';

export interface HttpRequest {
  method: HttpMethod;
  url: string;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string | URLSearchParams;
}

export interface HttpResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export interface HttpClient {
  send<T>(request: HttpRequest): Promise<HttpResponse<T>>;
}

