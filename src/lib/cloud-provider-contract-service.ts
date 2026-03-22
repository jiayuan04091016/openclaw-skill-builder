import {
  buildSampleCloudSyncBundle,
  normalizeRemoteCloudProjectList,
  normalizeRemoteCloudStorageResult,
} from "@/lib/cloud-remote-contracts";
import { buildRemoteProviderUrl, requestRemoteJson } from "@/lib/remote-provider-client";
import { buildServerProviderHeaders, getServerProviderConfig } from "@/lib/server-provider-config";

export type CloudProviderContractReport = {
  configured: boolean;
  projectsShapeValid: boolean;
  bundleShapeValid: boolean;
  allValid: boolean;
  issues: string[];
};

export async function buildCloudProviderContractReport(): Promise<CloudProviderContractReport> {
  const providerConfig = getServerProviderConfig();
  const headers = buildServerProviderHeaders(providerConfig.cloudStorage);

  if (!providerConfig.cloudStorage.url) {
    return {
      configured: false,
      projectsShapeValid: false,
      bundleShapeValid: false,
      allValid: false,
      issues: ["未配置 cloud-storage provider 地址。"],
    };
  }

  const issues: string[] = [];
  const sampleBundle = buildSampleCloudSyncBundle();
  const projects = normalizeRemoteCloudProjectList(
    await requestRemoteJson<unknown>(buildRemoteProviderUrl(providerConfig.cloudStorage.url, "/projects"), {
      headers,
    }),
  );
  const bundleResult = normalizeRemoteCloudStorageResult(
    await requestRemoteJson<unknown>(buildRemoteProviderUrl(providerConfig.cloudStorage.url, "/bundle"), {
      method: "POST",
      payload: sampleBundle,
      headers,
    }),
    sampleBundle.projectCount,
  );

  const projectsShapeValid = Array.isArray(projects);
  const bundleShapeValid = Boolean(bundleResult);

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
