import { createAuthService } from "@/lib/auth-service";
import { createBrowserSessionRepository } from "@/lib/session-repository";
import type { SessionProfile } from "@/types/app";

export type SessionActionResult = {
  ok: boolean;
  message: string;
  sessionProfile: SessionProfile;
};

export type SessionActionService = {
  refreshProfile: () => Promise<SessionProfile>;
  signIn: () => Promise<SessionActionResult>;
  signOut: () => Promise<SessionActionResult>;
};

export function createSessionActionService(): SessionActionService {
  const authService = createAuthService();
  const sessionRepository = createBrowserSessionRepository();

  function persistProfile(sessionProfile: SessionProfile) {
    if (sessionProfile.mode === "authenticated") {
      sessionRepository.saveSessionProfile(sessionProfile);
    } else {
      sessionRepository.clearStoredSessionProfile();
    }

    return sessionProfile;
  }

  return {
    refreshProfile: async () => persistProfile(await authService.getCurrentProfile()),
    signIn: async () => {
      const result = await authService.signIn();
      const sessionProfile = persistProfile(await authService.getCurrentProfile());

      return {
        ...result,
        sessionProfile,
      };
    },
    signOut: async () => {
      const result = await authService.signOut();
      const sessionProfile = persistProfile(await authService.getCurrentProfile());

      return {
        ...result,
        sessionProfile,
      };
    },
  };
}
