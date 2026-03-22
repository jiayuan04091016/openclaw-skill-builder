import { getProviderConfig } from "@/lib/provider-config";
import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import type { CloudProjectRecord, CloudSyncBundle } from "@/types/app";

export type CloudStorageProviderResult = {
  ok: boolean;
  message: string;
  projectCount: number;
};

export type CloudStorageProvider = {
  isConfigured: () => boolean;
  fetchProjects: () => Promise<CloudProjectRecord[]>;
  saveBundle: (bundle: CloudSyncBundle) => Promise<CloudStorageProviderResult>;
};

function createLocalCloudStorageProvider(): CloudStorageProvider {
  const capabilities = getRuntimeCapabilities();

  return {
    isConfigured: () => capabilities.cloudSyncEnabled,
    fetchProjects: async () => [],
    saveBundle: async (bundle) => ({
      ok: capabilities.cloudSyncEnabled,
      message: capabilities.cloudSyncEnabled
        ? `云端存储 provider 已预留，当前共有 ${bundle.projectCount} 个项目可继续接真实存储。`
        : "当前还没有接入真实云端项目存储。",
      projectCount: bundle.projectCount,
    }),
  };
}

function createRemoteCloudStorageProvider(cloudStorageProviderUrl: string): CloudStorageProvider {
  return {
    isConfigured: () => true,
    fetchProjects: async () => {
      const response = await fetch(`${cloudStorageProviderUrl}/projects`, { cache: "no-store" });

      if (!response.ok) {
        return [];
      }

      return (await response.json()) as CloudProjectRecord[];
    },
    saveBundle: async (bundle) => {
      const response = await fetch(`${cloudStorageProviderUrl}/bundle`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(bundle),
      });

      if (!response.ok) {
        return {
          ok: false,
          message: "远端云端存储 provider 调用失败。",
          projectCount: bundle.projectCount,
        };
      }

      return (await response.json()) as CloudStorageProviderResult;
    },
  };
}

export function createCloudStorageProvider(): CloudStorageProvider {
  const providerConfig = getProviderConfig();

  if (providerConfig.cloudStorageProviderUrl) {
    return createRemoteCloudStorageProvider(providerConfig.cloudStorageProviderUrl);
  }

  return createLocalCloudStorageProvider();
}
