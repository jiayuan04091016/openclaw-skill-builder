import { getAuthGatewayProfile, runAuthGatewaySignIn, runAuthGatewaySignOut } from "@/lib/auth-gateway-service";

export type AuthGatewaySmokeReport = {
  profileMode: "guest" | "authenticated";
  profileDisplayName: string;
  signInOk: boolean;
  signInMessage: string;
  signOutOk: boolean;
  signOutMessage: string;
  ok: boolean;
};

export async function runAuthGatewaySmoke(): Promise<AuthGatewaySmokeReport> {
  const profile = await getAuthGatewayProfile();
  const signIn = await runAuthGatewaySignIn();
  const signOut = await runAuthGatewaySignOut(signIn.sessionToken || "");
  const ok =
    (profile.mode === "guest" || profile.mode === "authenticated") &&
    profile.displayName.trim().length > 0 &&
    signIn.message.trim().length > 0 &&
    signOut.ok &&
    signOut.message.trim().length > 0;

  return {
    profileMode: profile.mode,
    profileDisplayName: profile.displayName,
    signInOk: signIn.ok,
    signInMessage: signIn.message,
    signOutOk: signOut.ok,
    signOutMessage: signOut.message,
    ok,
  };
}

