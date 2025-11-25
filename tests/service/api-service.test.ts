import type { HttpClient, HttpRequest, HttpResponse } from "../../src/http";
import { ApiService } from "../../src/service/api-service";
import type { FatSecretEnvironment } from "../../src/config";
import type { AuthManager, AuthResult } from "../../src/auth/auth-manager";
import { FatSecretMethod } from "../../src/types";

class MockHttpClient implements HttpClient {
  constructor(
    private readonly handler: (request: HttpRequest) => Promise<HttpResponse<any>>,
  ) {}

  send<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    return this.handler(request) as Promise<HttpResponse<T>>;
  }
}

const environment: FatSecretEnvironment = {
  apiBaseUrl: "https://platform.fatsecret.com/rest",
  oauthBaseUrl: "https://oauth.fatsecret.com/connect/token",
  imageRecognitionUrl: "https://platform.fatsecret.com/rest/2.0/image.recognition",
  naturalLanguageProcessingUrl: "https://platform.fatsecret.com/rest/1.0/natural-language-processing",
};

describe("ApiService", () => {
  it("calls FatSecret RPC methods with auth headers and query", async () => {
    const authManager = {
      getAuth: jest.fn(async (): Promise<AuthResult> => ({
        headers: { Authorization: "Bearer demo" },
        query: { oauth_nonce: "123" },
      })),
    } as unknown as AuthManager;

    const http = new MockHttpClient(async (request) => {
      expect(request.url).toBe("https://platform.fatsecret.com/rest/server.api");
      expect(request.method).toBe("GET");
      expect(request.query).toMatchObject({
        method: FatSecretMethod.FoodsSearchV3,
        format: "json",
        search_expression: "apple",
        oauth_nonce: "123",
      });
      expect(request.headers?.Authorization).toBe("Bearer demo");
      return {
        status: 200,
        data: { ok: true },
        headers: {},
      };
    });

    const service = new ApiService({
      http,
      environment,
      authManager,
    });

    const response = await service.callMethod<{ ok: boolean }>(
      FatSecretMethod.FoodsSearchV3,
      { search_expression: "apple" },
    );

    expect(response.ok).toBe(true);
    expect(authManager.getAuth).toHaveBeenCalled();
  });

  it("posts JSON payloads with auth headers", async () => {
    const authManager = {
      getAuth: jest.fn(async (): Promise<AuthResult> => ({
        headers: { Authorization: "Bearer demo" },
      })),
    } as unknown as AuthManager;

    const payload = { user_input: "apple" };
    const http = new MockHttpClient(async (request) => {
      expect(request.method).toBe("POST");
      expect(request.body).toEqual(payload);
      expect(request.headers?.Authorization).toBe("Bearer demo");
      expect(request.headers?.["Content-Type"]).toBe("application/json");
      return {
        status: 200,
        data: { ok: true },
        headers: {},
      };
    });

    const service = new ApiService({
      http,
      environment,
      authManager,
    });

    const response = await service.postJson<{ ok: boolean }>(
      environment.naturalLanguageProcessingUrl,
      payload,
    );

    expect(response.ok).toBe(true);
  });
});

