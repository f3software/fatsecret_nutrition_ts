import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  FatSecretNutritionClient,
  createNodeAdapters,
  DEFAULT_ENVIRONMENT,
  type FatSecretEnvironment
} from "../../src";
import type {
  FoodAutoCompleteV2Response,
  FoodSearchV3Response,
  FoodFindIdForBarcodeResponse,
  FoodCategoriesGetAllV2Response
} from "../../src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

bootstrapEnv();

interface ExampleConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  apiUrl?: string;
  imageUrl?: string;
  nlpUrl?: string;
}

type StepResponse =
  | FoodAutoCompleteV2Response
  | FoodSearchV3Response
  | FoodFindIdForBarcodeResponse
  | FoodCategoriesGetAllV2Response
  | null;

interface StepConfig {
  label: string;
  run: () => Promise<StepResponse>;
  requiredScopes?: string[];
}

async function main() {
  const cfg = getConfig();
  const environment = buildEnvironment(cfg);

  const client = new FatSecretNutritionClient({
    auth: {
      strategy: "client-credentials",
      config: {
        clientId: cfg.clientId,
        clientSecret: cfg.clientSecret,
        tokenUrl: cfg.tokenUrl
      }
    },
    environment,
    platformAdapters: createNodeAdapters()
  });

  const steps: StepConfig[] = [
    {
      label: "foods.autocomplete.v2",
      requiredScopes: ["premier"],
      run: () => client.autoComplete({ expression: "apple" })
    },
    {
      label: "foods.search.v3",
      requiredScopes: ["premier"],
      run: () =>
        client.search({
          searchExpression: "apple",
          maxResults: 3,
          pageNumber: 0
        })
    },
    {
      label: "food.find_id_for_barcode",
      requiredScopes: ["barcode"],
      run: () =>
        client.foodFindIdForBarcode({
          barcode: "013562000103"
        })
    },
    {
      label: "food_categories.get.v2",
      requiredScopes: ["premier"],
      run: () => client.getFoodCategories()
    }
  ];

  for (const step of steps) {
    await runStep(step);
  }
}

async function runStep(step: StepConfig) {
  process.stdout.write(`\n▸ ${step.label} ... `);
  try {
    const result = await step.run();
    if (!result) {
      console.log("no data returned");
      return;
    }
    console.log("success");
    console.dir(result, { depth: 2, colors: true });
  } catch (error) {
    const message = (error as Error).message;
    console.error(`failed (${message})`);
    if (message.includes("Missing scope") && step.requiredScopes?.length) {
      console.warn(
        `  ↳ Request the following FatSecret scopes for your app: ${step.requiredScopes.join(
          ", "
        )}`
      );
    }
  }
}

function bootstrapEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(__dirname, ".env"),
    path.resolve(__dirname, ".env.local")
  ];

  for (const candidate of candidates) {
    loadEnv({ path: candidate, override: false });
  }
  loadEnv({ override: false });
}

function getConfig(): ExampleConfig {
  const required = [
    "FATSECRET_CLIENT_ID",
    "FATSECRET_CLIENT_SECRET",
    "FATSECRET_TOKEN_URL"
  ] as const;

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(
        `${key} missing. Copy examples/cli-demo/env.example to .env and update credentials.`
      );
    }
  }

  return {
    clientId: process.env.FATSECRET_CLIENT_ID!,
    clientSecret: process.env.FATSECRET_CLIENT_SECRET!,
    tokenUrl: process.env.FATSECRET_TOKEN_URL!,
    apiUrl: process.env.FATSECRET_API_URL,
    imageUrl: process.env.FATSECRET_IMAGE_URL,
    nlpUrl: process.env.FATSECRET_NLP_URL
  };
}

function buildEnvironment(cfg: ExampleConfig): FatSecretEnvironment {
  const overrides: Partial<FatSecretEnvironment> = {};
  if (cfg.apiUrl) {
    overrides.apiBaseUrl = cfg.apiUrl;
  }
  if (cfg.imageUrl) {
    overrides.imageRecognitionUrl = cfg.imageUrl;
  }
  if (cfg.tokenUrl) {
    overrides.oauthBaseUrl = cfg.tokenUrl;
  }
  if (cfg.nlpUrl) {
    overrides.naturalLanguageProcessingUrl = cfg.nlpUrl;
  }
  return { ...DEFAULT_ENVIRONMENT, ...overrides };
}

main().catch((error) => {
  console.error("Example failed:", error);
  process.exit(1);
});

