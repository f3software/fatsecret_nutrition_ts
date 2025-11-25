import type { ClientCredentialsConfig } from "./types";
import type { HttpClient, HttpResponse } from "../http";
import { TokenCache } from "./token-cache";

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type?: string;
}

const DEFAULT_SCOPE = "basic";

export class ClientCredentialsAuthenticator {
  constructor(
    private readonly config: ClientCredentialsConfig,
    private readonly http: HttpClient,
    private readonly cache: TokenCache,
  ) {}

  async getAccessToken(): Promise<string> {
    const cached = await this.cache.get();
    if (cached) {
      return cached.token;
    }

    const fresh = await this.fetchToken();
    await this.cache.set(fresh.access_token, fresh.expires_in);
    return fresh.access_token;
  }

  private async fetchToken(): Promise<TokenResponse> {
    const tokenUrl = this.config.tokenUrl;
    if (!tokenUrl) {
      throw new Error("Client credentials tokenUrl is required");
    }

    const scope = this.normalizeScopes(this.config.scopes);
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      scope,
    });

    const response: HttpResponse<TokenResponse> = await this.http.send({
      method: "POST",
      url: tokenUrl,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${this.encodeCredentials()}`,
      },
      body,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch access token: ${response.status}`);
    }

    if (!response.data?.access_token || !response.data?.expires_in) {
      throw new Error("Malformed token response");
    }

    return response.data;
  }

  private encodeCredentials(): string {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error("Client credentials require clientId and clientSecret");
    }
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
    if (typeof Buffer !== "undefined") {
      return Buffer.from(credentials, "utf8").toString("base64");
    }
    if (typeof btoa === "function") {
      return btoa(credentials);
    }
    throw new Error("No base64 encoder available for credentials");
  }

  private normalizeScopes(scopes?: string | string[]): string {
    if (!scopes || (Array.isArray(scopes) && scopes.length === 0)) {
      return DEFAULT_SCOPE;
    }
    if (typeof scopes === "string") {
      return scopes.trim() || DEFAULT_SCOPE;
    }
    return scopes.join(" ");
  }
}

