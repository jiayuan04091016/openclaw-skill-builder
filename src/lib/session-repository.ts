import { createAuthService } from "@/lib/auth-service";
import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import { createSessionStorageService } from "@/lib/session-storage-service";
import type { RepositoryCapabilities, SessionProfile, StoredSessionProfile } from "@/types/app";

export type SessionRepository = {
  getCapabilities: () => RepositoryCapabilities;
  loadSessionProfile: () => Promise<SessionProfile>;
  loadStoredSessionProfile: () => StoredSessionProfile | null;
  saveSessionProfile: (profile: SessionProfile) => StoredSessionProfile;
  clearStoredSessionProfile: () => void;
};

function resolveStorage(storage?: Storage) {
  if (storage) {
    return storage;
  }

  if (typeof window !== "undefined") {
    return window.localStorage;
  }

  return null;
}

export function createBrowserSessionRepository(storage?: Storage): SessionRepository {
  const capabilities = getRuntimeCapabilities();
  const authService = createAuthService();
  const browserStorage = resolveStorage(storage);
  const sessionStorageService = browserStorage ? createSessionStorageService(browserStorage) : null;

  return {
    getCapabilities: () => capabilities,
    loadSessionProfile: async () => authService.getCurrentProfile(),
    loadStoredSessionProfile: () => sessionStorageService?.load() ?? null,
    saveSessionProfile: (profile) =>
      sessionStorageService
        ? sessionStorageService.save(profile)
        : {
            ...profile,
            savedAt: new Date().toISOString(),
          },
    clearStoredSessionProfile: () => {
      sessionStorageService?.clear();
    },
  };
}
