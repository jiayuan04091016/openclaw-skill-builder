import { getProviderConfig } from "@/lib/provider-config";

export type AuthProviderMode = "local" | "mock" | "remote";

export type AuthProviderModeReport = {
  mode: AuthProviderMode;
  target: string;
  reason: string;
};

function isLocalMockUrl(url: string) {
  return url.includes("/api/mock-providers/auth");
}

export function buildAuthProviderModeReport(): AuthProviderModeReport {
  const providerConfig = getProviderConfig();
  const target = providerConfig.authProviderUrl;

  if (!target) {
    return {
      mode: "local",
      target: "",
      reason: "当前未配置 auth provider 地址，系统仍然使用本地占位模式。",
    };
  }

  if (isLocalMockUrl(target)) {
    return {
      mode: "mock",
      target,
      reason: "当前 auth 已切到本地 mock provider，可用于联调前验证真实调用链。",
    };
  }

  return {
    mode: "remote",
    target,
    reason: "当前 auth 已指向真实远端 provider。",
  };
}
