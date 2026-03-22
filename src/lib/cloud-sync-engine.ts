import { buildCloudSyncBundle, mergeProjectsForCloudSync, restoreProjectsFromCloud } from "@/lib/cloud-project-sync";
import type { CloudProjectGateway } from "@/lib/cloud-project-gateway";
import type { CloudSyncBundle, CloudSyncPlan, CloudSyncResult, ProjectRecord } from "@/types/app";

export type CloudSyncEngine = {
  buildPlan: (projects: ProjectRecord[]) => CloudSyncPlan;
  buildBundle: (projects: ProjectRecord[]) => CloudSyncBundle;
  pushProjects: (projects: ProjectRecord[]) => Promise<CloudSyncResult>;
  pullAndMerge: (localProjects: ProjectRecord[]) => Promise<ProjectRecord[]>;
};

export function createCloudSyncEngine(gateway: CloudProjectGateway): CloudSyncEngine {
  return {
    buildPlan: (projects) => ({
      enabled: gateway.isEnabled(),
      projectCount: projects.length,
      generatedProjectCount: projects.filter((project) => Boolean(project.draft)).length,
      importedProjectCount: projects.filter((project) => project.mode === "import").length,
      message: gateway.isEnabled()
        ? "云端同步接口骨架已准备好，下一步可以接真实账号和远端项目列表。"
        : projects.length
          ? "当前仍以本机项目为主，后续接上真实云端后可以把这批项目整体迁移。"
          : "当前还没有可同步内容，先完成第一个项目最划算。",
    }),
    buildBundle: (projects) => buildCloudSyncBundle(projects),
    pushProjects: async (projects) => {
      const bundle = buildCloudSyncBundle(projects);
      const result = await gateway.pushBundle(bundle);

      return {
        status: result.ok ? "queued" : "not-configured",
        message: result.message,
        projectCount: result.projectCount,
      };
    },
    pullAndMerge: async (localProjects) => {
      const remoteProjects = await gateway.pullProjects();
      const restoredProjects = restoreProjectsFromCloud(remoteProjects);
      return mergeProjectsForCloudSync(localProjects, restoredProjects);
    },
  };
}
