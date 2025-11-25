import {
  createNodeAdapters,
  createDefaultPlatformAdapters,
  createReactNativeAdapters,
} from "../../src/platform";

describe("Platform adapters", () => {
  it("creates working node adapters", async () => {
    const adapters = createNodeAdapters();
    expect(adapters.target).toBe("node");

    await adapters.storage.setItem("token", "abc");
    expect(await adapters.storage.getItem("token")).toBe("abc");
    await adapters.storage.removeItem("token");
    expect(await adapters.storage.getItem("token")).toBeNull();

    const nonce = await adapters.crypto.randomBytes(8);
    expect(nonce).toHaveLength(8);
    const signature = await adapters.crypto.hmacSha1("key", "data");
    expect(signature).toMatch(/[A-Za-z0-9+/]+=*/);
  });

  it("requires overrides for react-native adapters", () => {
    expect(() =>
      createReactNativeAdapters({
        storage: {
          getItem: async () => null,
          setItem: async () => undefined,
          removeItem: async () => undefined,
        },
        crypto: {
          randomBytes: async () => new Uint8Array([1]),
          hmacSha1: async () => "signature",
          base64Encode: () => "base64",
        },
      }),
    ).not.toThrow();
  });

  it("defaults to node adapters in Node environment", () => {
    const adapters = createDefaultPlatformAdapters();
    expect(adapters.target).toBe("node");
  });
});

