import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import type { RepositoryCapabilities, SessionProfile } from "@/types/app";

export type SessionRepository = {
  getCapabilities: () => RepositoryCapabilities;
  loadSessionProfile: () => Promise<SessionProfile>;
};

export function createBrowserSessionRepository(): SessionRepository {
  const capabilities = getRuntimeCapabilities();

  return {
    getCapabilities: () => capabilities,
    loadSessionProfile: async () => ({
      mode: capabilities.authEnabled ? "authenticated" : "guest",
      displayName: capabilities.authEnabled ? "已登录用户" : "本机访客",
      email: null,
    }),
  };
}
