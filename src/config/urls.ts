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
    "https://platform.fatsecret.com/rest/image-recognition/v2",
  naturalLanguageProcessingUrl:
    "https://platform.fatsecret.com/rest/natural-language-processing/v1",
};

export const DEFAULT_ENVIRONMENT = FATSECRET_PROD;
