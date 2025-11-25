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

## Getting Started
1. Install Node.js 18+ (`nvm install 18 && nvm use 18`).
2. From `fatsecret_nutrition_ts/`, run `npm install` (or `yarn install`).
3. Validate the workspace:
   - `npm run lint`
   - `npm run test`
4. Build before publishing: `npm run build`.

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

## Examples
Use the Node CLI demo to exercise real FatSecret endpoints:

```bash
cp examples/cli-demo/env.example .env.local   # fill with real credentials
npm install
npm run example
```

The script hits `foods.autocomplete.v2`, `foods.search.v3`, `food.find_id_for_barcode`, and `food_categories.get.v2`. These are real API calls—watch your rate limits.
Set `FATSECRET_AUTH_STRATEGY` to `client-credentials` (needs OAuth2 client ID/secret + scopes) or `oauth1` (needs consumer key/secret and optional access token). Some endpoints require premium scopes (`premier`, `barcode`, etc.); request those in the FatSecret portal if you see “Missing scope” errors.

## CI Integration
Add the lint/test steps to CI (example uses GitHub Actions):

```yaml
name: fatsecret-ts
on:
  push:
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm install
      - run: npm run lint
      - run: npm run test
```

## Next Steps
- Port core DTOs (`Food`, `Recipe`, NLP, etc.) and align naming with Dart `freezed` models.
- Implement auth adapters (client credentials + OAuth1.0a) with pluggable storage/network stack.
- Flesh out `FatSecretNutritionClient` methods mirroring Dart for parity and add integration tests using recorded fixtures.

