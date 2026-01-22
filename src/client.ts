import type { FatSecretEnvironment } from "./config";
import { DEFAULT_ENVIRONMENT } from "./config";
import type { HttpClient } from "./http";
import { FetchHttpClient } from "./http";
import type { SupportedAuthProvider, FatSecretAuthStrategy } from "./auth";
import { AuthManager } from "./auth";
import { ApiService } from "./service/api-service";
import {
  type FoodSearchV3Request,
  type FoodSearchV3Response,
  type FoodFindIdForBarcodeRequest,
  type FoodFindIdForBarcodeResponse,
  type FoodGetByIdRequest,
  type FoodGetByIdResponse,
  type FoodAutoCompleteV2Request,
  type FoodAutoCompleteV2Response,
  type FoodBrandsGetAllV2Request,
  type FoodBrandsGetAllV2Response,
  type FoodCategoriesGetAllV2Request,
  type FoodCategoriesGetAllV2Response,
  type FoodSubCategoriesGetV2Request,
  type FoodSubCategoriesGetV2Response,
  type RecipeSearchRequest,
  type RecipeSearchResponse,
  type RecipeGetByIdRequest,
  type RecipeGetByIdResponse,
  type RecipeTypesResponse,
  type NaturalLanguageProcessingRequest,
  type NaturalLanguageProcessingResponse,
  type ImageRecognitionRequest,
  type ImageRecognitionResponse,
  FatSecretMethod,
} from "./types";
import type { PlatformAdapterBundle } from "./platform";
import { createDefaultPlatformAdapters } from "./platform";

export interface FatSecretClientOptions {
  auth: SupportedAuthProvider;
  environment?: FatSecretEnvironment;
  httpClient?: HttpClient;
  platformAdapters?: PlatformAdapterBundle;
}

export type { FatSecretAuthStrategy } from "./auth";

export class FatSecretNutritionClient {
  private readonly http: HttpClient;
  private readonly env: FatSecretEnvironment;
  private readonly adapters: PlatformAdapterBundle;
  private readonly authManager: AuthManager;
  private readonly apiService: ApiService;

  constructor(private readonly options: FatSecretClientOptions) {
    this.env = options.environment ?? DEFAULT_ENVIRONMENT;
    this.http = options.httpClient ?? new FetchHttpClient();
    this.adapters = options.platformAdapters ?? createDefaultPlatformAdapters();
    this.authManager = new AuthManager(
      options.auth,
      this.http,
      this.adapters,
      this.env.oauthBaseUrl,
    );
    this.apiService = new ApiService({
      http: this.http,
      environment: this.env,
      authManager: this.authManager,
    });
  }

  get strategy(): FatSecretAuthStrategy {
    return this.options.auth.strategy;
  }

  /**
   * Mirrors Dart `search` (foods.search.v3).
   */
  async search(
    props: FoodSearchV3Request,
  ): Promise<FoodSearchV3Response | null> {
    return this.safeCall(() =>
      this.apiService.callMethod<FoodSearchV3Response>(
        FatSecretMethod.FoodsSearchV3,
        this.toQuery(props),
      ),
    );
  }

  /**
   * Mirrors Dart `getById` (food.get.v4).
   */
  async getById(
    props: FoodGetByIdRequest,
  ): Promise<FoodGetByIdResponse | null> {
    return this.safeCall(() =>
      this.apiService.callMethod<FoodGetByIdResponse>(
        "food.get.v4",
        this.toQuery(props),
      ),
    );
  }

  async foodFindIdForBarcode(
    props: FoodFindIdForBarcodeRequest,
  ): Promise<FoodFindIdForBarcodeResponse | null> {
    return this.safeCall(() =>
      this.apiService.callMethod<FoodFindIdForBarcodeResponse>(
        FatSecretMethod.FoodFindIdForBarcode,
        this.toQuery(props),
      ),
    );
  }

  async autoComplete(
    props: FoodAutoCompleteV2Request,
  ): Promise<FoodAutoCompleteV2Response | null> {
    return this.safeCall(() =>
      this.apiService.callMethod<FoodAutoCompleteV2Response>(
        FatSecretMethod.FoodsAutocompleteV2,
        this.toQuery(props),
      ),
    );
  }

  async searchBrands(
    props: FoodBrandsGetAllV2Request,
  ): Promise<FoodBrandsGetAllV2Response | null> {
    return this.safeCall(() =>
      this.apiService.callMethod<FoodBrandsGetAllV2Response>(
        FatSecretMethod.FoodBrandsGetAllV2,
        this.toQuery(props),
      ),
    );
  }

  async getFoodCategories(
    props?: FoodCategoriesGetAllV2Request,
  ): Promise<FoodCategoriesGetAllV2Response | null> {
    return this.safeCall(() =>
      this.apiService.callMethod<FoodCategoriesGetAllV2Response>(
        FatSecretMethod.FoodCategoriesGetAllV2,
        this.toQuery(props ?? {}),
      ),
    );
  }

  async getFoodSubCategories(
    props: FoodSubCategoriesGetV2Request,
  ): Promise<FoodSubCategoriesGetV2Response | null> {
    return this.safeCall(() =>
      this.apiService.callMethod<FoodSubCategoriesGetV2Response>(
        FatSecretMethod.FoodSubCategoriesGetV2,
        this.toQuery(props),
      ),
    );
  }

  async searchRecipes(
    props: RecipeSearchRequest,
  ): Promise<RecipeSearchResponse | null> {
    return this.safeCall(() =>
      this.apiService.callMethod<RecipeSearchResponse>(
        FatSecretMethod.RecipesSearchV3,
        this.toQuery(props),
      ),
    );
  }

  async getRecipeById(
    props: RecipeGetByIdRequest,
  ): Promise<RecipeGetByIdResponse | null> {
    return this.safeCall(() =>
      this.apiService.callMethod<RecipeGetByIdResponse>(
        FatSecretMethod.RecipesGetByIdV2,
        this.toQuery(props),
      ),
    );
  }

  async getRecipeTypes(): Promise<RecipeTypesResponse | null> {
    return this.safeCall(() =>
      this.apiService.callMethod<RecipeTypesResponse>(
        FatSecretMethod.RecipeTypesGetV2,
      ),
    );
  }

  async processNaturalLanguage(
    props: NaturalLanguageProcessingRequest,
  ): Promise<NaturalLanguageProcessingResponse | null> {
    return this.safeCall(() =>
      this.apiService.postJson<NaturalLanguageProcessingResponse>(
        this.env.naturalLanguageProcessingUrl,
        this.toJson(props),
      ),
    );
  }

  async imageRecognitionV2(
    props: ImageRecognitionRequest,
  ): Promise<ImageRecognitionResponse | null> {
    return this.safeCall(() =>
      this.apiService.postJson<ImageRecognitionResponse>(
        this.env.imageRecognitionUrl,
        this.toJson(props),
      ),
    );
  }

  private async safeCall<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      // Always log errors in test environment or when silent mode is disabled
      const isSilent = process.env.FATSECRET_TS_SILENT_ERRORS === "1";
      const isTest =
        process.env.NODE_ENV === "test" ||
        process.env.JEST_WORKER_ID !== undefined;

      if (!isSilent || isTest) {
        const errorDetails =
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : { error };
        console.error("FatSecret request failed:", errorDetails);
      }
      return null;
    }
  }

  private toQuery<T extends object>(
    params: T | undefined,
  ): Record<string, QueryValue> {
    const source = (params ?? {}) as Record<string, QueryValue>;
    return Object.entries(source).reduce<Record<string, QueryValue>>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value as QueryValue;
        }
        return acc;
      },
      {},
    );
  }

  private toJson<T extends object>(payload: T): Record<string, unknown> {
    return { ...((payload ?? {}) as Record<string, unknown>) };
  }
}

type QueryValue = string | number | boolean | undefined;
