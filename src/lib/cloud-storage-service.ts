import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import type { CloudProjectRecord, CloudSyncBundle } from "@/types/app";

export type CloudStorageService = {
  isConfigured: () => boolean;
  fetchProjects: () => Promise<CloudProjectRecord[]>;
  saveBundle: (bundle: CloudSyncBundle) => Promise<{ ok: boolean; message: string; projectCount: number }>;
};

export function createCloudStorageService(): CloudStorageService {
  const capabilities = getRuntimeCapabilities();

  return {
    isConfigured: () => capabilities.cloudSyncEnabled,
    fetchProjects: async () => [],
    saveBundle: async (bundle) => ({
      ok: capabilities.cloudSyncEnabled,
      message: capabilities.cloudSyncEnabled
        ? `云端存储服务已预留，当前共有 ${bundle.projectCount} 个项目可继续接真实存储。`
        : "当前还没有接入真实云端项目存储。",
      projectCount: bundle.projectCount,
    }),
  };
}
