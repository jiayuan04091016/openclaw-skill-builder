import { createAuthService } from "@/lib/auth-service";
import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import type { RepositoryCapabilities, SessionProfile } from "@/types/app";

export type SessionRepository = {
  getCapabilities: () => RepositoryCapabilities;
  loadSessionProfile: () => Promise<SessionProfile>;
};

export function createBrowserSessionRepository(): SessionRepository {
  const capabilities = getRuntimeCapabilities();
  const authService = createAuthService();

  return {
    getCapabilities: () => capabilities,
    loadSessionProfile: () => authService.getCurrentProfile(),
  };
}
