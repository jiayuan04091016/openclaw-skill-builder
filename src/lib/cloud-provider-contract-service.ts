import { getProviderConfig } from "@/lib/provider-config";
import { buildRemoteProviderUrl, requestRemoteJson } from "@/lib/remote-provider-client";
import type { CloudStorageProviderResult } from "@/lib/cloud-storage-provider";
import type { CloudProjectRecord, CloudSyncBundle } from "@/types/app";

export type CloudProviderContractReport = {
  configured: boolean;
  projectsShapeValid: boolean;
  bundleShapeValid: boolean;
  allValid: boolean;
  issues: string[];
};

function isValidCloudProjectRecord(value: unknown): value is CloudProjectRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    (candidate.mode === "create" || candidate.mode === "import") &&
    typeof candidate.title === "string" &&
    typeof candidate.goal === "string" &&
    Array.isArray(candidate.resources)
  );
}

function isValidCloudProjectList(value: unknown): value is CloudProjectRecord[] {
  return Array.isArray(value) && value.every(isValidCloudProjectRecord);
}

function isValidCloudStorageProviderResult(value: unknown): value is CloudStorageProviderResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.ok === "boolean" &&
    typeof candidate.message === "string" &&
    typeof candidate.projectCount === "number"
  );
}

function createSampleBundle(): CloudSyncBundle {
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

export async function buildCloudProviderContractReport(): Promise<CloudProviderContractReport> {
  const providerConfig = getProviderConfig();

  if (!providerConfig.cloudStorageProviderUrl) {
    return {
      configured: false,
      projectsShapeValid: false,
      bundleShapeValid: false,
      allValid: false,
      issues: ["未配置 cloud-storage provider 地址。"],
    };
  }

  const issues: string[] = [];
  const projects = await requestRemoteJson<unknown>(
    buildRemoteProviderUrl(providerConfig.cloudStorageProviderUrl, "/projects"),
  );
  const bundleResult = await requestRemoteJson<unknown>(
    buildRemoteProviderUrl(providerConfig.cloudStorageProviderUrl, "/bundle"),
    {
      method: "POST",
      payload: createSampleBundle(),
    },
  );

  const projectsShapeValid = isValidCloudProjectList(projects);
  const bundleShapeValid = isValidCloudStorageProviderResult(bundleResult);

  if (!projectsShapeValid) {
    issues.push("GET /projects 返回结构不符合当前前端约定。");
  }

  if (!bundleShapeValid) {
    issues.push("POST /bundle 返回结构不符合当前前端约定。");
  }

  return {
    configured: true,
    projectsShapeValid,
    bundleShapeValid,
    allValid: projectsShapeValid && bundleShapeValid,
    issues,
  };
}
