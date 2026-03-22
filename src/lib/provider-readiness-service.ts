import { getProviderConfig } from "@/lib/provider-config";

export type ProviderReadinessItem = {
  key: "auth" | "cloud-storage" | "ocr" | "video";
  configured: boolean;
  target: string;
};

export type ProviderReadinessReport = {
  allConfigured: boolean;
  items: ProviderReadinessItem[];
};

export function buildProviderReadinessReport(): ProviderReadinessReport {
  const providerConfig = getProviderConfig();
  const items: ProviderReadinessItem[] = [
    {
      key: "auth",
      configured: Boolean(providerConfig.authProviderUrl),
      target: providerConfig.authProviderUrl,
    },
    {
      key: "cloud-storage",
      configured: Boolean(providerConfig.cloudStorageProviderUrl),
      target: providerConfig.cloudStorageProviderUrl,
    },
    {
      key: "ocr",
      configured: Boolean(providerConfig.ocrProviderUrl),
      target: providerConfig.ocrProviderUrl,
    },
    {
      key: "video",
      configured: Boolean(providerConfig.videoEnhancementProviderUrl),
      target: providerConfig.videoEnhancementProviderUrl,
    },
  ];

  return {
    allConfigured: items.every((item) => item.configured),
    items,
  };
}
