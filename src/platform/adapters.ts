import { detectPlatform } from "../config/platform";
import type {
  PlatformAdapterBundle,
  StorageAdapter,
  CryptoAdapter,
} from "./types";

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

class PlaceholderCryptoAdapter implements CryptoAdapter {
  async randomBytes(length: number): Promise<Uint8Array> {
    throw new Error(
      `randomBytes(${length}) requires a platform crypto implementation`,
    );
  }

  async hmacSha1(_key: string, _baseString: string): Promise<string> {
    throw new Error("hmacSha1 requires a platform crypto implementation");
  }

  base64Encode(input: Uint8Array | string): string {
    const maybeBuffer = (globalThis as Record<string, any>).Buffer;
    if (typeof input === "string") {
      if (typeof btoa === "function") {
        return btoa(input);
      }
      if (maybeBuffer) {
        return maybeBuffer.from(input, "utf8").toString("base64");
      }
    } else if (maybeBuffer) {
      return maybeBuffer.from(input).toString("base64");
    }

    throw new Error("base64Encode requires Buffer or btoa support");
  }
}

export const createDefaultPlatformAdapters = (): PlatformAdapterBundle => ({
  target: detectPlatform(),
  storage: new MemoryStorageAdapter(),
  crypto: new PlaceholderCryptoAdapter(),
});
