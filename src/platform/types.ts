import type { HttpClient } from "../http";
import type { PlatformTarget } from "../config/platform";

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface CryptoAdapter {
  randomBytes(length: number): Promise<Uint8Array>;
  hmacSha1(key: string, baseString: string): Promise<string>;
  base64Encode(input: Uint8Array | string): string;
}

export interface PlatformAdapterBundle {
  target: PlatformTarget;
  storage: StorageAdapter;
  crypto: CryptoAdapter;
  httpClient?: HttpClient;
}
