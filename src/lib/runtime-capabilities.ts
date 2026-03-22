import { getProviderConfig } from "@/lib/provider-config";
import type { RepositoryCapabilities } from "@/types/app";

function readFlag(value: string | undefined) {
  return value === "1" || value === "true";
}

export function getRuntimeCapabilities(): RepositoryCapabilities {
  const providerConfig = getProviderConfig();
  const authEnabled = readFlag(process.env.NEXT_PUBLIC_ENABLE_AUTH) || Boolean(providerConfig.authProviderUrl);
  const cloudSyncEnabled =
    readFlag(process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC) || Boolean(providerConfig.cloudStorageProviderUrl);
  const enhancedImport = readFlag(process.env.NEXT_PUBLIC_ENABLE_ENHANCED_IMPORT);

  return {
    authEnabled,
    cloudSyncEnabled,
    importAnalysisLevel: enhancedImport ? "enhanced" : "basic",
    storageMode: cloudSyncEnabled ? "cloud" : "local",
  };
}
