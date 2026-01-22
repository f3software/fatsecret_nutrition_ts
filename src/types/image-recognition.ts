import type { FoodResponse, EatenFood } from "./nlp";

export interface ImageRecognitionRequest {
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
export interface ImageRecognitionResponse {
  food_response?: FoodResponse[];
}
