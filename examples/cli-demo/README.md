# FatSecret CLI Demo

Run a subset of the FatSecret Nutrition API calls using the TypeScript client.

## Setup
1. Copy `examples/cli-demo/env.example` to one of the following:
   - project root `.env` or `.env.local`
   - `examples/cli-demo/.env.local`
2. Fill in your real FatSecret credentials (client ID, client secret, token URL and API base URL).
3. Install dependencies in the repo root: `npm install` (or `yarn install`).

## Run

```bash
npm run example
# or
yarn example
```

The script issues `foods.autocomplete.v2`, `foods.search.v3`, `food.find_id_for_barcode`, and `food_categories.get.v2` requests and logs the responses. Real network calls are made—be mindful of your FatSecret rate limits.

> **Scopes:** some endpoints require premium scopes (`premier`, `barcode`, etc.). If you see “Missing scope” errors, request those scopes for your FatSecret application before rerunning the demo.

