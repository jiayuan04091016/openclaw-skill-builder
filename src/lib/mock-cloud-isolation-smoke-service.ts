import { saveMockCloudBundle, readMockCloudProjects } from "@/lib/mock-cloud-store";
import { buildCloudSyncBundle } from "@/lib/cloud-project-sync";
import { createProjectService } from "@/lib/project-service";

export type MockCloudIsolationSmokeReport = {
  tokenAProjectCount: number;
  tokenBProjectCount: number;
  isolated: boolean;
  ok: boolean;
};

export function runMockCloudIsolationSmoke(): MockCloudIsolationSmokeReport {
  const projectService = createProjectService();
  const tokenA = "mock-smoke-user-a";
  const tokenB = "mock-smoke-user-b";
  const projectA = projectService.createProject("create", "token A project");
  const projectB = projectService.createProject("create", "token B project");

  saveMockCloudBundle(buildCloudSyncBundle([projectA]), tokenA);
  saveMockCloudBundle(buildCloudSyncBundle([projectB]), tokenB);

  const tokenAProjects = readMockCloudProjects(tokenA);
  const tokenBProjects = readMockCloudProjects(tokenB);
  const isolated =
    tokenAProjects.length === 1 &&
    tokenBProjects.length === 1 &&
    tokenAProjects[0]?.id !== tokenBProjects[0]?.id;

  return {
    tokenAProjectCount: tokenAProjects.length,
    tokenBProjectCount: tokenBProjects.length,
    isolated,
    ok: isolated,
  };
}

