import crypto from "crypto";
import { OAuth1Signer, percentEncode } from "../../src/auth/oauth1";
import type { OAuth1Config } from "../../src/auth";
import type { CryptoAdapter } from "../../src/platform";

class DeterministicCrypto implements CryptoAdapter {
  async randomBytes(length: number): Promise<Uint8Array> {
    return new Uint8Array(Array.from({ length }, () => 1));
  }

  async hmacSha1(key: string, baseString: string): Promise<string> {
    return crypto.createHmac("sha1", key).update(baseString).digest("base64");
  }

  base64Encode(input: Uint8Array | string): string {
    if (typeof input === "string") {
      return Buffer.from(input, "utf8").toString("base64");
    }
    return Buffer.from(input).toString("base64");
  }
}

const config: OAuth1Config = {
  consumerKey: "key",
  consumerSecret: "secret",
  accessToken: "token",
  accessTokenSecret: "token-secret",
};

describe("OAuth1Signer", () => {
  beforeAll(() => {
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
  });

  afterAll(() => {
    (Date.now as jest.Mock).mockRestore();
  });

  it("generates deterministic OAuth params", async () => {
    const signer = new OAuth1Signer(config, new DeterministicCrypto());
    const params = await signer.generateParams({
      method: "GET",
      url: "https://platform.fatsecret.com/rest/server.api",
      params: {
        method: "foods.search",
        format: "json",
      },
    });

    expect(params.oauth_consumer_key).toBe("key");
    expect(params.oauth_nonce).toBe("01010101010101010101010101010101");
    expect(params.oauth_timestamp).toBe((1_700_000_000_000 / 1000).toString());
    expect(params.oauth_signature).toBe("Bv05sRYYcvgHW2rzgri4JpuVm8w=");

    const header = signer.buildAuthorizationHeader(params);
    expect(header.startsWith("OAuth ")).toBe(true);
    expect(header).toContain(`oauth_signature="${percentEncode("Bv05sRYYcvgHW2rzgri4JpuVm8w=")}"`);
  });
});

