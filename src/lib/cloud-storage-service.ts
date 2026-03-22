import { createCloudStorageProvider, type CloudStorageProviderResult } from "@/lib/cloud-storage-provider";
import type { CloudProjectRecord, CloudSyncBundle } from "@/types/app";

export type CloudStorageService = {
  isConfigured: () => boolean;
  fetchProjects: () => Promise<CloudProjectRecord[]>;
  saveBundle: (bundle: CloudSyncBundle) => Promise<CloudStorageProviderResult>;
};

export function createCloudStorageService(): CloudStorageService {
  const provider = createCloudStorageProvider();

  return {
    isConfigured: () => provider.isConfigured(),
    fetchProjects: () => provider.fetchProjects(),
    saveBundle: (bundle) => provider.saveBundle(bundle),
  };
}
