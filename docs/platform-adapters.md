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

## Implementation Plan
1. Define `PlatformAdapterBundle` that packages the three adapters plus platform metadata.
2. Provide factory helpers:
   - `createWebAdapters()` – uses `window.crypto` + `localStorage`.
   - `createReactNativeAdapters()` – expects caller to inject storage + crypto modules (keeps bundle size low).
   - `createNodeAdapters()` – lazy `import('crypto')` and simple `Map` storage.
3. Allow `FatSecretNutritionClient` constructor to accept `platformAdapters`; default to auto-detection with safe fallbacks so unit tests continue to work without polyfills.
4. Document how to plug custom adapters in README (e.g., using `@react-native-async-storage/async-storage` and `react-native-quick-crypto`).

Deliverables added in code:
- `src/platform/types.ts` – adapter interfaces.
- `src/platform/adapters.ts` – helper factory + placeholders (throws when capability missing).
- `src/platform/index.ts` – exports for future wiring into the client.

