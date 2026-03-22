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
  const signOut = await runAuthGatewaySignOut();

  return {
    profileMode: profile.mode,
    profileDisplayName: profile.displayName,
    signInOk: signIn.ok,
    signInMessage: signIn.message,
    signOutOk: signOut.ok,
    signOutMessage: signOut.message,
    ok: profile.mode === "guest" && signIn.ok === false && signOut.ok === true,
  };
}
