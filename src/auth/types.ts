export interface ClientCredentialsConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl?: string;
}

export interface OAuth1Config {
  consumerKey: string;
  consumerSecret: string;
  accessToken?: string;
  accessTokenSecret?: string;
}

export type FatSecretAuthStrategy = "client-credentials" | "oauth1";

export interface AuthProvider {
  strategy: FatSecretAuthStrategy;
}

export interface ClientCredentialsProvider extends AuthProvider {
  strategy: "client-credentials";
  config: ClientCredentialsConfig;
}

export interface OAuth1Provider extends AuthProvider {
  strategy: "oauth1";
  config: OAuth1Config;
}

export type SupportedAuthProvider = ClientCredentialsProvider | OAuth1Provider;
