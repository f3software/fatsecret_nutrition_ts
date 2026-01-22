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

export interface RecipeNutrition {
  calories: string;
  carbohydrate: string;
  protein: string;
  fat: string;
}

export interface RecipeIngredients {
  ingredient: string[];
}

export interface RecipeTypes {
  recipe_type: string[];
}

export interface RecipeSummary {
  recipe_id: string;
  recipe_name: string;
  recipe_description?: string;
  recipe_image?: string;
  recipe_url?: string;
  recipe_ingredients?: RecipeIngredients;
  recipe_nutrition?: RecipeNutrition;
  recipe_types?: RecipeTypes;
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

export interface RecipeServing {
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

export interface RecipeCategory {
  recipe_category_name: string;
  recipe_category_url?: string;
}

export interface Recipe {
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

export interface RecipeGetByIdResponse {
  recipe: Recipe;
}

export interface RecipeTypesResponse {
  recipe_types: {
    recipe_type: Array<string | { recipe_type: string }>;
  };
}
