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

export function createAuthProvider(): AuthProvider {
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
