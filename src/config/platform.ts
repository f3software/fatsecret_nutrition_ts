export type PlatformTarget = "web" | "react-native" | "node";

export interface PlatformConfig {
  target: PlatformTarget;
  userAgent?: string;
}

export const detectPlatform = (): PlatformTarget => {
  if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
    return "react-native";
  }
  if (typeof window !== "undefined") {
    return "web";
  }
  return "node";
};
