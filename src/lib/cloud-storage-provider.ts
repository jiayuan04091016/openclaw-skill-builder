import { getProviderConfig } from "@/lib/provider-config";
import { buildRemoteProviderUrl, requestRemoteJson } from "@/lib/remote-provider-client";
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
      const projects = await requestRemoteJson<CloudProjectRecord[]>(
        buildRemoteProviderUrl(cloudStorageProviderUrl, "/projects"),
      );

      return projects ?? [];
    },
    saveBundle: async (bundle) => {
      const result = await requestRemoteJson<CloudStorageProviderResult>(
        buildRemoteProviderUrl(cloudStorageProviderUrl, "/bundle"),
        {
          method: "POST",
          payload: bundle,
        },
      );

      return (
        result ?? {
          ok: false,
          message: "远端云端存储 provider 调用失败。",
          projectCount: bundle.projectCount,
        }
      );
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
