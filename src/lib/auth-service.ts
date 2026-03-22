import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import { buildGuestSessionProfile } from "@/lib/session-service";
import type { SessionProfile } from "@/types/app";

export type AuthService = {
  isEnabled: () => boolean;
  getCurrentProfile: () => Promise<SessionProfile>;
  signIn: () => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<{ ok: boolean; message: string }>;
};

export function createAuthService(): AuthService {
  const capabilities = getRuntimeCapabilities();

  return {
    isEnabled: () => capabilities.authEnabled,
    getCurrentProfile: async () => buildGuestSessionProfile(capabilities.authEnabled),
    signIn: async () => ({
      ok: capabilities.authEnabled,
      message: capabilities.authEnabled ? "登录接口已预留，可继续接真实服务。" : "当前还没有接入真实登录服务。",
    }),
    signOut: async () => ({
      ok: capabilities.authEnabled,
      message: capabilities.authEnabled ? "登出接口已预留，可继续接真实服务。" : "当前仍是本机访客模式。",
    }),
  };
}
