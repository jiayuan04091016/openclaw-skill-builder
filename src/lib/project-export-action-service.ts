import { createProjectTransferService } from "@/lib/project-transfer-service";
import type { ProjectRecord } from "@/types/app";

type ProjectExportResult = {
  blob: Blob;
  fileName: string;
  statusMessage: string;
};

export type ProjectExportActionService = {
  exportCurrentProject: (project: ProjectRecord | null) => Promise<ProjectExportResult | null>;
  exportProjectById: (projects: ProjectRecord[], projectId: string) => Promise<ProjectExportResult | null>;
};

export function createProjectExportActionService(): ProjectExportActionService {
  const projectTransferService = createProjectTransferService();

  return {
    exportCurrentProject: async (project) => {
      if (!project) {
        return null;
      }

      const { blob, fileName } = await projectTransferService.exportProject(project);

      return {
        blob,
        fileName,
        statusMessage: `导出成功：${fileName}，压缩包已经开始下载。`,
      };
    },
    exportProjectById: async (projects, projectId) => {
      const target = projects.find((item) => item.id === projectId);

      if (!target) {
        return null;
      }

      const { blob, fileName } = await projectTransferService.exportProject(target);

      return {
        blob,
        fileName,
        statusMessage: `已开始导出：${fileName}`,
      };
    },
  };
}
