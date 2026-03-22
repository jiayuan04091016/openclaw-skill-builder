import { getProviderConfig } from "@/lib/provider-config";
import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import { buildGuestSessionProfile } from "@/lib/session-service";
import type { SessionProfile } from "@/types/app";

export type AuthProviderResult = {
  ok: boolean;
  message: string;
};

export type AuthProvider = {
  isEnabled: () => boolean;
  getCurrentProfile: () => Promise<SessionProfile>;
  signIn: () => Promise<AuthProviderResult>;
  signOut: () => Promise<AuthProviderResult>;
};

function createLocalAuthProvider(): AuthProvider {
  const capabilities = getRuntimeCapabilities();

  return {
    isEnabled: () => capabilities.authEnabled,
    getCurrentProfile: async () => buildGuestSessionProfile(capabilities.authEnabled),
    signIn: async () => ({
      ok: capabilities.authEnabled,
      message: capabilities.authEnabled ? "登录 provider 已预留，可继续接真实认证服务。" : "当前还没有接入真实登录服务。",
    }),
    signOut: async () => ({
      ok: capabilities.authEnabled,
      message: capabilities.authEnabled ? "登出 provider 已预留，可继续接真实认证服务。" : "当前仍然是本机访客模式。",
    }),
  };
}

function createRemoteAuthProvider(authProviderUrl: string): AuthProvider {
  return {
    isEnabled: () => true,
    getCurrentProfile: async () => {
      const response = await fetch(`${authProviderUrl}/profile`, { cache: "no-store" });

      if (!response.ok) {
        return buildGuestSessionProfile(true);
      }

      return (await response.json()) as SessionProfile;
    },
    signIn: async () => {
      const response = await fetch(`${authProviderUrl}/sign-in`, { method: "POST" });

      if (!response.ok) {
        return {
          ok: false,
          message: "远端登录 provider 调用失败。",
        };
      }

      return (await response.json()) as AuthProviderResult;
    },
    signOut: async () => {
      const response = await fetch(`${authProviderUrl}/sign-out`, { method: "POST" });

      if (!response.ok) {
        return {
          ok: false,
          message: "远端登出 provider 调用失败。",
        };
      }

      return (await response.json()) as AuthProviderResult;
    },
  };
}

export function createAuthProvider(): AuthProvider {
  const providerConfig = getProviderConfig();

  if (providerConfig.authProviderUrl) {
    return createRemoteAuthProvider(providerConfig.authProviderUrl);
  }

  return createLocalAuthProvider();
}
