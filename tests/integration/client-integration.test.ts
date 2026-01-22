/**
 * Integration tests for FatSecretNutritionClient
 *
 * These tests mirror the Dart package tests in:
 * fatsecret_nutrition_dart/test/src/fatsecret_nutrition_test.dart
 *
 * Prerequisites:
 * - Copy .env.example to .env and fill in your FatSecret API credentials
 * - Run with: yarn test:integration
 */

import { config } from "dotenv";
import path from "node:path";
import {
  FatSecretNutritionClient,
  createNodeAdapters,
  DEFAULT_ENVIRONMENT,
  type FatSecretEnvironment,
} from "../../src";
import {
  TEST_BASE64_IMAGE,
  EXPECTED_K_RESTAURANT_BRANDS,
  EXPECTED_RECIPE_TYPES,
} from "./test-fixtures";

// Load environment variables from multiple locations
config({ path: path.resolve(__dirname, ".env") });
config({ path: path.resolve(__dirname, ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ override: false });

// Suppress error logging during tests
process.env.FATSECRET_TS_SILENT_ERRORS = "1";

// Check for required environment variables
const requiredEnvVars = [
  "FATSECRET_CLIENT_ID",
  "FATSECRET_CLIENT_SECRET",
  "FATSECRET_TOKEN_URL",
];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
const hasCredentials = missingEnvVars.length === 0;

// Helper to create a client with valid credentials
function createValidClient(): FatSecretNutritionClient {
  const environment: FatSecretEnvironment = {
    ...DEFAULT_ENVIRONMENT,
    oauthBaseUrl: process.env.FATSECRET_TOKEN_URL!,
  };

  if (process.env.FATSECRET_API_URL) {
    environment.apiBaseUrl = process.env.FATSECRET_API_URL;
  }
  if (process.env.FATSECRET_IMAGE_URL) {
    environment.imageRecognitionUrl = process.env.FATSECRET_IMAGE_URL;
  }
  if (process.env.FATSECRET_NLP_URL) {
    environment.naturalLanguageProcessingUrl = process.env.FATSECRET_NLP_URL;
  }

  const scopes =
    process.env.FATSECRET_SCOPES ||
    "barcode basic image-recognition nlp premier";
  return new FatSecretNutritionClient({
    auth: {
      strategy: "client-credentials",
      config: {
        clientId: process.env.FATSECRET_CLIENT_ID!,
        clientSecret: process.env.FATSECRET_CLIENT_SECRET!,
        tokenUrl: process.env.FATSECRET_TOKEN_URL!,
        // Request premier scope for methods that require it (brands, categories, etc.)
        scopes,
      },
    },
    environment,
    platformAdapters: createNodeAdapters(),
  });
}

// Helper to create a client with bad credentials (for failure tests)
function createBadClient(): FatSecretNutritionClient {
  return new FatSecretNutritionClient({
    auth: {
      strategy: "client-credentials",
      config: {
        clientId: "BAD_CLIENT_ID",
        clientSecret: "BAD_CLIENT_SECRET",
        tokenUrl: "BAD_TOKEN_URL",
      },
    },
    environment: {
      ...DEFAULT_ENVIRONMENT,
      apiBaseUrl: "BAD_API_URL",
    },
    platformAdapters: createNodeAdapters(),
  });
}

// Create SDK instances
let sdk: FatSecretNutritionClient;

beforeAll(() => {
  if (hasCredentials) {
    sdk = createValidClient();
  }
});

// Skip integration tests if credentials are not available
const describeWithCredentials = hasCredentials ? describe : describe.skip;

if (!hasCredentials) {
  console.warn(
    `⚠️  Skipping integration tests - missing environment variables: ${missingEnvVars.join(", ")}`,
  );
  console.warn(
    "   Copy .env.example to .env and fill in your FatSecret API credentials",
  );
}

describe("FatSecretNutritionClient", () => {
  it("can be instantiated", () => {
    const client = new FatSecretNutritionClient({
      auth: {
        strategy: "client-credentials",
        config: {
          clientId: "clientId",
          clientSecret: "clientSecret",
          tokenUrl: "tokenUrl",
        },
      },
    });
    expect(client).not.toBeNull();
    expect(client).toBeDefined();
  });

  describeWithCredentials("searchBrands", () => {
    let badClient: FatSecretNutritionClient;

    beforeEach(() => {
      badClient = createBadClient();
    });

    it("should return null when API call fails", async () => {
      const result = await badClient.searchBrands({
        starts_with: "k",
        brand_type: "restaurant",
      });
      expect(result).toBeNull();
    });

    it("should return brand list when API call succeeds", async () => {
      const result = await sdk.searchBrands({
        starts_with: "k",
        brand_type: "restaurant",
      });

      expect(result).not.toBeNull();
      // Handle both 'brand' and 'food_brand' field names, and normalize to array
      const brands =
        result?.food_brands?.brand ?? result?.food_brands?.food_brand;
      const brandArray = Array.isArray(brands)
        ? brands
        : brands
          ? [brands]
          : [];
      expect(brandArray.length).toBeGreaterThanOrEqual(19); // At least 19 brands

      // Extract brand names - handle both object format {brand_name: string} and string format
      const brandNames = brandArray.map((b) => {
        if (typeof b === "string") return b;
        if (typeof b === "object" && b !== null) {
          return (
            (b as { brand_name?: string; name?: string }).brand_name ??
            (b as { brand_name?: string; name?: string }).name ??
            String(b)
          );
        }
        return String(b);
      });

      // Verify first 19 brand names match expected (allowing for some flexibility)
      for (
        let i = 0;
        i < Math.min(EXPECTED_K_RESTAURANT_BRANDS.length, brandNames.length);
        i++
      ) {
        expect(brandNames[i]).toBe(EXPECTED_K_RESTAURANT_BRANDS[i]);
      }
    });
  });

  describeWithCredentials("getFoodCategories", () => {
    let badClient: FatSecretNutritionClient;

    beforeEach(() => {
      badClient = createBadClient();
    });

    it("should return null when API call fails", async () => {
      const result = await badClient.getFoodCategories({
        region: "US",
        language: "en",
      });
      expect(result).toBeNull();
    });

    it("should return food categories when API call succeeds", async () => {
      const result = await sdk.getFoodCategories({
        region: "US",
        language: "en",
      });

      expect(result).not.toBeNull();
      expect(result?.food_categories.food_category.length).toBeGreaterThan(0);

      const firstCategory = result?.food_categories.food_category[0];
      expect(firstCategory?.food_category_id).toBeDefined();
      expect(firstCategory?.food_category_name).toBeDefined();
    });
  });

  describeWithCredentials("getFoodSubCategories", () => {
    let badClient: FatSecretNutritionClient;

    beforeEach(() => {
      badClient = createBadClient();
    });

    it("should return null when API call fails", async () => {
      const result = await badClient.getFoodSubCategories({
        food_category_id: "3",
      });
      expect(result).toBeNull();
    });

    it("should return food sub-categories when API call succeeds", async () => {
      const result = await sdk.getFoodSubCategories({
        food_category_id: "3",
      });

      expect(result).not.toBeNull();
      expect(
        result?.food_sub_categories?.food_sub_category?.length ?? 0,
      ).toBeGreaterThan(0);
      expect(result?.food_sub_categories?.food_sub_category?.[0]).toBeDefined();
    });
  });
});

describeWithCredentials("Recipe Methods", () => {
  describe("getRecipeById", () => {
    it("returns recipe details", async () => {
      const response = await sdk.getRecipeById({
        recipe_id: "91", // Baked Lemon Snapper recipe
      });

      expect(response).not.toBeNull();
      expect(response?.recipe.recipe_id).toBe("91");
      expect(response?.recipe.recipe_name).toBe("Baked Lemon Snapper");
      expect(response?.recipe.recipe_description).toBeTruthy();
      expect(response?.recipe.number_of_servings).toBeTruthy();
      expect(response?.recipe.grams_per_portion).toBeTruthy();
      expect(
        response?.recipe.recipe_types?.recipe_type?.length,
      ).toBeGreaterThan(0);
      expect(
        response?.recipe.recipe_categories?.recipe_category?.length,
      ).toBeGreaterThan(0);
      expect(response?.recipe.ingredients?.ingredient.length).toBeGreaterThan(
        0,
      );
      expect(response?.recipe.directions?.direction.length).toBeGreaterThan(0);
      expect(response?.recipe.serving_sizes?.serving?.calories).toBeDefined();
    });
  });

  describe("searchRecipes", () => {
    it("returns recipe search results", async () => {
      const response = await sdk.searchRecipes({
        search_expression: "chocolate",
        max_results: 5,
        page_number: 0,
        include_recipe_images: true,
      });

      expect(response).not.toBeNull();
      expect(response?.recipes?.recipe?.length).toBeGreaterThan(0);
      expect(response?.recipes?.max_results).toBe("5");
      expect(response?.recipes?.page_number).toBe("0");
      expect(response?.recipes?.total_results).toBeTruthy();

      const recipe = response?.recipes?.recipe?.[0];
      expect(recipe?.recipe_id).toBeTruthy();
      expect(recipe?.recipe_name).toBeTruthy();
      expect(recipe?.recipe_description).toBeTruthy();
      // recipe_image is optional - only check if include_recipe_images was true
      if (recipe?.recipe_image !== undefined) {
        expect(recipe.recipe_image).toBeTruthy();
      }
      expect(recipe?.recipe_ingredients?.ingredient?.length).toBeGreaterThan(0);
      expect(recipe?.recipe_nutrition?.calories).toBeTruthy();
      expect(recipe?.recipe_types?.recipe_type?.length).toBeGreaterThan(0);
    });

    it("with filters returns filtered results", async () => {
      const response = await sdk.searchRecipes({
        search_expression: "chicken",
        max_results: 3,
        page_number: 0,
        include_recipe_images: true,
      });

      expect(response).not.toBeNull();
      expect(response?.recipes?.recipe?.length).toBeGreaterThan(0);
      expect(response?.recipes?.max_results).toBe("3");

      // Verify each recipe has nutrition data
      for (const recipe of response?.recipes?.recipe ?? []) {
        const calories = parseFloat(recipe.recipe_nutrition?.calories ?? "0");
        expect(calories).toBeGreaterThan(0);
      }
    });
  });

  describe("getRecipeTypes", () => {
    let badClient: FatSecretNutritionClient;

    beforeEach(() => {
      badClient = createBadClient();
    });

    it("should return null when API call fails", async () => {
      const result = await badClient.getRecipeTypes();
      expect(result).toBeNull();
    });

    it("should return recipe types when API call succeeds", async () => {
      const result = await sdk.getRecipeTypes();

      expect(result).not.toBeNull();
      expect(result?.recipe_types.recipe_type.length).toBeGreaterThan(0);

      // Extract type names (handles both string and object formats)
      const typeNames = result?.recipe_types.recipe_type.map((t) =>
        typeof t === "string" ? t : t.recipe_type,
      );

      for (const expected of EXPECTED_RECIPE_TYPES) {
        expect(typeNames).toContain(expected);
      }
    });
  });
});

describeWithCredentials("Natural Language Processing Tests", () => {
  let badClient: FatSecretNutritionClient;

  beforeEach(() => {
    badClient = createBadClient();
  });

  it("should return null when API call fails", async () => {
    const result = await badClient.processNaturalLanguage({
      user_input:
        "A toast with ham and cheese, an apple, a banana and a cappuccino",
    });
    expect(result).toBeNull();
  });

  it("should process natural language input successfully", async () => {
    const result = await sdk.processNaturalLanguage({
      user_input:
        "A toast with ham and cheese, an apple, a banana and a cappuccino",
    });

    expect(result).not.toBeNull();
    expect(result?.food_response?.length).toBeGreaterThan(0);

    const food = result?.food_response?.[0];
    expect(food?.food_id).toBeDefined();
    expect(food?.food_entry_name).toBeDefined();
    expect(food?.eaten?.food_name_singular).toBeDefined();
    expect(food?.eaten?.food_name_plural).toBeDefined();
    expect(food?.eaten?.total_nutritional_content?.calories).toBeDefined();
    expect(food?.suggested_serving?.serving_description).toBeDefined();
  });
});

describeWithCredentials("Image Recognition Tests", () => {
  let badClient: FatSecretNutritionClient;

  beforeEach(() => {
    badClient = createBadClient();
  });

  it("should return null when API call fails", async () => {
    const result = await badClient.imageRecognitionV2({
      image_b64: "invalid_base64",
    });
    expect(result).toBeNull();
  });

  it("should process image recognition successfully", async () => {
    const result = await sdk.imageRecognitionV2({
      image_b64: TEST_BASE64_IMAGE,
      region: "US",
      language: "en",
      include_food_data: true,
    });

    // The API may return an empty list for a test image, but call should succeed
    expect(result).not.toBeNull();

    // If the API returns food_response, check its type
    if (result?.food_response) {
      expect(Array.isArray(result.food_response)).toBe(true);
    }
  });
});
