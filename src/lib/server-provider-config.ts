function readValue(value: string | undefined) {
  return value?.trim() || "";
}

function readServerValue(serverValue: string | undefined, publicValue: string | undefined) {
  return readValue(serverValue) || readValue(publicValue);
}

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export type ServerProviderTargetConfig = {
  url: string;
  healthPath: string;
  authHeaderName: string;
  authHeaderValue: string;
};

export type ServerProviderConfig = {
  auth: ServerProviderTargetConfig;
  cloudStorage: ServerProviderTargetConfig;
  ocr: ServerProviderTargetConfig;
  video: ServerProviderTargetConfig;
  providerHealthTimeoutMs: number;
};

function buildTargetConfig(prefix: string, publicPrefix: string): ServerProviderTargetConfig {
  return {
    url: readServerValue(process.env[`${prefix}_URL`], process.env[`NEXT_PUBLIC_${publicPrefix}_URL`]),
    healthPath:
      readServerValue(process.env[`${prefix}_HEALTH_PATH`], process.env[`NEXT_PUBLIC_${publicPrefix}_HEALTH_PATH`]) ||
      "/health",
    authHeaderName: readValue(process.env[`${prefix}_AUTH_HEADER_NAME`]) || "Authorization",
    authHeaderValue: readValue(process.env[`${prefix}_AUTH_HEADER_VALUE`]),
  };
}

export function getServerProviderConfig(): ServerProviderConfig {
  return {
    auth: buildTargetConfig("AUTH_PROVIDER", "AUTH_PROVIDER"),
    cloudStorage: buildTargetConfig("CLOUD_STORAGE_PROVIDER", "CLOUD_STORAGE_PROVIDER"),
    ocr: buildTargetConfig("OCR_PROVIDER", "OCR_PROVIDER"),
    video: buildTargetConfig("VIDEO_ENHANCEMENT_PROVIDER", "VIDEO_ENHANCEMENT_PROVIDER"),
    providerHealthTimeoutMs: readNumber(
      process.env.PROVIDER_HEALTH_TIMEOUT_MS ?? process.env.NEXT_PUBLIC_PROVIDER_HEALTH_TIMEOUT_MS,
      5000,
    ),
  };
}

export function buildServerProviderHeaders(target: ServerProviderTargetConfig): HeadersInit | undefined {
  if (!target.authHeaderValue) {
    return undefined;
  }

  return {
    [target.authHeaderName || "Authorization"]: target.authHeaderValue,
  };
}
