import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import { buildGuestSessionProfile } from "@/lib/session-service";
import type { RepositoryCapabilities, SessionProfile } from "@/types/app";

export type SessionRepository = {
  getCapabilities: () => RepositoryCapabilities;
  loadSessionProfile: () => Promise<SessionProfile>;
};

export function createBrowserSessionRepository(): SessionRepository {
  const capabilities = getRuntimeCapabilities();

  return {
    getCapabilities: () => capabilities,
    loadSessionProfile: async () => buildGuestSessionProfile(capabilities.authEnabled),
  };
}
