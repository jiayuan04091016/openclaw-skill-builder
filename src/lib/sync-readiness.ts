import type { CloudMigrationPreview, ProjectRecord } from "@/types/app";

export function buildCloudMigrationPreview(projects: ProjectRecord[]): CloudMigrationPreview {
  const latestProjectUpdatedAt =
    projects.length > 0
      ? [...projects]
          .sort((left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt))[0]
          ?.updatedAt ?? null
      : null;

  return {
    readyProjectCount: projects.length,
    generatedProjectCount: projects.filter((project) => Boolean(project.draft)).length,
    importedProjectCount: projects.filter((project) => project.mode === "import").length,
    resourceCount: projects.reduce((total, project) => total + project.resources.length, 0),
    latestProjectUpdatedAt,
  };
}
