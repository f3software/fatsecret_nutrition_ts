export type Nullable<T> = T | null | undefined;
export type NumericString = `${number}` | number;

export interface FoodImage {
  image_url: string;
  image_type: string;
}

export interface FoodImages {
  food_image: FoodImage[];
}

export interface Serving {
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

export interface Servings {
  serving: Serving[];
}

export interface Food {
  food_id?: string;
  food_name?: string;
  food_type?: string;
  food_url?: string;
  food_images?: FoodImages;
  servings?: Servings;
}

export interface ValueWrapper {
  value: string;
}
