import { runAuthGatewaySignIn, runAuthGatewaySignOut } from "@/lib/auth-gateway-service";
import { fetchCloudGatewayProjects, saveCloudGatewayBundle } from "@/lib/cloud-gateway-service";
import { buildCloudSyncBundle, mergeProjectsForCloudSync, restoreProjectsFromCloud } from "@/lib/cloud-project-sync";
import { createProjectService } from "@/lib/project-service";

export type SyncRoundtripSmokeReport = {
  signInOk: boolean;
  hasSessionToken: boolean;
  pushedProjectCount: number;
  bundleOk: boolean;
  fetchedProjectCount: number;
  mergedProjectCount: number;
  tieBreakerStable: boolean;
  signOutOk: boolean;
  ok: boolean;
};

export async function runSyncRoundtripSmoke(): Promise<SyncRoundtripSmokeReport> {
  const projectService = createProjectService();
  const signIn = await runAuthGatewaySignIn();
  const sessionToken = signIn.sessionToken?.trim() ?? "";
  const localA = projectService.createProject("create", "sync roundtrip local A");
  const localB = projectService.createProject("create", "sync roundtrip local B");
  const bundle = buildCloudSyncBundle([localA, localB]);
  const pushResult = await saveCloudGatewayBundle(bundle, sessionToken);
  const remoteProjects = await fetchCloudGatewayProjects(sessionToken);
  const restoredProjects = restoreProjectsFromCloud(remoteProjects);
  const mergedProjects = mergeProjectsForCloudSync([localA], restoredProjects);
  const tieStamp = new Date().toISOString();
  const localTie = {
    ...localA,
    id: "sync-tie-project",
    updatedAt: tieStamp,
    createdAt: tieStamp,
    description: "local richer project",
    resources: [...localA.resources, projectService.createResource("text", "local-note", "content")],
  };
  const cloudTie = {
    ...localTie,
    description: "",
    resources: [],
  };
  const tieMerged = mergeProjectsForCloudSync([localTie], [cloudTie]);
  const tieWinner = tieMerged.find((project) => project.id === localTie.id);
  const tieBreakerStable = Boolean(tieWinner && tieWinner.description === "local richer project");
  const signOut = await runAuthGatewaySignOut(sessionToken);

  const ok =
    signIn.ok &&
    pushResult.projectCount >= 1 &&
    restoredProjects.length >= 1 &&
    mergedProjects.length >= 1 &&
    tieBreakerStable &&
    signOut.ok;

  return {
    signInOk: signIn.ok,
    hasSessionToken: sessionToken.length > 0,
    pushedProjectCount: pushResult.projectCount,
    bundleOk: pushResult.ok,
    fetchedProjectCount: restoredProjects.length,
    mergedProjectCount: mergedProjects.length,
    tieBreakerStable,
    signOutOk: signOut.ok,
    ok,
  };
}
