import { getProviderConfig } from "@/lib/provider-config";
import { probeRemoteProvider } from "@/lib/remote-provider-client";

export type ProviderHealthKey = "auth" | "cloud-storage" | "ocr" | "video";

export type ProviderHealthItem = {
  key: ProviderHealthKey;
  configured: boolean;
  target: string;
  healthUrl: string;
  reachable: boolean | null;
  statusCode: number | null;
  state: "not-configured" | "reachable" | "unreachable";
};

export async function buildProviderHealthItems(): Promise<ProviderHealthItem[]> {
  const providerConfig = getProviderConfig();
  const timeoutMs = providerConfig.providerHealthTimeoutMs;

  const specs = [
    {
      key: "auth" as const,
      target: providerConfig.authProviderUrl,
      healthPath: providerConfig.authProviderHealthPath,
    },
    {
      key: "cloud-storage" as const,
      target: providerConfig.cloudStorageProviderUrl,
      healthPath: providerConfig.cloudStorageProviderHealthPath,
    },
    {
      key: "ocr" as const,
      target: providerConfig.ocrProviderUrl,
      healthPath: providerConfig.ocrProviderHealthPath,
    },
    {
      key: "video" as const,
      target: providerConfig.videoEnhancementProviderUrl,
      healthPath: providerConfig.videoEnhancementProviderHealthPath,
    },
  ];

  return Promise.all(
    specs.map(async (spec) => {
      if (!spec.target) {
        return {
          key: spec.key,
          configured: false,
          target: "",
          healthUrl: "",
          reachable: null,
          statusCode: null,
          state: "not-configured" as const,
        };
      }

      const probe = await probeRemoteProvider(spec.target, spec.healthPath, timeoutMs);

      return {
        key: spec.key,
        configured: true,
        target: spec.target,
        healthUrl: probe.healthUrl,
        reachable: probe.reachable,
        statusCode: probe.statusCode,
        state: probe.reachable ? ("reachable" as const) : ("unreachable" as const),
      };
    }),
  );
}
