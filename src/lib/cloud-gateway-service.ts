import {
  normalizeRemoteCloudProjectList,
  normalizeRemoteCloudStorageResult,
} from "@/lib/cloud-remote-contracts";
import { buildRemoteProviderUrl, requestRemoteJsonWithRetry } from "@/lib/remote-provider-client";
import { buildServerProviderHeaders, getServerProviderConfig } from "@/lib/server-provider-config";
import type { CloudProjectRecord, CloudSyncBundle } from "@/types/app";

export type CloudGatewayBundleResult = {
  ok: boolean;
  message: string;
  projectCount: number;
};

function buildGatewayHeaders(baseHeaders: HeadersInit | undefined, sessionToken: string) {
  const token = sessionToken.trim();
  if (!token) {
    return baseHeaders;
  }

  return {
    ...(baseHeaders ?? {}),
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchCloudGatewayProjects(sessionToken = ""): Promise<CloudProjectRecord[]> {
  const config = getServerProviderConfig();
  const retryAttempts = 3;

  if (!config.cloudStorage.url) {
    return [];
  }

  const projects = normalizeRemoteCloudProjectList(
    await requestRemoteJsonWithRetry<unknown>(
      buildRemoteProviderUrl(config.cloudStorage.url, "/projects"),
      {
        headers: buildGatewayHeaders(buildServerProviderHeaders(config.cloudStorage), sessionToken),
      },
      {
        attempts: retryAttempts,
        initialDelayMs: 250,
        backoffFactor: 2,
      },
    ),
  );

  return projects ?? [];
}

export async function saveCloudGatewayBundle(
  bundle: CloudSyncBundle,
  sessionToken = "",
): Promise<CloudGatewayBundleResult> {
  const config = getServerProviderConfig();
  const retryAttempts = 3;

  if (!config.cloudStorage.url) {
    return {
      ok: false,
      message: "当前还没有接入真实云端存储服务。",
      projectCount: bundle.projectCount,
    };
  }

  const result = normalizeRemoteCloudStorageResult(
    await requestRemoteJsonWithRetry<unknown>(
      buildRemoteProviderUrl(config.cloudStorage.url, "/bundle"),
      {
        method: "POST",
        payload: bundle,
        headers: buildGatewayHeaders(buildServerProviderHeaders(config.cloudStorage), sessionToken),
      },
      {
        attempts: retryAttempts,
        initialDelayMs: 250,
        backoffFactor: 2,
      },
    ),
    bundle.projectCount,
  );

  return (
    result ?? {
      ok: false,
      message: "云端网关调用远端 bundle 失败。",
      projectCount: bundle.projectCount,
    }
  );
}
