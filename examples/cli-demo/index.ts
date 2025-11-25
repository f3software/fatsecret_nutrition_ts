import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  FatSecretNutritionClient,
  createNodeAdapters,
  DEFAULT_ENVIRONMENT,
  type FatSecretEnvironment,
  type FatSecretClientOptions
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

type Strategy = "client-credentials" | "oauth1";

interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scopes?: string;
}

interface OAuth1EnvConfig {
  consumerKey: string;
  consumerSecret: string;
  accessToken?: string;
  accessTokenSecret?: string;
}

interface ExampleConfig {
  strategy: Strategy;
  oauth2?: OAuth2Config;
  oauth1?: OAuth1EnvConfig;
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
    auth: buildAuth(cfg),
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
  const strategy =
    (process.env.FATSECRET_AUTH_STRATEGY as Strategy | undefined) ??
    "client-credentials";

  if (strategy === "client-credentials") {
    const required = [
      "FATSECRET_CLIENT_ID",
      "FATSECRET_CLIENT_SECRET",
      "FATSECRET_TOKEN_URL"
    ] as const;

    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(
          `${key} missing. Copy env.example to .env and update credentials.`
        );
      }
    }

    return {
      strategy,
      oauth2: {
        clientId: process.env.FATSECRET_CLIENT_ID!,
        clientSecret: process.env.FATSECRET_CLIENT_SECRET!,
        tokenUrl: process.env.FATSECRET_TOKEN_URL!,
        scopes: process.env.FATSECRET_SCOPES,
      },
      apiUrl: process.env.FATSECRET_API_URL,
      imageUrl: process.env.FATSECRET_IMAGE_URL,
      nlpUrl: process.env.FATSECRET_NLP_URL
    };
  }

  const oauth1Keys = ["FATSECRET_CONSUMER_KEY", "FATSECRET_CONSUMER_SECRET"] as const;
  for (const key of oauth1Keys) {
    if (!process.env[key]) {
      throw new Error(
        `${key} missing. Provide OAuth1 credentials or switch strategy back to client-credentials.`
      );
    }
  }

  return {
    strategy,
    oauth1: {
      consumerKey: process.env.FATSECRET_CONSUMER_KEY!,
      consumerSecret: process.env.FATSECRET_CONSUMER_SECRET!,
      accessToken: process.env.FATSECRET_ACCESS_TOKEN,
      accessTokenSecret: process.env.FATSECRET_ACCESS_TOKEN_SECRET
    },
    apiUrl: process.env.FATSECRET_API_URL,
    imageUrl: process.env.FATSECRET_IMAGE_URL,
    nlpUrl: process.env.FATSECRET_NLP_URL
  };
}

function buildAuth(cfg: ExampleConfig): FatSecretClientOptions["auth"] {
  if (cfg.strategy === "client-credentials") {
    if (!cfg.oauth2) {
      throw new Error("OAuth2 configuration missing");
    }
    return {
      strategy: "client-credentials",
      config: cfg.oauth2
    };
  }

  if (!cfg.oauth1) {
    throw new Error("OAuth1 configuration missing");
  }

  return {
    strategy: "oauth1",
    config: cfg.oauth1
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
  if (cfg.strategy === "client-credentials" && cfg.oauth2?.tokenUrl) {
    overrides.oauthBaseUrl = cfg.oauth2.tokenUrl;
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

