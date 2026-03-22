import type { SessionProfile, StoredSessionProfile } from "@/types/app";

const SESSION_STORAGE_KEY = "openclaw-session-profile-v1";

export type SessionStorageService = {
  load: () => StoredSessionProfile | null;
  save: (profile: SessionProfile) => StoredSessionProfile;
  clear: () => void;
};

export function createSessionStorageService(storage: Storage): SessionStorageService {
  return {
    load: () => {
      const raw = storage.getItem(SESSION_STORAGE_KEY);

      if (!raw) {
        return null;
      }

      try {
        const parsed = JSON.parse(raw) as StoredSessionProfile;

        if (!parsed?.mode || !parsed?.displayName) {
          return null;
        }

        return parsed;
      } catch {
        return null;
      }
    },
    save: (profile) => {
      const storedProfile: StoredSessionProfile = {
        ...profile,
        savedAt: new Date().toISOString(),
      };

      storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(storedProfile));
      return storedProfile;
    },
    clear: () => {
      storage.removeItem(SESSION_STORAGE_KEY);
    },
  };
}
