import { getProviderConfig } from "@/lib/provider-config";

export type CloudProviderMode = "local" | "mock" | "remote";

export type CloudProviderModeReport = {
  mode: CloudProviderMode;
  target: string;
  reason: string;
};

function isLocalMockUrl(url: string) {
  return url.includes("/api/mock-providers/cloud");
}

export function buildCloudProviderModeReport(): CloudProviderModeReport {
  const target = getProviderConfig().cloudStorageProviderUrl;

  if (!target) {
    return {
      mode: "local",
      target: "",
      reason: "当前未配置云端存储 provider 地址，系统仍然使用本地占位模式。",
    };
  }

  if (isLocalMockUrl(target)) {
    return {
      mode: "mock",
      target,
      reason: "当前云端存储已切到本地 mock provider，可用于联调前验证真实调用链。",
    };
  }

  return {
    mode: "remote",
    target,
    reason: "当前云端存储已指向真实远端 provider。",
  };
}

