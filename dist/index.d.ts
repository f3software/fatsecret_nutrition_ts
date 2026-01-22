interface FatSecretEnvironment {
    apiBaseUrl: string;
    oauthBaseUrl: string;
    imageRecognitionUrl: string;
    naturalLanguageProcessingUrl: string;
}
declare const FATSECRET_PROD: FatSecretEnvironment;
declare const DEFAULT_ENVIRONMENT: FatSecretEnvironment;

type PlatformTarget = "web" | "react-native" | "node";
interface PlatformConfig {
    target: PlatformTarget;
    userAgent?: string;
}
declare const detectPlatform: () => PlatformTarget;

type HttpMethod = 'GET' | 'POST';
interface HttpRequest {
    method: HttpMethod;
    url: string;
    query?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
    body?: Record<string, unknown> | string | URLSearchParams;
}
interface HttpResponse<T = unknown> {
    status: number;
    data: T;
    headers: Record<string, string>;
}
interface HttpClient {
    send<T>(request: HttpRequest): Promise<HttpResponse<T>>;
}

declare class FetchHttpClient implements HttpClient {
    send<T>(request: HttpRequest): Promise<HttpResponse<T>>;
}

interface ClientCredentialsConfig {
    clientId: string;
    clientSecret: string;
    tokenUrl?: string;
    scopes?: string | string[];
}
interface OAuth1Config {
    consumerKey: string;
    consumerSecret: string;
    accessToken?: string;
    accessTokenSecret?: string;
}
type FatSecretAuthStrategy = "client-credentials" | "oauth1";
interface AuthProvider {
    strategy: FatSecretAuthStrategy;
}
interface ClientCredentialsProvider extends AuthProvider {
    strategy: "client-credentials";
    config: ClientCredentialsConfig;
}
interface OAuth1Provider extends AuthProvider {
    strategy: "oauth1";
    config: OAuth1Config;
}
type SupportedAuthProvider = ClientCredentialsProvider | OAuth1Provider;

interface StorageAdapter {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}
interface CryptoAdapter {
    randomBytes(length: number): Promise<Uint8Array>;
    hmacSha1(key: string, baseString: string): Promise<string>;
    base64Encode(input: Uint8Array | string): string;
}
interface PlatformAdapterBundle {
    target: PlatformTarget;
    storage: StorageAdapter;
    crypto: CryptoAdapter;
    httpClient?: HttpClient;
}

declare const createMemoryStorageAdapter: () => StorageAdapter;
declare const createNodeAdapters: () => PlatformAdapterBundle;
declare const createWebAdapters: () => PlatformAdapterBundle;
declare const createReactNativeAdapters: (options: {
    storage: StorageAdapter;
    crypto: CryptoAdapter;
    httpClient?: HttpClient;
}) => PlatformAdapterBundle;
declare const createDefaultPlatformAdapters: () => PlatformAdapterBundle;

interface AuthRequestContext {
    method: HttpMethod;
    url: string;
    query?: Record<string, string>;
}
interface AuthResult {
    headers?: Record<string, string>;
    query?: Record<string, string>;
}
declare class AuthManager {
    private readonly provider;
    private readonly http;
    private clientCredentials?;
    private oauth1Signer?;
    private storage;
    private crypto;
    constructor(provider: SupportedAuthProvider, http: HttpClient, adapters: PlatformAdapterBundle, defaultTokenUrl?: string);
    getAuth(context: AuthRequestContext): Promise<AuthResult>;
}

interface CachedToken {
    token: string;
    expiresAt: number;
}
declare class TokenCache {
    private readonly storage;
    private readonly key;
    constructor(storage: StorageAdapter, key: string);
    get(): Promise<CachedToken | null>;
    set(token: string, expiresInSeconds: number): Promise<void>;
    clear(): Promise<void>;
}

declare class ClientCredentialsAuthenticator {
    private readonly config;
    private readonly http;
    private readonly cache;
    constructor(config: ClientCredentialsConfig, http: HttpClient, cache: TokenCache);
    getAccessToken(): Promise<string>;
    private fetchToken;
    private encodeCredentials;
    private normalizeScopes;
}

interface OAuth1Params {
    oauth_consumer_key: string;
    oauth_signature_method: string;
    oauth_timestamp: string;
    oauth_nonce: string;
    oauth_version: string;
    oauth_signature?: string;
    oauth_token?: string;
}
interface OAuth1RequestConfig {
    method: string;
    url: string;
    params?: Record<string, string>;
}
declare class OAuth1Signer {
    private readonly config;
    private readonly crypto;
    constructor(config: OAuth1Config, crypto: CryptoAdapter);
    generateParams(request: OAuth1RequestConfig): Promise<Record<string, string>>;
    buildAuthorizationHeader(params: Record<string, string>): string;
    private generateNonce;
    private sign;
    private createSignatureBaseString;
}
declare function percentEncode(value: string): string;

type Nullable<T> = T | null | undefined;
type NumericString = `${number}` | number;
interface FoodImage {
    image_url: string;
    image_type: string;
}
interface FoodImages {
    food_image: FoodImage[];
}
interface Serving {
    serving_id?: string;
    serving_description?: string;
    serving_url?: string;
    measurement_description?: string;
    number_of_units?: NumericString;
    metric_serving_amount?: NumericString;
    metric_serving_unit?: string;
    calories?: NumericString;
    carbohydrate?: NumericString;
    fat?: NumericString;
    protein?: NumericString;
    fiber?: NumericString;
    sugar?: NumericString;
    sodium?: NumericString;
    potassium?: NumericString;
    saturated_fat?: NumericString;
    monounsaturated_fat?: NumericString;
    polyunsaturated_fat?: NumericString;
    cholesterol?: NumericString;
    vitamin_a?: NumericString;
    vitamin_c?: NumericString;
    calcium?: NumericString;
    iron?: NumericString;
    flag_default_serving?: Nullable<boolean | string>;
}
interface Servings {
    serving: Serving[];
}
interface Food {
    food_id?: string;
    food_name?: string;
    food_type?: string;
    food_url?: string;
    food_images?: FoodImages;
    servings?: Servings;
}
interface ValueWrapper {
    value: string;
}

interface FoodSearchV3Request {
    search_expression?: string;
    page_number?: number;
    max_results?: number;
    include_sub_categories?: boolean;
    include_food_images?: boolean;
    include_food_attributes?: boolean;
    flag_default_serving?: boolean;
    region?: string;
    language?: string;
    format?: "json" | "xml";
}
interface FoodList {
    food: Food[];
}
interface FoodsSearchResult {
    max_results: string;
    total_results: string;
    page_number: string;
    results: FoodList;
}
interface FoodSearchV3Response {
    foods_search: FoodsSearchResult;
}
interface FoodFindIdForBarcodeRequest {
    barcode: string;
    region?: string;
    language?: string;
    format?: "json" | "xml";
}
interface FoodFindIdForBarcodeResponse {
    food_id: ValueWrapper;
}
interface FoodGetByIdRequest {
    food_id?: string;
    format?: "json" | "xml";
    include_sub_categories?: boolean;
    include_food_images?: boolean;
    include_food_attributes?: boolean;
    flag_default_serving?: boolean;
    region?: string;
    language?: string;
}
interface FoodGetByIdResponse {
    food: Food;
}
interface FoodAutoCompleteV2Request {
    expression: string;
    max_results?: number;
    region?: string;
    format?: "json" | "xml";
}
interface SuggestionsList {
    suggestion: Array<{
        suggestion: string;
    }>;
}
interface FoodAutoCompleteV2Response {
    suggestions: SuggestionsList;
}
type BrandType = "brand" | "restaurant" | "generic";
interface FoodBrandsGetAllV2Request {
    brand_type?: BrandType;
    starts_with?: string;
    page_number?: number;
    max_results?: number;
    format?: "json" | "xml";
}
interface FoodBrand {
    brand_name: string;
    brand_type: BrandType;
}
interface FoodBrandsGetAllV2Response {
    food_brands?: {
        food_brand?: FoodBrand[] | FoodBrand;
        brand?: FoodBrand[] | FoodBrand;
        max_results?: string;
        total_results?: string;
        page_number?: string;
    };
}
interface FoodCategoriesGetAllV2Request {
    region?: string;
    language?: string;
    format?: "json" | "xml";
}
interface FoodCategory {
    food_category_id: string;
    food_category_name: string;
    food_category_description?: string;
}
interface FoodCategoriesGetAllV2Response {
    food_categories: {
        food_category: FoodCategory[];
    };
}
interface FoodSubCategoriesGetV2Request {
    food_category_id: string;
    include_sub_categories?: boolean;
    format?: "json" | "xml";
}
interface FoodSubCategory {
    food_sub_category_id: string;
    food_category_id: string;
    food_sub_category_name: string;
}
interface FoodSubCategoriesGetV2Response {
    food_sub_categories: {
        food_sub_category: FoodSubCategory[];
    };
}

interface RecipeSearchRequest {
    search_expression?: string;
    max_results?: number;
    page_number?: number;
    recipe_type?: string;
    include_recipe_images?: boolean;
    include_recipe_attributes?: boolean;
    language?: string;
    format?: "json" | "xml";
}
interface RecipeIngredient {
    recipe_ingredient: string;
}
interface RecipeDirection {
    recipe_direction: string;
}
interface RecipeNutrition {
    calories: string;
    carbohydrate: string;
    protein: string;
    fat: string;
}
interface RecipeIngredients {
    ingredient: string[];
}
interface RecipeTypes {
    recipe_type: string[];
}
interface RecipeSummary {
    recipe_id: string;
    recipe_name: string;
    recipe_description?: string;
    recipe_image?: string;
    recipe_url?: string;
    recipe_ingredients?: RecipeIngredients;
    recipe_nutrition?: RecipeNutrition;
    recipe_types?: RecipeTypes;
}
interface RecipeSearchResponse {
    recipes?: {
        max_results?: string;
        total_results?: string;
        page_number?: string;
        recipe?: RecipeSummary[];
    };
}
interface RecipeGetByIdRequest {
    recipe_id: string;
    format?: "json" | "xml";
    language?: string;
}
interface RecipeServing {
    calories?: string;
    carbohydrate?: string;
    protein?: string;
    fat?: string;
    saturated_fat?: string;
    polyunsaturated_fat?: string;
    monounsaturated_fat?: string;
    cholesterol?: string;
    sodium?: string;
    potassium?: string;
    fiber?: string;
    sugar?: string;
}
interface RecipeCategory {
    recipe_category_name: string;
    recipe_category_url?: string;
}
interface Recipe {
    recipe_id: string;
    recipe_name: string;
    recipe_type?: string;
    recipe_url?: string;
    recipe_description?: string;
    number_of_servings?: string;
    grams_per_portion?: string;
    preparation_time_min?: string;
    cooking_time_min?: string;
    recipe_types?: {
        recipe_type: string[];
    };
    recipe_categories?: {
        recipe_category: RecipeCategory[];
    };
    recipe_images?: {
        recipe_image: string[];
    };
    directions?: {
        direction: RecipeDirection[];
    };
    ingredients?: {
        ingredient: RecipeIngredient[];
    };
    serving_sizes?: {
        serving: RecipeServing;
    };
}
interface RecipeGetByIdResponse {
    recipe: Recipe;
}
interface RecipeTypesResponse {
    recipe_types: {
        recipe_type: Array<string | {
            recipe_type: string;
        }>;
    };
}

interface EatenFood {
    food_id?: string;
    serving_id?: string;
    number_of_units?: number;
    meal?: string;
    minutes_ago?: number;
}
interface NaturalLanguageProcessingRequest {
    user_input: string;
    include_food_data?: boolean;
    region?: string;
    language?: string;
    eaten_foods?: EatenFood[];
}
/**
 * Nutritional content for eaten food
 */
interface TotalNutritionalContent {
    calories: string;
    carbohydrate: string;
    protein: string;
    fat: string;
    saturated_fat?: string;
    polyunsaturated_fat?: string;
    monounsaturated_fat?: string;
    cholesterol?: string;
    sodium?: string;
    potassium?: string;
    fiber?: string;
    sugar?: string;
    vitamin_a?: string;
    vitamin_c?: string;
    calcium?: string;
    iron?: string;
}
/**
 * Information about food that was eaten
 */
interface Eaten {
    food_name_singular: string;
    food_name_plural: string;
    singular_description?: string;
    plural_description?: string;
    units?: number;
    metric_description?: string;
    total_metric_amount?: number;
    per_unit_metric_amount?: number;
    total_nutritional_content: TotalNutritionalContent;
}
/**
 * Suggested serving information
 */
interface SuggestedServing {
    serving_id: number;
    serving_description: string;
    metric_serving_description?: string;
    metric_measure_amount?: number;
    number_of_units?: string;
    custom_serving_description?: string;
}
/**
 * Food response from NLP or Image Recognition
 */
interface FoodResponse {
    food_id: number;
    food_entry_name: string;
    eaten: Eaten;
    suggested_serving: SuggestedServing;
    food?: Food;
}
/**
 * Response from Natural Language Processing endpoint
 */
interface NaturalLanguageProcessingResponse {
    food_response: FoodResponse[];
}

interface ImageRecognitionRequest {
    image_b64: string;
    region?: string;
    language?: string;
    include_food_data?: boolean;
    eaten_foods?: EatenFood[];
}
/**
 * Response from Image Recognition endpoint
 * Uses the same FoodResponse structure as NLP
 */
interface ImageRecognitionResponse {
    food_response?: FoodResponse[];
}

declare enum FatSecretMethod {
    FoodsSearchV3 = "foods.search.v3",
    FoodFindIdForBarcode = "food.find_id_for_barcode",
    FoodsAutocompleteV2 = "foods.autocomplete.v2",
    FoodBrandsGetAllV2 = "food_brands.get.v2",
    FoodCategoriesGetAllV2 = "food_categories.get.v2",
    FoodSubCategoriesGetV2 = "food_sub_categories.get.v2",
    RecipesGetByIdV2 = "recipe.get.v2",
    RecipesSearchV3 = "recipes.search.v3",
    RecipeTypesGetV2 = "recipe_types.get.v2"
}
declare enum FatSecretEndpoint {
    NaturalLanguageProcessingV1 = "/natural-language-processing/v1",
    ImageRecognitionV2 = "/image-recognition/v2"
}

interface FatSecretClientOptions {
    auth: SupportedAuthProvider;
    environment?: FatSecretEnvironment;
    httpClient?: HttpClient;
    platformAdapters?: PlatformAdapterBundle;
}

declare class FatSecretNutritionClient {
    private readonly options;
    private readonly http;
    private readonly env;
    private readonly adapters;
    private readonly authManager;
    private readonly apiService;
    constructor(options: FatSecretClientOptions);
    get strategy(): FatSecretAuthStrategy;
    /**
     * Mirrors Dart `search` (foods.search.v3).
     */
    search(props: FoodSearchV3Request): Promise<FoodSearchV3Response | null>;
    /**
     * Mirrors Dart `getById` (food.get.v4).
     */
    getById(props: FoodGetByIdRequest): Promise<FoodGetByIdResponse | null>;
    foodFindIdForBarcode(props: FoodFindIdForBarcodeRequest): Promise<FoodFindIdForBarcodeResponse | null>;
    autoComplete(props: FoodAutoCompleteV2Request): Promise<FoodAutoCompleteV2Response | null>;
    searchBrands(props: FoodBrandsGetAllV2Request): Promise<FoodBrandsGetAllV2Response | null>;
    getFoodCategories(props?: FoodCategoriesGetAllV2Request): Promise<FoodCategoriesGetAllV2Response | null>;
    getFoodSubCategories(props: FoodSubCategoriesGetV2Request): Promise<FoodSubCategoriesGetV2Response | null>;
    searchRecipes(props: RecipeSearchRequest): Promise<RecipeSearchResponse | null>;
    getRecipeById(props: RecipeGetByIdRequest): Promise<RecipeGetByIdResponse | null>;
    getRecipeTypes(): Promise<RecipeTypesResponse | null>;
    processNaturalLanguage(props: NaturalLanguageProcessingRequest): Promise<NaturalLanguageProcessingResponse | null>;
    imageRecognitionV2(props: ImageRecognitionRequest): Promise<ImageRecognitionResponse | null>;
    private safeCall;
    private toQuery;
    private toJson;
}

export { AuthManager, type AuthProvider, type AuthRequestContext, type AuthResult, type BrandType, type CachedToken, ClientCredentialsAuthenticator, type ClientCredentialsConfig, type ClientCredentialsProvider, type CryptoAdapter, DEFAULT_ENVIRONMENT, type Eaten, type EatenFood, FATSECRET_PROD, type FatSecretAuthStrategy, type FatSecretClientOptions, FatSecretEndpoint, type FatSecretEnvironment, FatSecretMethod, FatSecretNutritionClient, FetchHttpClient, type Food, type FoodAutoCompleteV2Request, type FoodAutoCompleteV2Response, type FoodBrand, type FoodBrandsGetAllV2Request, type FoodBrandsGetAllV2Response, type FoodCategoriesGetAllV2Request, type FoodCategoriesGetAllV2Response, type FoodCategory, type FoodFindIdForBarcodeRequest, type FoodFindIdForBarcodeResponse, type FoodGetByIdRequest, type FoodGetByIdResponse, type FoodImage, type FoodImages, type FoodList, type FoodResponse, type FoodSearchV3Request, type FoodSearchV3Response, type FoodSubCategoriesGetV2Request, type FoodSubCategoriesGetV2Response, type FoodSubCategory, type FoodsSearchResult, type HttpClient, type HttpMethod, type HttpRequest, type HttpResponse, type ImageRecognitionRequest, type ImageRecognitionResponse, type NaturalLanguageProcessingRequest, type NaturalLanguageProcessingResponse, type Nullable, type NumericString, type OAuth1Config, type OAuth1Params, type OAuth1Provider, type OAuth1RequestConfig, OAuth1Signer, type PlatformAdapterBundle, type PlatformConfig, type PlatformTarget, type Recipe, type RecipeCategory, type RecipeDirection, type RecipeGetByIdRequest, type RecipeGetByIdResponse, type RecipeIngredient, type RecipeIngredients, type RecipeNutrition, type RecipeSearchRequest, type RecipeSearchResponse, type RecipeServing, type RecipeSummary, type RecipeTypes, type RecipeTypesResponse, type Serving, type Servings, type StorageAdapter, type SuggestedServing, type SuggestionsList, type SupportedAuthProvider, TokenCache, type TotalNutritionalContent, type ValueWrapper, createDefaultPlatformAdapters, createMemoryStorageAdapter, createNodeAdapters, createReactNativeAdapters, createWebAdapters, detectPlatform, percentEncode };
