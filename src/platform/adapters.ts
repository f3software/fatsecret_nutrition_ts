import type { HttpClient } from "../http";
import { detectPlatform } from "../config/platform";
import type {
  PlatformAdapterBundle,
  StorageAdapter,
  CryptoAdapter,
} from "./types";

const maybeBuffer = (): typeof Buffer | undefined =>
  (globalThis as Record<string, unknown>).Buffer as typeof Buffer | undefined;

class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class BrowserStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  }
}

class NodeCryptoAdapter implements CryptoAdapter {
  private async loadCrypto() {
    return (await import("crypto")).default;
  }

  async randomBytes(length: number): Promise<Uint8Array> {
    const crypto = await this.loadCrypto();
    return new Uint8Array(crypto.randomBytes(length));
  }

  async hmacSha1(key: string, baseString: string): Promise<string> {
    const crypto = await this.loadCrypto();
    return crypto.createHmac("sha1", key).update(baseString).digest("base64");
  }

  base64Encode(input: Uint8Array | string): string {
    const buffer = maybeBuffer();
    if (typeof input === "string") {
      return buffer
        ? buffer.from(input, "utf8").toString("base64")
        : btoa(input);
    }
    return buffer
      ? buffer.from(input).toString("base64")
      : btoa(bytesToBinary(input));
  }
}

class WebCryptoAdapter implements CryptoAdapter {
  constructor(private readonly crypto: Crypto) {}

  async randomBytes(length: number): Promise<Uint8Array> {
    const bytes = new Uint8Array(length);
    this.crypto.getRandomValues(bytes);
    return bytes;
  }

  async hmacSha1(key: string, baseString: string): Promise<string> {
    const encoder = new TextEncoder();
    const cryptoKey = await this.crypto.subtle.importKey(
      "raw",
      encoder.encode(key),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"],
    );
    const signature = await this.crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(baseString),
    );
    return uint8ToBase64(new Uint8Array(signature));
  }

  base64Encode(input: Uint8Array | string): string {
    if (typeof input === "string") {
      return btoa(input);
    }
    return uint8ToBase64(input);
  }
}

class PlaceholderCryptoAdapter implements CryptoAdapter {
  async randomBytes(length: number): Promise<Uint8Array> {
    throw new Error(
      `randomBytes(${length}) requires a platform crypto implementation`,
    );
  }

  async hmacSha1(key: string, baseString: string): Promise<string> {
    void key;
    void baseString;
    throw new Error("hmacSha1 requires a platform crypto implementation");
  }

  base64Encode(input: Uint8Array | string): string {
    const buffer = maybeBuffer();
    if (typeof input === "string") {
      if (typeof btoa === "function") return btoa(input);
      if (buffer) return buffer.from(input, "utf8").toString("base64");
    } else if (buffer) {
      return buffer.from(input).toString("base64");
    }
    throw new Error("base64Encode requires Buffer or btoa support");
  }
}

export const createMemoryStorageAdapter = (): StorageAdapter =>
  new MemoryStorageAdapter();

export const createNodeAdapters = (): PlatformAdapterBundle => ({
  target: "node",
  storage: createMemoryStorageAdapter(),
  crypto: new NodeCryptoAdapter(),
});

export const createWebAdapters = (): PlatformAdapterBundle => {
  if (typeof window === "undefined" || !window.crypto) {
    throw new Error("Window crypto APIs are unavailable in this environment.");
  }
  return {
    target: "web",
    storage: window.localStorage
      ? new BrowserStorageAdapter()
      : createMemoryStorageAdapter(),
    crypto: new WebCryptoAdapter(window.crypto),
  };
};

export const createReactNativeAdapters = (options: {
  storage: StorageAdapter;
  crypto: CryptoAdapter;
  httpClient?: HttpClient;
}): PlatformAdapterBundle => ({
  target: "react-native",
  storage: options.storage,
  crypto: options.crypto,
  httpClient: options.httpClient,
});

export const createDefaultPlatformAdapters = (): PlatformAdapterBundle => {
  const platform = detectPlatform();
  if (platform === "web") {
    try {
      return createWebAdapters();
    } catch {
      return {
        target: "web",
        storage: createMemoryStorageAdapter(),
        crypto: new PlaceholderCryptoAdapter(),
      };
    }
  }

  if (platform === "node") {
    return createNodeAdapters();
  }

  throw new Error(
    "React Native detected. Please provide platformAdapters explicitly via createReactNativeAdapters().",
  );
};

const uint8ToBase64 = (bytes: Uint8Array): string => {
  const buffer = maybeBuffer();
  if (buffer) {
    return buffer.from(bytes).toString("base64");
  }
  return btoa(bytesToBinary(bytes));
};

const bytesToBinary = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join("");
