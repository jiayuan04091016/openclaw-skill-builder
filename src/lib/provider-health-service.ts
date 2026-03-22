import { probeRemoteProvider } from "@/lib/remote-provider-client";
import { buildServerProviderHeaders, getServerProviderConfig } from "@/lib/server-provider-config";

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
  const providerConfig = getServerProviderConfig();
  const timeoutMs = providerConfig.providerHealthTimeoutMs;

  const specs = [
    {
      key: "auth" as const,
      target: providerConfig.auth.url,
      healthPath: providerConfig.auth.healthPath,
      headers: buildServerProviderHeaders(providerConfig.auth),
    },
    {
      key: "cloud-storage" as const,
      target: providerConfig.cloudStorage.url,
      healthPath: providerConfig.cloudStorage.healthPath,
      headers: buildServerProviderHeaders(providerConfig.cloudStorage),
    },
    {
      key: "ocr" as const,
      target: providerConfig.ocr.url,
      healthPath: providerConfig.ocr.healthPath,
      headers: buildServerProviderHeaders(providerConfig.ocr),
    },
    {
      key: "video" as const,
      target: providerConfig.video.url,
      healthPath: providerConfig.video.healthPath,
      headers: buildServerProviderHeaders(providerConfig.video),
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

      const probe = await probeRemoteProvider(spec.target, spec.healthPath, timeoutMs, spec.headers);

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
