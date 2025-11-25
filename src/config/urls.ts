export interface FatSecretEnvironment {
  apiBaseUrl: string;
  oauthBaseUrl: string;
  imageRecognitionUrl: string;
  naturalLanguageProcessingUrl: string;
}

export const FATSECRET_PROD: FatSecretEnvironment = {
  apiBaseUrl: "https://platform.fatsecret.com/rest",
  oauthBaseUrl: "https://oauth.fatsecret.com/connect/token",
  imageRecognitionUrl:
    "https://platform.fatsecret.com/rest/2.0/image.recognition",
  naturalLanguageProcessingUrl:
    "https://platform.fatsecret.com/rest/1.0/natural-language-processing",
};

export const DEFAULT_ENVIRONMENT = FATSECRET_PROD;
