function readValue(value: string | undefined) {
  return value?.trim() || "";
}

export type ProviderConfig = {
  authProviderUrl: string;
  authProviderHealthPath: string;
  cloudStorageProviderUrl: string;
  cloudStorageProviderHealthPath: string;
  ocrProviderUrl: string;
  ocrProviderHealthPath: string;
  videoEnhancementProviderUrl: string;
  videoEnhancementProviderHealthPath: string;
  providerHealthTimeoutMs: number;
};

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getProviderConfig(): ProviderConfig {
  return {
    authProviderUrl: readValue(process.env.NEXT_PUBLIC_AUTH_PROVIDER_URL),
    authProviderHealthPath: readValue(process.env.NEXT_PUBLIC_AUTH_PROVIDER_HEALTH_PATH) || "/health",
    cloudStorageProviderUrl: readValue(process.env.NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_URL),
    cloudStorageProviderHealthPath:
      readValue(process.env.NEXT_PUBLIC_CLOUD_STORAGE_PROVIDER_HEALTH_PATH) || "/health",
    ocrProviderUrl: readValue(process.env.NEXT_PUBLIC_OCR_PROVIDER_URL),
    ocrProviderHealthPath: readValue(process.env.NEXT_PUBLIC_OCR_PROVIDER_HEALTH_PATH) || "/health",
    videoEnhancementProviderUrl: readValue(process.env.NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_URL),
    videoEnhancementProviderHealthPath:
      readValue(process.env.NEXT_PUBLIC_VIDEO_ENHANCEMENT_PROVIDER_HEALTH_PATH) || "/health",
    providerHealthTimeoutMs: readNumber(process.env.NEXT_PUBLIC_PROVIDER_HEALTH_TIMEOUT_MS, 5000),
  };
}
