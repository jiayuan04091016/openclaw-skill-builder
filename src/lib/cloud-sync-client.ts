import { buildCloudSyncBundle, restoreProjectsFromCloud } from "@/lib/cloud-project-sync";
import { getRuntimeCapabilities } from "@/lib/runtime-capabilities";
import type { CloudProjectRecord, CloudSyncBundle, CloudSyncPlan, CloudSyncResult, ProjectRecord } from "@/types/app";

export type CloudSyncClient = {
  buildPlan: (projects: ProjectRecord[]) => CloudSyncPlan;
  buildBundle: (projects: ProjectRecord[]) => CloudSyncBundle;
  pushBundle: (projects: ProjectRecord[]) => Promise<CloudSyncResult>;
  restoreBundle: (payload: CloudSyncBundle | CloudProjectRecord[]) => ProjectRecord[];
};

export function createCloudSyncClient(): CloudSyncClient {
  const capabilities = getRuntimeCapabilities();

  return {
    buildPlan: (projects) => ({
      enabled: capabilities.cloudSyncEnabled,
      projectCount: projects.length,
      generatedProjectCount: projects.filter((project) => Boolean(project.draft)).length,
      importedProjectCount: projects.filter((project) => project.mode === "import").length,
      message: capabilities.cloudSyncEnabled
        ? "云端同步底座已开启，下一步可以接真实接口。"
        : projects.length
          ? "当前先以本机项目为主，后续接上真实接口后可把这批项目整体迁移到云端。"
          : "当前还没有可同步内容，先完成第一个项目最划算。",
    }),
    buildBundle: (projects) => buildCloudSyncBundle(projects),
    pushBundle: async (projects) => ({
      status: capabilities.cloudSyncEnabled ? "queued" : "not-configured",
      message: capabilities.cloudSyncEnabled
        ? "同步接口占位已准备好，后续接入真实服务端后即可开始推送。"
        : "当前还没有接真实云端接口，这一步先停留在迁移准备阶段。",
      projectCount: projects.length,
    }),
    restoreBundle: (payload) => restoreProjectsFromCloud(payload),
  };
}
