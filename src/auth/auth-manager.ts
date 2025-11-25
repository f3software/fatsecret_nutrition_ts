import type { HttpClient, HttpMethod } from "../http";
import type { CryptoAdapter, PlatformAdapterBundle, StorageAdapter } from "../platform";
import type { SupportedAuthProvider } from "./types";
import { ClientCredentialsAuthenticator } from "./client-credentials";
import { TokenCache } from "./token-cache";
import { OAuth1Signer } from "./oauth1";

export interface AuthRequestContext {
  method: HttpMethod;
  url: string;
  query?: Record<string, string>;
}

export interface AuthResult {
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

export class AuthManager {
  private clientCredentials?: ClientCredentialsAuthenticator;
  private oauth1Signer?: OAuth1Signer;
  private storage: StorageAdapter;
  private crypto: CryptoAdapter;

  constructor(
    private readonly provider: SupportedAuthProvider,
    private readonly http: HttpClient,
    adapters: PlatformAdapterBundle,
    defaultTokenUrl?: string,
  ) {
    this.storage = adapters.storage;
    this.crypto = adapters.crypto;
    if (provider.strategy === "client-credentials") {
      if (!provider.config.tokenUrl && defaultTokenUrl) {
        provider.config.tokenUrl = defaultTokenUrl;
      }
      const cache = new TokenCache(this.storage, "fatsecret:access_token");
      this.clientCredentials = new ClientCredentialsAuthenticator(
        provider.config,
        this.http,
        cache,
      );
    } else {
      this.oauth1Signer = new OAuth1Signer(provider.config, this.crypto);
    }
  }

  async getAuth(context: AuthRequestContext): Promise<AuthResult> {
    if (this.provider.strategy === "client-credentials") {
      if (!this.clientCredentials) {
        throw new Error("Client credentials authenticator not configured");
      }
      const token = await this.clientCredentials.getAccessToken();
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }

    if (!this.oauth1Signer) {
      throw new Error("OAuth1 signer not configured");
    }

    const params = await this.oauth1Signer.generateParams({
      method: context.method,
      url: context.url,
      params: context.query,
    });

    return {
      query: params,
      headers: {
        Authorization: this.oauth1Signer.buildAuthorizationHeader(params),
      },
    };
  }
}

