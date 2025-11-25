import crypto from "crypto";
import { AuthManager } from "../../src/auth/auth-manager";
import type { SupportedAuthProvider } from "../../src/auth";
import type { HttpClient, HttpRequest, HttpResponse } from "../../src/http";
import type { PlatformAdapterBundle, StorageAdapter, CryptoAdapter } from "../../src/platform";

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

class NodeCryptoAdapter implements CryptoAdapter {
  async randomBytes(length: number): Promise<Uint8Array> {
    return new Uint8Array(crypto.randomBytes(length));
  }
  async hmacSha1(key: string, baseString: string): Promise<string> {
    return crypto.createHmac("sha1", key).update(baseString).digest("base64");
  }
  base64Encode(input: Uint8Array | string): string {
    if (typeof input === "string") {
      return Buffer.from(input, "utf8").toString("base64");
    }
    return Buffer.from(input).toString("base64");
  }
}

class MockHttpClient implements HttpClient {
  public sendMock = jest.fn(async (_request?: HttpRequest) => ({
    status: 200,
    data: {
      access_token: "cached-token",
      expires_in: 3600,
    },
    headers: {},
  }));

  async send<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    return (await this.sendMock(request)) as HttpResponse<T>;
  }
}

const adapters: PlatformAdapterBundle = {
  target: "node",
  storage: new MemoryStorage(),
  crypto: new NodeCryptoAdapter(),
};

describe("AuthManager", () => {
  it("returns bearer headers for client credentials", async () => {
    const provider: SupportedAuthProvider = {
      strategy: "client-credentials",
      config: {
        clientId: "demo",
        clientSecret: "secret",
        tokenUrl: "https://example.com/token",
      },
    };

    const manager = new AuthManager(provider, new MockHttpClient(), adapters);
    const auth = await manager.getAuth({
      method: "GET",
      url: "https://platform.fatsecret.com/rest/server.api",
    });

    expect(auth.headers?.Authorization).toBe("Bearer cached-token");
  });

  it("returns OAuth params for OAuth1 strategy", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const provider: SupportedAuthProvider = {
      strategy: "oauth1",
      config: {
        consumerKey: "key",
        consumerSecret: "secret",
        accessToken: "token",
        accessTokenSecret: "token-secret",
      },
    };

    const manager = new AuthManager(provider, new MockHttpClient(), adapters);
    const auth = await manager.getAuth({
      method: "GET",
      url: "https://platform.fatsecret.com/rest/server.api",
      query: { method: "foods.search" },
    });

    expect(auth.query).toBeDefined();
    expect(Object.keys(auth.query || {})).toEqual(
      expect.arrayContaining(["oauth_signature", "oauth_nonce", "method"]),
    );
    expect(auth.headers?.Authorization?.startsWith("OAuth ")).toBe(true);

    (Date.now as jest.Mock).mockRestore();
  });
});

