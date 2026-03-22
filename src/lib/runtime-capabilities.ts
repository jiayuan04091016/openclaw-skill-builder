import type { RepositoryCapabilities } from "@/types/app";

function readFlag(value: string | undefined) {
  return value === "1" || value === "true";
}

export function getRuntimeCapabilities(): RepositoryCapabilities {
  const authEnabled = readFlag(process.env.NEXT_PUBLIC_ENABLE_AUTH);
  const cloudSyncEnabled = readFlag(process.env.NEXT_PUBLIC_ENABLE_CLOUD_SYNC);
  const enhancedImport = readFlag(process.env.NEXT_PUBLIC_ENABLE_ENHANCED_IMPORT);

  return {
    authEnabled,
    cloudSyncEnabled,
    importAnalysisLevel: enhancedImport ? "enhanced" : "basic",
    storageMode: cloudSyncEnabled ? "cloud" : "local",
  };
}
