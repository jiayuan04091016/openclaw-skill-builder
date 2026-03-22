import type { SessionRepository } from "@/lib/session-repository";
import type { SessionProfile, StoredSessionProfile } from "@/types/app";

export type SessionBootstrapResult = {
  sessionProfile: SessionProfile;
  storedSessionProfile: StoredSessionProfile | null;
};

export async function loadSessionProfile(repository: SessionRepository): Promise<SessionBootstrapResult> {
  const storedSessionProfile = repository.loadStoredSessionProfile();
  const sessionProfile = await repository.loadSessionProfile();

  if (sessionProfile.mode === "authenticated") {
    repository.saveSessionProfile(sessionProfile);
  } else if (storedSessionProfile?.mode === "authenticated") {
    repository.clearStoredSessionProfile();
  }

  return {
    sessionProfile,
    storedSessionProfile,
  };
}
