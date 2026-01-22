import type { Food } from "./shared";

export interface EatenFood {
  food_id?: string;
  serving_id?: string;
  number_of_units?: number;
  meal?: string;
  minutes_ago?: number;
}

export interface NaturalLanguageProcessingRequest {
  user_input: string;
  include_food_data?: boolean;
  region?: string;
  language?: string;
  eaten_foods?: EatenFood[];
}

/**
 * Nutritional content for eaten food
 */
export interface TotalNutritionalContent {
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
export interface Eaten {
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
export interface SuggestedServing {
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
export interface FoodResponse {
  food_id: number;
  food_entry_name: string;
  eaten: Eaten;
  suggested_serving: SuggestedServing;
  food?: Food;
}

/**
 * Response from Natural Language Processing endpoint
 */
export interface NaturalLanguageProcessingResponse {
  food_response: FoodResponse[];
}
