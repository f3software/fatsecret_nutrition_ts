# FatSecret CLI Demo

Run a subset of the FatSecret Nutrition API calls using the TypeScript client.

## Setup
1. Copy `examples/cli-demo/env.example` to one of the following:
   - project root `.env` or `.env.local`
   - `examples/cli-demo/.env.local`
2. Set `FATSECRET_AUTH_STRATEGY` to either:
   - `client-credentials` (supply client ID/secret + token URL), or
   - `oauth1` (supply consumer key/secret and optional access token/secret).
3. Fill in any optional overrides (API URL, image/NLP endpoints) if needed.
4. Install dependencies in the repo root: `npm install` (or `yarn install`).

## Run

```bash
npm run example
# or
yarn example
```

The script issues `foods.autocomplete.v2`, `foods.search.v3`, `food.find_id_for_barcode`, and `food_categories.get.v2` requests and logs the responses. Real network calls are made—be mindful of your FatSecret rate limits.

> **Scopes:** some endpoints require premium scopes (`premier`, `barcode`, etc.). If you see “Missing scope” errors, request those scopes for your FatSecret application before rerunning the demo.

