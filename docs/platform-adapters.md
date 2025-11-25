# Platform Adapter Strategy

## Goals
- Support React (web) and React Native without forking the public API surface.
- Allow consumers to swap networking, secure storage, and crypto primitives while providing sensible defaults where the runtime already exposes the capability.
- Keep parity with the Dart SDK abstractions (`ApiService`, `AuthService`) by funnelling both through an `HttpClient` + `AuthProvider` pair.

## Abstraction Layers
| Concern | Abstraction | Default |
| --- | --- | --- |
| HTTP | `HttpClient` (already implemented via `FetchHttpClient`) | `fetch` (browser / RN) or `cross-fetch` polyfill in Node. |
| Storage (persisting oauth tokens, cached responses) | `StorageAdapter` with async `getItem/setItem/removeItem`. | `localStorage` on web, `AsyncStorage` recommended on RN, `in-memory` fallback for SSR/tests. |
| Crypto (OAuth1 nonce + signature, base64, random bytes) | `CryptoAdapter` exposing `randomBytes`, `hmacSha1`, `base64Encode`. | Web Crypto (SubtleCrypto) where available; Node `crypto` shim; RN to leverage `expo-crypto` or `react-native-crypto`. |

## Adapter Factories
```ts
import {
  createNodeAdapters,
  createWebAdapters,
  createReactNativeAdapters,
} from "@f3software/fatsecret_nutrition/platform";

// Node (SSR, CLI, Jest)
const nodeAdapters = createNodeAdapters();

// Browser (React, Next.js client components)
const webAdapters = createWebAdapters();

// React Native — provide your own storage & crypto implementations
const rnAdapters = createReactNativeAdapters({
  storage: {
    getItem: (key) => AsyncStorage.getItem(key),
    setItem: (key, value) => AsyncStorage.setItem(key, value),
    removeItem: (key) => AsyncStorage.removeItem(key),
  },
  crypto: {
    randomBytes: (len) => Crypto.getRandomBytesAsync(len),
    hmacSha1: (key, data) => SHA1.sign(key, data), // implement with react-native-quick-crypto or similar
    base64Encode: (value) => base64FromString(value),
  },
});
```

Pass any bundle through `platformAdapters` when creating the client:

```ts
const client = new FatSecretNutritionClient({
  auth,
  platformAdapters: nodeAdapters,
});
```

## React Native Guidance
- Use `@react-native-async-storage/async-storage` for the storage adapter.
- For crypto, pair [`react-native-quick-crypto`](https://github.com/margelo/react-native-quick-crypto) or Expo’s [`expo-crypto`](https://docs.expo.dev/versions/latest/sdk/crypto/) with a lightweight Base64 helper (e.g., `react-native-base64`).
- Because React Native lacks built-in crypto primitives, `createDefaultPlatformAdapters` will throw and instruct developers to supply their own bundle.

## Default Resolution Rules
1. Browser environment → `createWebAdapters` (localStorage + Web Crypto).
2. Node environment → `createNodeAdapters` (in-memory storage + Node crypto).
3. React Native → throws, requiring explicit configuration for safety.

This keeps desktop/web builds zero-config while ensuring mobile apps wire their secure storage and crypto providers intentionally.

