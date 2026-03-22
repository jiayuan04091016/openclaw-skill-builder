import { createAuthProvider, type AuthProviderResult } from "@/lib/auth-provider";
import type { SessionProfile } from "@/types/app";

export type AuthService = {
  isEnabled: () => boolean;
  getCurrentProfile: () => Promise<SessionProfile>;
  signIn: () => Promise<AuthProviderResult>;
  signOut: () => Promise<AuthProviderResult>;
};

export function createAuthService(): AuthService {
  const provider = createAuthProvider();

  return {
    isEnabled: () => provider.isEnabled(),
    getCurrentProfile: () => provider.getCurrentProfile(),
    signIn: () => provider.signIn(),
    signOut: () => provider.signOut(),
  };
}
