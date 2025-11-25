import { ClientCredentialsAuthenticator, TokenCache } from "../../src/auth";
import type { ClientCredentialsConfig } from "../../src/auth";
import type { HttpClient, HttpRequest, HttpResponse } from "../../src/http";
import type { StorageAdapter } from "../../src/platform";

class MockHttpClient implements HttpClient {
  public sendMock = jest.fn(async (_request?: HttpRequest) => ({
    status: 200,
    data: {
      access_token: "token-123",
      expires_in: 3600,
    },
    headers: {},
  }));

  async send<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    return (await this.sendMock(request)) as HttpResponse<T>;
  }
}

class MemoryStorage implements StorageAdapter {
  private store = new Map<string, string>();
  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

const config: ClientCredentialsConfig = {
  clientId: "demo",
  clientSecret: "secret",
  tokenUrl: "https://example.com/token",
};

describe("ClientCredentialsAuthenticator", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("retrieves and caches tokens", async () => {
    const http = new MockHttpClient();
    const cache = new TokenCache(new MemoryStorage(), "test-cache");
    const auth = new ClientCredentialsAuthenticator(config, http, cache);

    const tokenOne = await auth.getAccessToken();
    const tokenTwo = await auth.getAccessToken();

    expect(tokenOne).toBe("token-123");
    expect(tokenTwo).toBe("token-123");
    expect(http.sendMock).toHaveBeenCalledTimes(1);
  });

  it("refreshes tokens after expiry", async () => {
    jest.useFakeTimers();

    const http = new MockHttpClient();
    http.sendMock.mockResolvedValueOnce({
      status: 200,
      data: {
        access_token: "first-token",
        expires_in: 1,
      },
      headers: {},
    });
    http.sendMock.mockResolvedValueOnce({
      status: 200,
      data: {
        access_token: "second-token",
        expires_in: 3600,
      },
      headers: {},
    });

    const cache = new TokenCache(new MemoryStorage(), "test-cache");
    const auth = new ClientCredentialsAuthenticator(config, http, cache);

    const tokenOne = await auth.getAccessToken();
    jest.advanceTimersByTime(2_000);
    const tokenTwo = await auth.getAccessToken();

    expect(tokenOne).toBe("first-token");
    expect(tokenTwo).toBe("second-token");
    expect(http.sendMock).toHaveBeenCalledTimes(2);
  });
});

