import type { FatSecretEnvironment } from "./config";
import { DEFAULT_ENVIRONMENT } from "./config";
import type { HttpClient } from "./http";
import { FetchHttpClient } from "./http";
import type { SupportedAuthProvider, FatSecretAuthStrategy } from "./auth";
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
} from "./types";
import { NotImplementedError } from "./utils/errors";

export interface FatSecretClientOptions {
  auth: SupportedAuthProvider;
  environment?: FatSecretEnvironment;
  httpClient?: HttpClient;
}

export type { FatSecretAuthStrategy } from "./auth";

export class FatSecretNutritionClient {
  private readonly http: HttpClient;
  private readonly env: FatSecretEnvironment;

  constructor(private readonly options: FatSecretClientOptions) {
    this.env = options.environment ?? DEFAULT_ENVIRONMENT;
    this.http = options.httpClient ?? new FetchHttpClient();
  }

  get strategy(): FatSecretAuthStrategy {
    return this.options.auth.strategy;
  }

  /**
   * Mirrors Dart `search` (foods.search.v3).
   */
  async search(
    _props: FoodSearchV3Request,
  ): Promise<FoodSearchV3Response | null> {
    throw new NotImplementedError("search");
  }

  /**
   * Mirrors Dart `getById` (food.get.v4).
   */
  async getById(
    _props: FoodGetByIdRequest,
  ): Promise<FoodGetByIdResponse | null> {
    throw new NotImplementedError("getById");
  }

  async foodFindIdForBarcode(
    _props: FoodFindIdForBarcodeRequest,
  ): Promise<FoodFindIdForBarcodeResponse | null> {
    throw new NotImplementedError("foodFindIdForBarcode");
  }

  async autoComplete(
    _props: FoodAutoCompleteV2Request,
  ): Promise<FoodAutoCompleteV2Response | null> {
    throw new NotImplementedError("autoComplete");
  }

  async searchBrands(
    _props: FoodBrandsGetAllV2Request,
  ): Promise<FoodBrandsGetAllV2Response | null> {
    throw new NotImplementedError("searchBrands");
  }

  async getFoodCategories(
    _props?: FoodCategoriesGetAllV2Request,
  ): Promise<FoodCategoriesGetAllV2Response | null> {
    throw new NotImplementedError("getFoodCategories");
  }

  async getFoodSubCategories(
    _props: FoodSubCategoriesGetV2Request,
  ): Promise<FoodSubCategoriesGetV2Response | null> {
    throw new NotImplementedError("getFoodSubCategories");
  }

  async searchRecipes(
    _props: RecipeSearchRequest,
  ): Promise<RecipeSearchResponse | null> {
    throw new NotImplementedError("searchRecipes");
  }

  async getRecipeById(
    _props: RecipeGetByIdRequest,
  ): Promise<RecipeGetByIdResponse | null> {
    throw new NotImplementedError("getRecipeById");
  }

  async getRecipeTypes(): Promise<RecipeTypesResponse | null> {
    throw new NotImplementedError("getRecipeTypes");
  }

  async processNaturalLanguage(
    _props: NaturalLanguageProcessingRequest,
  ): Promise<NaturalLanguageProcessingResponse | null> {
    throw new NotImplementedError("processNaturalLanguage");
  }

  async imageRecognitionV2(
    _props: ImageRecognitionRequest,
  ): Promise<ImageRecognitionResponse | null> {
    throw new NotImplementedError("imageRecognitionV2");
  }
}
