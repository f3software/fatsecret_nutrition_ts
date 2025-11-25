import { FatSecretNutritionClient } from "../src";
import type { ClientCredentialsProvider } from "../src/auth";

const auth: ClientCredentialsProvider = {
  strategy: "client-credentials",
  config: {
    clientId: "demo",
    clientSecret: "demo",
  },
};

describe("FatSecretNutritionClient", () => {
  it("exposes OAuth strategy getter", () => {
    const client = new FatSecretNutritionClient({ auth });
    expect(client.strategy).toBe("client-credentials");
  });

});
