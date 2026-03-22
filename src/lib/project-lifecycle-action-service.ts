import { createProjectService } from "@/lib/project-service";
import { buildStructuredSpec } from "@/lib/skill-builder";
import type { BuilderMode, ProjectRecord } from "@/types/app";

type ProjectLifecycleResult = {
  project: ProjectRecord;
  statusMessage: string;
};

type ProjectDeletionResult = {
  projects: ProjectRecord[];
  activeProjectId: string | null;
  homeGoal: string;
  statusMessage: string;
};

export type ProjectLifecycleActionService = {
  createProject: (mode: BuilderMode, goal?: string) => ProjectLifecycleResult;
  generateDraft: (project: ProjectRecord) => ProjectLifecycleResult;
  duplicateProject: (project: ProjectRecord) => ProjectLifecycleResult;
  deleteProject: (projects: ProjectRecord[], projectId: string, activeProjectId: string | null) => ProjectDeletionResult;
};

export function createProjectLifecycleActionService(): ProjectLifecycleActionService {
  const projectService = createProjectService();

  return {
    createProject: (mode, goal = "") => {
      const project = projectService.createProject(mode, goal);

      return {
        project,
        statusMessage:
          mode === "import"
            ? "已进入导入模式，请先添加已有 Skill 内容。"
            : "已创建新项目，现在可以开始填写目标。",
      };
    },
    generateDraft: (project) => {
      const draft = projectService.buildDraft(project);
      const nextProject = projectService.patchProject(project, {
        draft,
        title: project.title || buildStructuredSpec(project).skillName,
      });

      return {
        project: nextProject,
        statusMessage: "内容已生成，现在可以预览、调整并导出。",
      };
    },
    duplicateProject: (project) => ({
      project: projectService.duplicateProject(project),
      statusMessage: "已复制为新版本。",
    }),
    deleteProject: (projects, projectId, activeProjectId) => {
      const nextProjects = projectService.removeProject(projects, projectId);
      const nextActiveProjectId =
        activeProjectId === projectId ? (nextProjects[0]?.id ?? null) : activeProjectId;

      if (nextProjects.length) {
        return {
          projects: nextProjects,
          activeProjectId: nextActiveProjectId,
          homeGoal: nextProjects[0]?.goal ?? "",
          statusMessage: "项目已删除，已切换到列表里的下一个项目。",
        };
      }

      return {
        projects: nextProjects,
        activeProjectId: null,
        homeGoal: "",
        statusMessage: "项目已删除。当前已经没有项目了，可以从零开始创建新的内容。",
      };
    },
  };
}
