# FatSecret Port – Audit Notes

## Existing Dart Package Highlights
- Entrypoint `lib/src/fatsecret_nutrition.dart` exposes ~11 read operations (food search, barcode lookup, food by id, autocomplete, brands, categories/subcategories, recipe search & lookup, recipe types, NLP, image recognition).
- Networking stack uses `dio` with OAuth2 client-credential flow (`AuthService`) to fetch bearer tokens from configurable `tokenUrl`, then calls `apiUrl/server.api` for GET-based RPC-style endpoints or REST endpoints for NLP / image recognition.
- `ApiService` centralizes HTTP handling, enforces `format=json`, attaches `Authorization: Bearer <token>`, and logs errors.
- Models rely on `freezed` + JSON annotations, heavy use of camelCase property wrappers around FatSecret snake_case fields plus converters for stringified numbers.
- Enum files map RPC methods (`Methods`), HTTP verbs, and specialized endpoints for POST routes (`EndPoints`).

## Strapi Plugin (`@server/src`) Insights
- `services/fatsecret-api.ts` reimplements OAuth **1.0a** signing, leveraging an `oauth` service that constructs signatures (nonce, timestamp, percent encoding per RFC3986).
- Relies on `undici.fetch` on Node, builds query strings manually and handles error propagation with typed `FatSecretError`.
- `services/fatsecret-oauth.ts` exposes helper types (`OAuthConfig`, `OAuthParams`) plus nonce generation, signature base string builder, and config loader from env vars.
- These utilities are valuable for a TS client because the browser/RN runtime will also need RFC-compliant signing when bypassing FatSecret’s OAuth2 bearer flow.

## Alignment Requirements
- Public API surface between Dart and TS should mirror method names & argument semantics so docs and samples translate directly.
- Type fidelity must match existing Dart models (`Food`, `Serving`, `Recipe`, etc.) including nullable patterns and numeric conversions.
- Authentication must support both OAuth2 client credentials (current Dart behavior) and OAuth1.0a signing (Strapi plugin behavior) through a common abstraction so integrators can target either FatSecret token strategy.
- React web vs React Native bring different fetch/storage/crypto shims; abstractions for HTTP client, secure credential persistence, and Base64/nonce generation must be customizable.

## Next Steps
1. Scaffold the TS package with dual module builds, Jest, linting, and tsup bundling.
2. Port core DTOs/interfaces (foods, recipes, NLP) plus shared enums/constants, ideally factoring out schemas that Strapi already defined.
3. Define transport/auth abstractions referencing both the Dart bearer-token flow and the Strapi OAuth1 workflow so downstream implementations slot in without rewriting method signatures.

