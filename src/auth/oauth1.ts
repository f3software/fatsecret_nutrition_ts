import type { OAuth1Config } from "./types";
import type { CryptoAdapter } from "../platform";

export interface OAuth1Params {
  oauth_consumer_key: string;
  oauth_signature_method: string;
  oauth_timestamp: string;
  oauth_nonce: string;
  oauth_version: string;
  oauth_signature?: string;
  oauth_token?: string;
}

export interface OAuth1RequestConfig {
  method: string;
  url: string;
  params?: Record<string, string>;
}

const RFC3986_REGEX = /[!'()*]/g;
const RFC3986_REPLACEMENTS: Record<string, string> = {
  "!": "%21",
  "'": "%27",
  "(": "%28",
  ")": "%29",
  "*": "%2A",
};

export class OAuth1Signer {
  constructor(private readonly config: OAuth1Config, private readonly crypto: CryptoAdapter) {}

  async generateParams(request: OAuth1RequestConfig): Promise<Record<string, string>> {
    const oauthParams: OAuth1Params = {
      oauth_consumer_key: this.config.consumerKey,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: await this.generateNonce(),
      oauth_version: "1.0",
    };

    if (this.config.accessToken) {
      oauthParams.oauth_token = this.config.accessToken;
    }

    const allParams: Record<string, string> = {
      ...oauthParams,
      ...(request.params ?? {}),
    };

    const signatureBaseString = this.createSignatureBaseString(request.method, request.url, allParams);
    const signature = await this.sign(signatureBaseString);
    oauthParams.oauth_signature = signature;

    return {
      ...oauthParams,
      ...(request.params ?? {}),
    };
  }

  buildAuthorizationHeader(params: Record<string, string>): string {
    const headerParams = Object.entries(params)
      .filter(([key]) => key.startsWith("oauth_"))
      .map(([key, value]) => `${key}="${percentEncode(value)}"`)
      .join(", ");
    return `OAuth ${headerParams}`;
  }

  private async generateNonce(): Promise<string> {
    const bytes = await this.crypto.randomBytes(16);
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  private async sign(signatureBaseString: string): Promise<string> {
    const key = `${percentEncode(this.config.consumerSecret)}&${percentEncode(
      this.config.accessTokenSecret ?? "",
    )}`;
    return this.crypto.hmacSha1(key, signatureBaseString);
  }

  private createSignatureBaseString(method: string, url: string, params: Record<string, string>): string {
    const encodedMethod = percentEncode(method.toUpperCase());
    const encodedUrl = percentEncode(normalizeUrl(url));
    const normalizedParams = normalizeParams(params);
    return `${encodedMethod}&${encodedUrl}&${percentEncode(normalizedParams)}`;
  }
}

function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  const isDefaultPort = (url.protocol === "https:" && port === "443") || (url.protocol === "http:" && port === "80");
  const host = isDefaultPort ? url.host.split(":")[0] : url.host;
  return `${url.protocol}//${host}${url.pathname}`;
}

function normalizeParams(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`)
    .join("&");
}

export function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(RFC3986_REGEX, (char) => RFC3986_REPLACEMENTS[char]);
}

