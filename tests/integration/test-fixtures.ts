/**
 * Shared test fixtures for integration tests
 */

// Base64 test image (same as Dart tests use)
// This is a small JPEG image for testing image recognition
export const TEST_BASE64_IMAGE =
  "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";

// Expected brand names for searchBrands test (starts_with: 'k', brand_type: 'restaurant')
export const EXPECTED_K_RESTAURANT_BRANDS = [
  "K&W",
  "K&W Cafeteria",
  "Kabuki",
  "Kame",
  "Kelsey's",
  "Keva Juice",
  "KFC",
  "Kidd Valley",
  "King Taco",
  "Kneaders",
  "Kohr Brothers",
  "Kolache Factory",
  "Kona Grill",
  "Koo Koo Roo",
  "Krazy Korner",
  "Krispy Krunchy Chicken",
  "Krystal",
  "Kum & Go",
  "Kura Sushi",
];

// Expected recipe types from getRecipeTypes
export const EXPECTED_RECIPE_TYPES = [
  "Appetizer",
  "Soup",
  "Main Dish",
  "Side Dish",
  "Baked",
  "Salad and Salad Dressing",
  "Sauce and Condiment",
  "Dessert",
  "Snack",
  "Beverage",
  "Other",
  "Breakfast",
  "Lunch",
];

