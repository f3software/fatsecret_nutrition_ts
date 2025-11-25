import type { StorageAdapter } from "../platform";

export interface CachedToken {
  token: string;
  expiresAt: number;
}

const SAFETY_WINDOW_MS = 5_000;

export class TokenCache {
  constructor(private readonly storage: StorageAdapter, private readonly key: string) {}

  async get(): Promise<CachedToken | null> {
    try {
      const raw = await this.storage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CachedToken;
      if (!parsed.token || !parsed.expiresAt) return null;
      if (parsed.expiresAt <= Date.now()) {
        await this.storage.removeItem(this.key);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  async set(token: string, expiresInSeconds: number): Promise<void> {
    const expiresAt = Date.now() + expiresInSeconds * 1000 - SAFETY_WINDOW_MS;
    const payload: CachedToken = { token, expiresAt };
    await this.storage.setItem(this.key, JSON.stringify(payload));
  }

  async clear(): Promise<void> {
    await this.storage.removeItem(this.key);
  }
}

