# @fatsecret_nutrition/ts

TypeScript implementation of the FatSecret Nutrition SDK targeting React (web) and React Native. The goal is to mirror the public API exposed by the Dart package so teams can share knowledge and documentation across platforms.

## Status
- ✅ Project scaffolding (TypeScript 5, tsup, Jest, ESLint).
- ✅ API + model audit notes in `docs/audit.md`.
- 🚧 Porting Dart models and client surface.
- 🚧 Implementing transport/auth layers (OAuth2 + OAuth1.0a) compatible with browsers and React Native.

## Scripts
| Script | Purpose |
| --- | --- |
| `npm run build` | Bundles to ESM + CJS with declarations. |
| `npm run typecheck` | Runs `tsc --noEmit`. |
| `npm run lint` | ESLint over `src`. |
| `npm run test` | Jest + ts-jest. |

## Platform Adapters
The client detects the current runtime and picks the appropriate adapter bundle:

```ts
import {
  createNodeAdapters,
  createWebAdapters,
  createReactNativeAdapters,
} from "@f3software/fatsecret_nutrition/platform";

const client = new FatSecretNutritionClient({
  auth,
  platformAdapters: createNodeAdapters(), // or createWebAdapters()
});
```

- **Node / SSR / Jest** – `createNodeAdapters()` uses an in-memory storage map and Node’s crypto module.
- **Browser** – `createWebAdapters()` leverages `localStorage` and Web Crypto’s `SubtleCrypto`.
- **React Native** – use `createReactNativeAdapters()` and inject storage (e.g., AsyncStorage) plus a crypto provider (e.g., `react-native-quick-crypto`).

## Next Steps
- Port core DTOs (`Food`, `Recipe`, NLP, etc.) and align naming with Dart `freezed` models.
- Implement auth adapters (client credentials + OAuth1.0a) with pluggable storage/network stack.
- Flesh out `FatSecretNutritionClient` methods mirroring Dart for parity and add integration tests using recorded fixtures.

