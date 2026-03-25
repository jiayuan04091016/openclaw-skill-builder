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

function toTimestamp(value: string) {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function calcProjectCompletenessScore(project: ProjectRecord) {
  let score = 0;

  if (project.title.trim()) score += 2;
  if (project.goal.trim()) score += 2;
  if (project.description.trim()) score += 2;
  if (project.mainTask.trim()) score += 2;
  if (project.inputFormat.trim()) score += 1;
  if (project.outputFormat.trim()) score += 1;
  if (project.warnings.trim()) score += 1;
  if (project.importedSkillText.trim()) score += 2;
  if (project.draft) score += 2;
  score += project.resources.length * 2;

  return score;
}

function pickPreferredProject(localProject: ProjectRecord, cloudProject: ProjectRecord) {
  const localUpdated = toTimestamp(localProject.updatedAt);
  const cloudUpdated = toTimestamp(cloudProject.updatedAt);

  if (cloudUpdated > localUpdated) {
    return cloudProject;
  }

  if (cloudUpdated < localUpdated) {
    return localProject;
  }

  const localCreated = toTimestamp(localProject.createdAt);
  const cloudCreated = toTimestamp(cloudProject.createdAt);

  if (cloudCreated > localCreated) {
    return cloudProject;
  }

  if (cloudCreated < localCreated) {
    return localProject;
  }

  const localScore = calcProjectCompletenessScore(localProject);
  const cloudScore = calcProjectCompletenessScore(cloudProject);

  if (cloudScore > localScore) {
    return cloudProject;
  }

  if (cloudScore < localScore) {
    return localProject;
  }

  return localProject;
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

    all[existingIndex] = pickPreferredProject(existing, cloudProject);
  }

  return normalizeProjects(all).sort((a, b) => {
    const updatedDiff = toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt);
    if (updatedDiff !== 0) {
      return updatedDiff;
    }

    const createdDiff = toTimestamp(b.createdAt) - toTimestamp(a.createdAt);
    if (createdDiff !== 0) {
      return createdDiff;
    }

    return a.id.localeCompare(b.id);
  });
}
