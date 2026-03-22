import type { CloudStorageProviderResult } from "@/lib/cloud-storage-provider";
import type { CloudProjectRecord, CloudSyncBundle } from "@/types/app";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeCloudProjectRecord(value: unknown): CloudProjectRecord | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const id = readString(record.id);
  const mode = record.mode === "create" || record.mode === "import" ? record.mode : null;

  if (!id || !mode) {
    return null;
  }

  return {
    id,
    mode,
    title: readString(record.title),
    goal: readString(record.goal),
    description: readString(record.description),
    audience: readString(record.audience),
    mainTask: readString(record.mainTask),
    inputFormat: readString(record.inputFormat),
    outputFormat: readString(record.outputFormat),
    outputStyle:
      record.outputStyle === "simple" || record.outputStyle === "detailed" || record.outputStyle === "teaching"
        ? record.outputStyle
        : "simple",
    language: readString(record.language),
    warnings: readString(record.warnings),
    includeExamples: readBoolean(record.includeExamples) ?? true,
    resources: Array.isArray(record.resources) ? (record.resources as CloudProjectRecord["resources"]) : [],
    importedSkillText: readString(record.importedSkillText),
    importedSkillArchive: (record.importedSkillArchive as CloudProjectRecord["importedSkillArchive"]) ?? null,
    draft: (record.draft as CloudProjectRecord["draft"]) ?? null,
    createdAt: readString(record.createdAt) || new Date().toISOString(),
    updatedAt: readString(record.updatedAt) || new Date().toISOString(),
  };
}

export function normalizeRemoteCloudProjectList(value: unknown): CloudProjectRecord[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const projects = value.map(normalizeCloudProjectRecord);

  if (projects.some((project) => !project)) {
    return null;
  }

  return projects as CloudProjectRecord[];
}

export function normalizeRemoteCloudStorageResult(
  value: unknown,
  fallbackProjectCount: number,
): CloudStorageProviderResult | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const ok =
    readBoolean(record.ok) ??
    readBoolean(record.success) ??
    (readString(record.status) === "ok" ? true : readString(record.status) === "error" ? false : null);

  if (ok === null) {
    return null;
  }

  return {
    ok,
    message:
      readString(record.message) ||
      readString(record.detail) ||
      (ok ? "云端存储动作执行成功。" : "云端存储动作执行失败。"),
    projectCount: readNumber(record.projectCount) ?? fallbackProjectCount,
  };
}

export function buildSampleCloudSyncBundle(): CloudSyncBundle {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    projectCount: 1,
    projects: [
      {
        id: "sample-cloud-project",
        mode: "create",
        title: "云端同步测试",
        goal: "验证云端存储 provider",
        description: "",
        audience: "",
        mainTask: "",
        inputFormat: "",
        outputFormat: "",
        outputStyle: "simple",
        language: "中文",
        warnings: "",
        includeExamples: true,
        resources: [],
        importedSkillText: "",
        importedSkillArchive: null,
        draft: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}
