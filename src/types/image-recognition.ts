import type { Food } from "./shared";

export interface ImageRecognitionRequest {
  image_b64: string;
  region?: string;
  language?: string;
  include_food_data?: boolean;
}

export interface ImageRecognitionFoodMatch {
  confidence?: number;
  food?: Food;
}

export interface ImageRecognitionResponse {
  results?: ImageRecognitionFoodMatch[];
}
