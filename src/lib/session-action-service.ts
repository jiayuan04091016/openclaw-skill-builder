import { createAuthService } from "@/lib/auth-service";
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

  return {
    refreshProfile: () => authService.getCurrentProfile(),
    signIn: async () => {
      const result = await authService.signIn();
      const sessionProfile = await authService.getCurrentProfile();

      return {
        ...result,
        sessionProfile,
      };
    },
    signOut: async () => {
      const result = await authService.signOut();
      const sessionProfile = await authService.getCurrentProfile();

      return {
        ...result,
        sessionProfile,
      };
    },
  };
}
