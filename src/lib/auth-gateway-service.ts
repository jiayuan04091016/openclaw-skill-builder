import {
  normalizeRemoteAuthResult,
  normalizeRemoteSessionProfile,
} from "@/lib/auth-remote-contracts";
import type { AuthProviderResult } from "@/lib/auth-provider";
import { buildRemoteProviderUrl, requestRemoteJsonWithRetry } from "@/lib/remote-provider-client";
import { buildServerProviderHeaders, getServerProviderConfig } from "@/lib/server-provider-config";
import { buildGuestSessionProfile } from "@/lib/session-service";
import type { SessionProfile } from "@/types/app";

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

export async function getAuthGatewayProfile(sessionToken = ""): Promise<SessionProfile> {
  const config = getServerProviderConfig();
  const retryOptions = {
    attempts: config.providerRequestRetryAttempts,
    initialDelayMs: config.providerRequestRetryInitialDelayMs,
    backoffFactor: config.providerRequestRetryBackoffFactor,
  };

  if (!config.auth.url) {
    return buildGuestSessionProfile(false);
  }

  const profile = normalizeRemoteSessionProfile(
    await requestRemoteJsonWithRetry<unknown>(
      buildRemoteProviderUrl(config.auth.url, "/profile"),
      {
        headers: buildGatewayHeaders(buildServerProviderHeaders(config.auth), sessionToken),
        telemetryKey: "auth",
      },
      retryOptions,
    ),
  );

  return profile ?? buildGuestSessionProfile(true);
}

export async function runAuthGatewaySignIn(): Promise<AuthProviderResult> {
  const config = getServerProviderConfig();
  const retryOptions = {
    attempts: config.providerRequestRetryAttempts,
    initialDelayMs: config.providerRequestRetryInitialDelayMs,
    backoffFactor: config.providerRequestRetryBackoffFactor,
  };

  if (!config.auth.url) {
    return {
      ok: false,
      message: "当前还没有接入真实登录服务。",
    };
  }

  const result = normalizeRemoteAuthResult(
    await requestRemoteJsonWithRetry<unknown>(
      buildRemoteProviderUrl(config.auth.url, "/sign-in"),
      {
        method: "POST",
        headers: buildServerProviderHeaders(config.auth),
        telemetryKey: "auth",
      },
      retryOptions,
    ),
  );

  return (
    result ?? {
      ok: false,
      message: "认证网关调用远端 sign-in 失败。",
    }
  );
}

export async function runAuthGatewaySignOut(sessionToken = ""): Promise<AuthProviderResult> {
  const config = getServerProviderConfig();
  const retryOptions = {
    attempts: config.providerRequestRetryAttempts,
    initialDelayMs: config.providerRequestRetryInitialDelayMs,
    backoffFactor: config.providerRequestRetryBackoffFactor,
  };

  if (!config.auth.url) {
    return {
      ok: true,
      message: "当前仍然是本机访客模式。",
    };
  }

  const result = normalizeRemoteAuthResult(
    await requestRemoteJsonWithRetry<unknown>(
      buildRemoteProviderUrl(config.auth.url, "/sign-out"),
      {
        method: "POST",
        headers: buildGatewayHeaders(buildServerProviderHeaders(config.auth), sessionToken),
        telemetryKey: "auth",
      },
      retryOptions,
    ),
  );

  return (
    result ?? {
      ok: false,
      message: "认证网关调用远端 sign-out 失败。",
    }
  );
}
