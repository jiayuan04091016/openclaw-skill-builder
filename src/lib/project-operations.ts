import { createId } from "@/lib/skill-builder";
import type { BuilderMode, ProjectRecord } from "@/types/app";

function nowIso() {
  return new Date().toISOString();
}

export function createEmptyProject(mode: BuilderMode, seedGoal = ""): ProjectRecord {
  const createdAt = nowIso();

  return {
    id: createId(),
    mode,
    title: "",
    goal: seedGoal,
    description: "",
    audience: "",
    mainTask: "",
    inputFormat: "",
    outputFormat: "",
    outputStyle: "simple",
    language: "zh-CN",
    warnings: "",
    includeExamples: true,
    resources: [],
    importedSkillText: "",
    draft: null,
    createdAt,
    updatedAt: createdAt,
  };
}

export function patchProject(project: ProjectRecord, patch: Partial<ProjectRecord>): ProjectRecord {
  return {
    ...project,
    ...patch,
    updatedAt: nowIso(),
  };
}

export function sortProjectsByUpdatedAt(projects: ProjectRecord[]) {
  return [...projects].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export function upsertProjectRecord(projects: ProjectRecord[], project: ProjectRecord) {
  const index = projects.findIndex((item) => item.id === project.id);

  if (index === -1) {
    return sortProjectsByUpdatedAt([project, ...projects]);
  }

  const next = [...projects];
  next[index] = project;
  return sortProjectsByUpdatedAt(next);
}

export function duplicateProjectRecord(project: ProjectRecord): ProjectRecord {
  const timestamp = nowIso();

  return {
    ...project,
    id: createId(),
    title: `${project.title || "未命名项目"} - 副本`,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function removeProjectRecord(projects: ProjectRecord[], projectId: string) {
  return projects.filter((item) => item.id !== projectId);
}
