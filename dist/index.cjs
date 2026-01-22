'use strict';

// src/config/urls.ts
var FATSECRET_PROD = {
  apiBaseUrl: "https://platform.fatsecret.com/rest",
  oauthBaseUrl: "https://oauth.fatsecret.com/connect/token",
  imageRecognitionUrl: "https://platform.fatsecret.com/rest/image-recognition/v2",
  naturalLanguageProcessingUrl: "https://platform.fatsecret.com/rest/natural-language-processing/v1"
};
var DEFAULT_ENVIRONMENT = FATSECRET_PROD;

// src/config/platform.ts
var detectPlatform = () => {
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    return "react-native";
  }
  if (typeof window !== "undefined") {
    return "web";
  }
  return "node";
};

// src/http/fetch-http-client.ts
function buildUrl(url, query) {
  if (!query || Object.keys(query).length === 0) {
    return url;
  }
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === void 0)
      return;
    searchParams.append(key, String(value));
  });
  const qs = searchParams.toString();
  return qs ? `${url}?${qs}` : url;
}
var FetchHttpClient = class {
  async send(request) {
    const url = buildUrl(request.url, request.query);
    let body;
    if (typeof request.body === "string") {
      body = request.body;
    } else if (request.body instanceof URLSearchParams) {
      body = request.body.toString();
    } else if (request.body && typeof request.body === "object") {
      body = JSON.stringify(request.body);
    }
    const response = await fetch(url, {
      method: request.method,
      headers: request.headers,
      body: request.method === "GET" ? void 0 : body
    });
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const contentType = headers["content-type"] || headers["Content-Type"] || "";
    const isJson = contentType.includes("application/json") || contentType.includes("text/json");
    const text = await response.text();
    let data;
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}. Content-Type: ${contentType || "unknown"}. Response: ${text.substring(0, 500)}`
      );
    }
    if (isJson) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error(
          `Failed to parse JSON response. Status: ${response.status}, Content-Type: ${contentType}, Response preview: ${text.substring(0, 200)}`
        );
      }
    } else {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Expected JSON response but received ${contentType || "unknown content type"}. Response preview: ${text.substring(0, 200)}`
        );
      }
    }
    return {
      status: response.status,
      data,
      headers
    };
  }
};

// src/auth/client-credentials.ts
var DEFAULT_SCOPE = "basic";
var ClientCredentialsAuthenticator = class {
  constructor(config, http, cache) {
    this.config = config;
    this.http = http;
    this.cache = cache;
  }
  async getAccessToken() {
    const cached = await this.cache.get();
    if (cached) {
      return cached.token;
    }
    const fresh = await this.fetchToken();
    await this.cache.set(fresh.access_token, fresh.expires_in);
    return fresh.access_token;
  }
  async fetchToken() {
    const tokenUrl = this.config.tokenUrl;
    if (!tokenUrl) {
      throw new Error("Client credentials tokenUrl is required");
    }
    const scope = this.normalizeScopes(this.config.scopes);
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      scope
    });
    const response = await this.http.send({
      method: "POST",
      url: tokenUrl,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${this.encodeCredentials()}`
      },
      body
    });
    if (response.status !== 200) {
      throw new Error(`Failed to fetch access token: ${response.status}`);
    }
    if (!response.data?.access_token || !response.data?.expires_in) {
      throw new Error("Malformed token response");
    }
    return response.data;
  }
  encodeCredentials() {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error("Client credentials require clientId and clientSecret");
    }
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
    if (typeof Buffer !== "undefined") {
      return Buffer.from(credentials, "utf8").toString("base64");
    }
    if (typeof btoa === "function") {
      return btoa(credentials);
    }
    throw new Error("No base64 encoder available for credentials");
  }
  normalizeScopes(scopes) {
    if (!scopes || Array.isArray(scopes) && scopes.length === 0) {
      return DEFAULT_SCOPE;
    }
    if (typeof scopes === "string") {
      return scopes.trim() || DEFAULT_SCOPE;
    }
    return scopes.join(" ");
  }
};

// src/auth/token-cache.ts
var SAFETY_WINDOW_MS = 5e3;
var TokenCache = class {
  constructor(storage, key) {
    this.storage = storage;
    this.key = key;
  }
  async get() {
    try {
      const raw = await this.storage.getItem(this.key);
      if (!raw)
        return null;
      const parsed = JSON.parse(raw);
      if (!parsed.token || !parsed.expiresAt)
        return null;
      if (parsed.expiresAt <= Date.now()) {
        await this.storage.removeItem(this.key);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  async set(token, expiresInSeconds) {
    const expiresAt = Date.now() + expiresInSeconds * 1e3 - SAFETY_WINDOW_MS;
    const payload = { token, expiresAt };
    await this.storage.setItem(this.key, JSON.stringify(payload));
  }
  async clear() {
    await this.storage.removeItem(this.key);
  }
};

// src/auth/oauth1.ts
var RFC3986_REGEX = /[!'()*]/g;
var RFC3986_REPLACEMENTS = {
  "!": "%21",
  "'": "%27",
  "(": "%28",
  ")": "%29",
  "*": "%2A"
};
var OAuth1Signer = class {
  constructor(config, crypto) {
    this.config = config;
    this.crypto = crypto;
  }
  async generateParams(request) {
    const oauthParams = {
      oauth_consumer_key: this.config.consumerKey,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: Math.floor(Date.now() / 1e3).toString(),
      oauth_nonce: await this.generateNonce(),
      oauth_version: "1.0"
    };
    if (this.config.accessToken) {
      oauthParams.oauth_token = this.config.accessToken;
    }
    const allParams = {
      ...oauthParams,
      ...request.params ?? {}
    };
    const signatureBaseString = this.createSignatureBaseString(request.method, request.url, allParams);
    const signature = await this.sign(signatureBaseString);
    oauthParams.oauth_signature = signature;
    return {
      ...oauthParams,
      ...request.params ?? {}
    };
  }
  buildAuthorizationHeader(params) {
    const headerParams = Object.entries(params).filter(([key]) => key.startsWith("oauth_")).map(([key, value]) => `${key}="${percentEncode(value)}"`).join(", ");
    return `OAuth ${headerParams}`;
  }
  async generateNonce() {
    const bytes = await this.crypto.randomBytes(16);
    return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  async sign(signatureBaseString) {
    const key = `${percentEncode(this.config.consumerSecret)}&${percentEncode(
      this.config.accessTokenSecret ?? ""
    )}`;
    return this.crypto.hmacSha1(key, signatureBaseString);
  }
  createSignatureBaseString(method, url, params) {
    const encodedMethod = percentEncode(method.toUpperCase());
    const encodedUrl = percentEncode(normalizeUrl(url));
    const normalizedParams = normalizeParams(params);
    return `${encodedMethod}&${encodedUrl}&${percentEncode(normalizedParams)}`;
  }
};
function normalizeUrl(rawUrl) {
  const url = new URL(rawUrl);
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  const isDefaultPort = url.protocol === "https:" && port === "443" || url.protocol === "http:" && port === "80";
  const host = isDefaultPort ? url.host.split(":")[0] : url.host;
  return `${url.protocol}//${host}${url.pathname}`;
}
function normalizeParams(params) {
  return Object.keys(params).sort().map((key) => `${percentEncode(key)}=${percentEncode(params[key])}`).join("&");
}
function percentEncode(value) {
  return encodeURIComponent(value).replace(RFC3986_REGEX, (char) => RFC3986_REPLACEMENTS[char]);
}

// src/auth/auth-manager.ts
var AuthManager = class {
  constructor(provider, http, adapters, defaultTokenUrl) {
    this.provider = provider;
    this.http = http;
    this.storage = adapters.storage;
    this.crypto = adapters.crypto;
    if (provider.strategy === "client-credentials") {
      if (!provider.config.tokenUrl && defaultTokenUrl) {
        provider.config.tokenUrl = defaultTokenUrl;
      }
      const cacheKey = `fatsecret:access_token:${provider.config.clientId}`;
      const cache = new TokenCache(this.storage, cacheKey);
      this.clientCredentials = new ClientCredentialsAuthenticator(
        provider.config,
        this.http,
        cache
      );
      return;
    }
    this.oauth1Signer = new OAuth1Signer(provider.config, this.crypto);
  }
  async getAuth(context) {
    if (this.provider.strategy === "client-credentials") {
      if (!this.clientCredentials) {
        throw new Error("Client credentials authenticator not configured");
      }
      const token = await this.clientCredentials.getAccessToken();
      return {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
    }
    if (!this.oauth1Signer) {
      throw new Error("OAuth1 signer not configured");
    }
    const params = await this.oauth1Signer.generateParams({
      method: context.method,
      url: context.url,
      params: context.query
    });
    return {
      query: params,
      headers: {
        Authorization: this.oauth1Signer.buildAuthorizationHeader(params)
      }
    };
  }
};

// src/service/api-service.ts
var ApiService = class {
  constructor(options) {
    this.options = options;
  }
  async callMethod(method, queryParams = {}) {
    const url = `${this.options.environment.apiBaseUrl}/server.api`;
    const query = {
      method: typeof method === "string" ? method : method,
      format: "json",
      ...queryParams
    };
    const auth = await this.options.authManager.getAuth({
      method: "GET",
      url,
      query: stringifyRecord(query)
    });
    const response = await this.sendRequest({
      method: "GET",
      url,
      query: {
        ...query,
        ...auth.query ?? {}
      },
      headers: auth.headers
    });
    return response;
  }
  async postJson(url, body) {
    const auth = await this.options.authManager.getAuth({
      method: "POST",
      url
    });
    return this.sendRequest({
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...auth.headers ?? {}
      },
      body
    });
  }
  async sendRequest({
    method,
    url,
    query,
    headers,
    body
  }) {
    const response = await this.options.http.send({
      method,
      url,
      query,
      headers,
      body
    });
    if (response.status !== 200) {
      throw new Error(`FatSecret API error: ${response.status}`);
    }
    const data = response.data;
    if (isErrorPayload(data)) {
      throw new Error(data.error.message ?? "FatSecret API error");
    }
    return data;
  }
};
function stringifyRecord(params) {
  return Object.entries(params).reduce(
    (acc, [key, value]) => {
      if (value === void 0)
        return acc;
      acc[key] = String(value);
      return acc;
    },
    {}
  );
}
function isErrorPayload(data) {
  return Boolean(
    data && typeof data === "object" && "error" in data
  );
}

// src/types/enums.ts
var FatSecretMethod = /* @__PURE__ */ ((FatSecretMethod2) => {
  FatSecretMethod2["FoodsSearchV3"] = "foods.search.v3";
  FatSecretMethod2["FoodFindIdForBarcode"] = "food.find_id_for_barcode";
  FatSecretMethod2["FoodsAutocompleteV2"] = "foods.autocomplete.v2";
  FatSecretMethod2["FoodBrandsGetAllV2"] = "food_brands.get.v2";
  FatSecretMethod2["FoodCategoriesGetAllV2"] = "food_categories.get.v2";
  FatSecretMethod2["FoodSubCategoriesGetV2"] = "food_sub_categories.get.v2";
  FatSecretMethod2["RecipesGetByIdV2"] = "recipe.get.v2";
  FatSecretMethod2["RecipesSearchV3"] = "recipes.search.v3";
  FatSecretMethod2["RecipeTypesGetV2"] = "recipe_types.get.v2";
  return FatSecretMethod2;
})(FatSecretMethod || {});
var FatSecretEndpoint = /* @__PURE__ */ ((FatSecretEndpoint2) => {
  FatSecretEndpoint2["NaturalLanguageProcessingV1"] = "/natural-language-processing/v1";
  FatSecretEndpoint2["ImageRecognitionV2"] = "/image-recognition/v2";
  return FatSecretEndpoint2;
})(FatSecretEndpoint || {});

// src/platform/adapters.ts
var maybeBuffer = () => globalThis.Buffer;
var MemoryStorageAdapter = class {
  constructor() {
    this.store = /* @__PURE__ */ new Map();
  }
  async getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  async setItem(key, value) {
    this.store.set(key, value);
  }
  async removeItem(key) {
    this.store.delete(key);
  }
};
var BrowserStorageAdapter = class {
  async getItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  async setItem(key, value) {
    window.localStorage.setItem(key, value);
  }
  async removeItem(key) {
    window.localStorage.removeItem(key);
  }
};
var NodeCryptoAdapter = class {
  async loadCrypto() {
    return (await import('crypto')).default;
  }
  async randomBytes(length) {
    const crypto = await this.loadCrypto();
    return new Uint8Array(crypto.randomBytes(length));
  }
  async hmacSha1(key, baseString) {
    const crypto = await this.loadCrypto();
    return crypto.createHmac("sha1", key).update(baseString).digest("base64");
  }
  base64Encode(input) {
    const buffer = maybeBuffer();
    if (typeof input === "string") {
      return buffer ? buffer.from(input, "utf8").toString("base64") : btoa(input);
    }
    return buffer ? buffer.from(input).toString("base64") : btoa(bytesToBinary(input));
  }
};
var WebCryptoAdapter = class {
  constructor(crypto) {
    this.crypto = crypto;
  }
  async randomBytes(length) {
    const bytes = new Uint8Array(length);
    this.crypto.getRandomValues(bytes);
    return bytes;
  }
  async hmacSha1(key, baseString) {
    const encoder = new TextEncoder();
    const cryptoKey = await this.crypto.subtle.importKey(
      "raw",
      encoder.encode(key),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );
    const signature = await this.crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(baseString)
    );
    return uint8ToBase64(new Uint8Array(signature));
  }
  base64Encode(input) {
    if (typeof input === "string") {
      return btoa(input);
    }
    return uint8ToBase64(input);
  }
};
var PlaceholderCryptoAdapter = class {
  async randomBytes(length) {
    throw new Error(
      `randomBytes(${length}) requires a platform crypto implementation`
    );
  }
  async hmacSha1(key, baseString) {
    throw new Error("hmacSha1 requires a platform crypto implementation");
  }
  base64Encode(input) {
    const buffer = maybeBuffer();
    if (typeof input === "string") {
      if (typeof btoa === "function")
        return btoa(input);
      if (buffer)
        return buffer.from(input, "utf8").toString("base64");
    } else if (buffer) {
      return buffer.from(input).toString("base64");
    }
    throw new Error("base64Encode requires Buffer or btoa support");
  }
};
var createMemoryStorageAdapter = () => new MemoryStorageAdapter();
var createNodeAdapters = () => ({
  target: "node",
  storage: createMemoryStorageAdapter(),
  crypto: new NodeCryptoAdapter()
});
var createWebAdapters = () => {
  if (typeof window === "undefined" || !window.crypto) {
    throw new Error("Window crypto APIs are unavailable in this environment.");
  }
  return {
    target: "web",
    storage: window.localStorage ? new BrowserStorageAdapter() : createMemoryStorageAdapter(),
    crypto: new WebCryptoAdapter(window.crypto)
  };
};
var createReactNativeAdapters = (options) => ({
  target: "react-native",
  storage: options.storage,
  crypto: options.crypto,
  httpClient: options.httpClient
});
var createDefaultPlatformAdapters = () => {
  const platform = detectPlatform();
  if (platform === "web") {
    try {
      return createWebAdapters();
    } catch {
      return {
        target: "web",
        storage: createMemoryStorageAdapter(),
        crypto: new PlaceholderCryptoAdapter()
      };
    }
  }
  if (platform === "node") {
    return createNodeAdapters();
  }
  throw new Error(
    "React Native detected. Please provide platformAdapters explicitly via createReactNativeAdapters()."
  );
};
var uint8ToBase64 = (bytes) => {
  const buffer = maybeBuffer();
  if (buffer) {
    return buffer.from(bytes).toString("base64");
  }
  return btoa(bytesToBinary(bytes));
};
var bytesToBinary = (bytes) => Array.from(bytes).map((byte) => String.fromCharCode(byte)).join("");

// src/client.ts
var FatSecretNutritionClient = class {
  constructor(options) {
    this.options = options;
    this.env = options.environment ?? DEFAULT_ENVIRONMENT;
    this.http = options.httpClient ?? new FetchHttpClient();
    this.adapters = options.platformAdapters ?? createDefaultPlatformAdapters();
    this.authManager = new AuthManager(
      options.auth,
      this.http,
      this.adapters,
      this.env.oauthBaseUrl
    );
    this.apiService = new ApiService({
      http: this.http,
      environment: this.env,
      authManager: this.authManager
    });
  }
  get strategy() {
    return this.options.auth.strategy;
  }
  /**
   * Mirrors Dart `search` (foods.search.v3).
   */
  async search(props) {
    return this.safeCall(
      () => this.apiService.callMethod(
        "foods.search.v3" /* FoodsSearchV3 */,
        this.toQuery(props)
      )
    );
  }
  /**
   * Mirrors Dart `getById` (food.get.v4).
   */
  async getById(props) {
    return this.safeCall(
      () => this.apiService.callMethod(
        "food.get.v4",
        this.toQuery(props)
      )
    );
  }
  async foodFindIdForBarcode(props) {
    return this.safeCall(
      () => this.apiService.callMethod(
        "food.find_id_for_barcode" /* FoodFindIdForBarcode */,
        this.toQuery(props)
      )
    );
  }
  async autoComplete(props) {
    return this.safeCall(
      () => this.apiService.callMethod(
        "foods.autocomplete.v2" /* FoodsAutocompleteV2 */,
        this.toQuery(props)
      )
    );
  }
  async searchBrands(props) {
    return this.safeCall(
      () => this.apiService.callMethod(
        "food_brands.get.v2" /* FoodBrandsGetAllV2 */,
        this.toQuery(props)
      )
    );
  }
  async getFoodCategories(props) {
    return this.safeCall(
      () => this.apiService.callMethod(
        "food_categories.get.v2" /* FoodCategoriesGetAllV2 */,
        this.toQuery(props ?? {})
      )
    );
  }
  async getFoodSubCategories(props) {
    return this.safeCall(
      () => this.apiService.callMethod(
        "food_sub_categories.get.v2" /* FoodSubCategoriesGetV2 */,
        this.toQuery(props)
      )
    );
  }
  async searchRecipes(props) {
    return this.safeCall(
      () => this.apiService.callMethod(
        "recipes.search.v3" /* RecipesSearchV3 */,
        this.toQuery(props)
      )
    );
  }
  async getRecipeById(props) {
    return this.safeCall(
      () => this.apiService.callMethod(
        "recipe.get.v2" /* RecipesGetByIdV2 */,
        this.toQuery(props)
      )
    );
  }
  async getRecipeTypes() {
    return this.safeCall(
      () => this.apiService.callMethod(
        "recipe_types.get.v2" /* RecipeTypesGetV2 */
      )
    );
  }
  async processNaturalLanguage(props) {
    return this.safeCall(
      () => this.apiService.postJson(
        this.env.naturalLanguageProcessingUrl,
        this.toJson(props)
      )
    );
  }
  async imageRecognitionV2(props) {
    return this.safeCall(
      () => this.apiService.postJson(
        this.env.imageRecognitionUrl,
        this.toJson(props)
      )
    );
  }
  async safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      const isSilent = process.env.FATSECRET_TS_SILENT_ERRORS === "1";
      const isTest = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== void 0;
      if (!isSilent || isTest) {
        const errorDetails = error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : { error };
        console.error("FatSecret request failed:", errorDetails);
      }
      return null;
    }
  }
  toQuery(params) {
    const source = params ?? {};
    return Object.entries(source).reduce(
      (acc, [key, value]) => {
        if (value !== void 0) {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );
  }
  toJson(payload) {
    return { ...payload ?? {} };
  }
};

exports.AuthManager = AuthManager;
exports.ClientCredentialsAuthenticator = ClientCredentialsAuthenticator;
exports.DEFAULT_ENVIRONMENT = DEFAULT_ENVIRONMENT;
exports.FATSECRET_PROD = FATSECRET_PROD;
exports.FatSecretEndpoint = FatSecretEndpoint;
exports.FatSecretMethod = FatSecretMethod;
exports.FatSecretNutritionClient = FatSecretNutritionClient;
exports.FetchHttpClient = FetchHttpClient;
exports.OAuth1Signer = OAuth1Signer;
exports.TokenCache = TokenCache;
exports.createDefaultPlatformAdapters = createDefaultPlatformAdapters;
exports.createMemoryStorageAdapter = createMemoryStorageAdapter;
exports.createNodeAdapters = createNodeAdapters;
exports.createReactNativeAdapters = createReactNativeAdapters;
exports.createWebAdapters = createWebAdapters;
exports.detectPlatform = detectPlatform;
exports.percentEncode = percentEncode;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.cjs.map