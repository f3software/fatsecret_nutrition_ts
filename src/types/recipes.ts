export interface RecipeSearchRequest {
  search_expression?: string;
  max_results?: number;
  page_number?: number;
  recipe_type?: string;
  include_recipe_images?: boolean;
  include_recipe_attributes?: boolean;
  language?: string;
  format?: "json" | "xml";
}

export interface RecipeIngredient {
  recipe_ingredient: string;
}

export interface RecipeDirection {
  recipe_direction: string;
}

export interface RecipeSummary {
  recipe_id: string;
  recipe_name: string;
  recipe_description?: string;
  recipe_image?: string;
  recipe_url?: string;
}

export interface RecipeSearchResponse {
  recipes?: {
    max_results?: string;
    total_results?: string;
    page_number?: string;
    recipe?: RecipeSummary[];
  };
}

export interface RecipeGetByIdRequest {
  recipe_id: string;
  format?: "json" | "xml";
  language?: string;
}

export interface Recipe {
  recipe_id: string;
  recipe_name: string;
  recipe_type?: string;
  recipe_url?: string;
  recipe_description?: string;
  recipe_images?: {
    recipe_image: string[];
  };
  directions?: {
    direction: RecipeDirection[];
  };
  ingredients?: {
    ingredient: RecipeIngredient[];
  };
}

export interface RecipeGetByIdResponse {
  recipe: Recipe;
}

export interface RecipeTypesResponse {
  recipe_types: {
    recipe_type: Array<string | { recipe_type: string }>;
  };
}
