import type { Food, ValueWrapper } from "./shared";

export interface FoodSearchV3Request {
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

export interface FoodList {
  food: Food[];
}

export interface FoodsSearchResult {
  max_results: string;
  total_results: string;
  page_number: string;
  results: FoodList;
}

export interface FoodSearchV3Response {
  foods_search: FoodsSearchResult;
}

export interface FoodFindIdForBarcodeRequest {
  barcode: string;
  region?: string;
  language?: string;
  format?: "json" | "xml";
}

export interface FoodFindIdForBarcodeResponse {
  food_id: ValueWrapper;
}

export interface FoodGetByIdRequest {
  food_id?: string;
  format?: "json" | "xml";
  include_sub_categories?: boolean;
  include_food_images?: boolean;
  include_food_attributes?: boolean;
  flag_default_serving?: boolean;
  region?: string;
  language?: string;
}

export interface FoodGetByIdResponse {
  food: Food;
}

export interface FoodAutoCompleteV2Request {
  expression: string;
  max_results?: number;
  region?: string;
  format?: "json" | "xml";
}

export interface SuggestionsList {
  suggestion: Array<{ suggestion: string }>;
}

export interface FoodAutoCompleteV2Response {
  suggestions: SuggestionsList;
}

export type BrandType = "brand" | "restaurant" | "generic";

export interface FoodBrandsGetAllV2Request {
  brand_type?: BrandType;
  starts_with?: string;
  page_number?: number;
  max_results?: number;
  format?: "json" | "xml";
}

export interface FoodBrand {
  brand_name: string;
  brand_type: BrandType;
}

export interface FoodBrandsGetAllV2Response {
  food_brands?: {
    brand?: FoodBrand[];
    max_results?: string;
    total_results?: string;
    page_number?: string;
  };
}

export interface FoodCategoriesGetAllV2Request {
  region?: string;
  language?: string;
  format?: "json" | "xml";
}

export interface FoodCategory {
  food_category_id: string;
  food_category_name: string;
}

export interface FoodCategoriesGetAllV2Response {
  food_categories: {
    food_category: FoodCategory[];
  };
}

export interface FoodSubCategoriesGetV2Request {
  food_category_id: string;
  include_sub_categories?: boolean;
  format?: "json" | "xml";
}

export interface FoodSubCategory {
  food_sub_category_id: string;
  food_category_id: string;
  food_sub_category_name: string;
}

export interface FoodSubCategoriesGetV2Response {
  food_sub_categories: {
    food_sub_category: FoodSubCategory[];
  };
}
