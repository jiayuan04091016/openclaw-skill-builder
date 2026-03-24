import { runAuthGatewaySignIn, runAuthGatewaySignOut } from "@/lib/auth-gateway-service";
import { saveCloudGatewayBundle, fetchCloudGatewayProjects } from "@/lib/cloud-gateway-service";
import { buildCloudSyncBundle } from "@/lib/cloud-project-sync";
import { createProjectService } from "@/lib/project-service";

export type AuthCloudBridgeSmokeReport = {
  signInOk: boolean;
  hasSessionToken: boolean;
  cloudFetchCount: number;
  cloudBundleOk: boolean;
  cloudBundleMessage: string;
  signOutOk: boolean;
  ok: boolean;
};

export async function runAuthCloudBridgeSmoke(): Promise<AuthCloudBridgeSmokeReport> {
  const signIn = await runAuthGatewaySignIn();
  const token = signIn.sessionToken?.trim() ?? "";
  const projectService = createProjectService();
  const sampleProject = projectService.createProject("create", "auth-cloud bridge smoke");
  const projects = await fetchCloudGatewayProjects(token);
  const bundle = await saveCloudGatewayBundle(buildCloudSyncBundle([sampleProject]), token);
  const signOut = await runAuthGatewaySignOut(token);

  const ok =
    signIn.ok &&
    token.length > 0 &&
    projects.length >= 0 &&
    bundle.projectCount === 1 &&
    typeof bundle.ok === "boolean" &&
    signOut.ok;

  return {
    signInOk: signIn.ok,
    hasSessionToken: token.length > 0,
    cloudFetchCount: projects.length,
    cloudBundleOk: bundle.ok,
    cloudBundleMessage: bundle.message,
    signOutOk: signOut.ok,
    ok,
  };
}

