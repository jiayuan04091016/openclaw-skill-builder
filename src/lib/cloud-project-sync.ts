import { normalizeProjects } from "@/lib/project-normalizer";
import type { CloudProjectRecord, CloudSyncBundle, ProjectRecord } from "@/types/app";

export function serializeProjectForCloud(project: ProjectRecord): CloudProjectRecord {
  return {
    id: project.id,
    mode: project.mode,
    title: project.title,
    goal: project.goal,
    description: project.description,
    audience: project.audience,
    mainTask: project.mainTask,
    inputFormat: project.inputFormat,
    outputFormat: project.outputFormat,
    outputStyle: project.outputStyle,
    language: project.language,
    warnings: project.warnings,
    includeExamples: project.includeExamples,
    resources: project.resources.map((resource) => ({
      id: resource.id,
      type: resource.type,
      name: resource.name,
      content: resource.content,
      processingSummary: resource.processingSummary,
      processingUpdatedAt: resource.processingUpdatedAt,
      createdAt: resource.createdAt,
    })),
    importedSkillText: project.importedSkillText,
    importedSkillArchive: project.importedSkillArchive,
    draft: project.draft,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function buildCloudSyncBundle(projects: ProjectRecord[]): CloudSyncBundle {
  const serializedProjects = projects.map(serializeProjectForCloud);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    projectCount: serializedProjects.length,
    projects: serializedProjects,
  };
}

export function restoreProjectsFromCloud(bundle: CloudSyncBundle | CloudProjectRecord[]): ProjectRecord[] {
  if (Array.isArray(bundle)) {
    return normalizeProjects(bundle);
  }

  return normalizeProjects(bundle.projects);
}

export function mergeProjectsForCloudSync(localProjects: ProjectRecord[], cloudProjects: ProjectRecord[]) {
  const all = [...localProjects];

  for (const cloudProject of cloudProjects) {
    const existingIndex = all.findIndex((project) => project.id === cloudProject.id);

    if (existingIndex === -1) {
      all.push(cloudProject);
      continue;
    }

    const existing = all[existingIndex];

    all[existingIndex] =
      new Date(cloudProject.updatedAt).getTime() >= new Date(existing.updatedAt).getTime() ? cloudProject : existing;
  }

  return normalizeProjects(all).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}
