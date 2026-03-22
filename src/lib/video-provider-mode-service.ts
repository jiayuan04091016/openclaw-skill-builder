import { getProviderConfig } from "@/lib/provider-config";

export type VideoProviderMode = "local" | "mock" | "remote";

export type VideoProviderModeReport = {
  mode: VideoProviderMode;
  target: string;
  reason: string;
};

function isLocalMockUrl(url: string) {
  return url.includes("/api/mock-providers/video");
}

export function buildVideoProviderModeReport(): VideoProviderModeReport {
  const target = getProviderConfig().videoEnhancementProviderUrl;

  if (!target) {
    return {
      mode: "local",
      target: "",
      reason: "当前未配置视频增强 provider 地址，系统仍然使用本地占位模式。",
    };
  }

  if (isLocalMockUrl(target)) {
    return {
      mode: "mock",
      target,
      reason: "当前视频增强已切到本地 mock provider，可用于联调前验证真实调用链。",
    };
  }

  return {
    mode: "remote",
    target,
    reason: "当前视频增强已指向真实远端 provider。",
  };
}
