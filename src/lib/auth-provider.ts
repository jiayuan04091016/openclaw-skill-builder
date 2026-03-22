import { getProviderConfig } from "@/lib/provider-config";
import { getClientGatewayUrl } from "@/lib/provider-gateway-client";
import { buildRemoteProviderUrl, requestRemoteJson } from "@/lib/remote-provider-client";
import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import {
  normalizeRemoteAuthResult,
  normalizeRemoteSessionProfile,
} from "@/lib/auth-remote-contracts";
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
      message: capabilities.authEnabled
        ? "登录 provider 已预留，可以继续接真实认证服务。"
        : "当前还没有接入真实登录服务。",
    }),
    signOut: async () => ({
      ok: capabilities.authEnabled,
      message: capabilities.authEnabled
        ? "登出 provider 已预留，可以继续接真实认证服务。"
        : "当前仍然是本机访客模式。",
    }),
  };
}

function createRemoteAuthProvider(authProviderUrl: string): AuthProvider {
  return {
    isEnabled: () => true,
    getCurrentProfile: async () => {
      const profile = normalizeRemoteSessionProfile(
        await requestRemoteJson<unknown>(buildRemoteProviderUrl(authProviderUrl, "/profile")),
      );

      return profile ?? buildGuestSessionProfile(true);
    },
    signIn: async () => {
      const result = normalizeRemoteAuthResult(
        await requestRemoteJson<unknown>(buildRemoteProviderUrl(authProviderUrl, "/sign-in"), {
          method: "POST",
        }),
      );

      return (
        result ?? {
          ok: false,
          message: "远端登录 provider 调用失败。",
        }
      );
    },
    signOut: async () => {
      const result = normalizeRemoteAuthResult(
        await requestRemoteJson<unknown>(buildRemoteProviderUrl(authProviderUrl, "/sign-out"), {
          method: "POST",
        }),
      );

      return (
        result ?? {
          ok: false,
          message: "远端登出 provider 调用失败。",
        }
      );
    },
  };
}

function createGatewayAuthProvider(gatewayBaseUrl: string): AuthProvider {
  return createRemoteAuthProvider(gatewayBaseUrl);
}

export function createAuthProvider(): AuthProvider {
  const providerConfig = getProviderConfig();

  if (providerConfig.authProviderUrl) {
    return createRemoteAuthProvider(providerConfig.authProviderUrl);
  }

  const gatewayBaseUrl = getClientGatewayUrl("/api/provider/auth");

  if (gatewayBaseUrl) {
    return createGatewayAuthProvider(gatewayBaseUrl);
  }

  return createLocalAuthProvider();
}
