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

export interface NaturalLanguageProcessingResponse {
  foods?: {
    food: Food[];
  };
  calories?: number;
}
