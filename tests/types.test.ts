import foodsSearchFixture from "../../fatsecret_nutrition_dart/test/src/models/json/foods_search_v3_response.json";
import recipeTypesFixture from "../../fatsecret_nutrition_dart/test/src/models/json/recipe_types_v2_response.json";
import type { FoodSearchV3Response, RecipeTypesResponse } from "../src/types";

describe("Type definitions", () => {
  it("matches food search fixture shape", () => {
    const payload = foodsSearchFixture as FoodSearchV3Response;
    expect(payload.foods_search.results.food.length).toBeGreaterThan(0);
  });

  it("matches recipe types fixture shape", () => {
    const payload = recipeTypesFixture as RecipeTypesResponse;
    expect(payload.recipe_types.recipe_type.length).toBeGreaterThan(0);
  });
});
