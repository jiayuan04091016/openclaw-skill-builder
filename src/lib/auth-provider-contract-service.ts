import { getProviderConfig } from "@/lib/provider-config";
import { buildRemoteProviderUrl, requestRemoteJson } from "@/lib/remote-provider-client";
import type { AuthProviderResult } from "@/lib/auth-provider";
import type { SessionProfile } from "@/types/app";

export type AuthProviderContractReport = {
  configured: boolean;
  profileShapeValid: boolean;
  signInShapeValid: boolean;
  signOutShapeValid: boolean;
  allValid: boolean;
  issues: string[];
};

function isValidSessionProfile(value: unknown): value is SessionProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate.mode === "guest" || candidate.mode === "authenticated") &&
    typeof candidate.displayName === "string" &&
    (typeof candidate.email === "string" || candidate.email === null)
  );
}

function isValidAuthProviderResult(value: unknown): value is AuthProviderResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate.ok === "boolean" && typeof candidate.message === "string";
}

export async function buildAuthProviderContractReport(): Promise<AuthProviderContractReport> {
  const providerConfig = getProviderConfig();

  if (!providerConfig.authProviderUrl) {
    return {
      configured: false,
      profileShapeValid: false,
      signInShapeValid: false,
      signOutShapeValid: false,
      allValid: false,
      issues: ["未配置 auth provider 地址。"],
    };
  }

  const issues: string[] = [];

  const profile = await requestRemoteJson<unknown>(buildRemoteProviderUrl(providerConfig.authProviderUrl, "/profile"));
  const signIn = await requestRemoteJson<unknown>(buildRemoteProviderUrl(providerConfig.authProviderUrl, "/sign-in"), {
    method: "POST",
  });
  const signOut = await requestRemoteJson<unknown>(buildRemoteProviderUrl(providerConfig.authProviderUrl, "/sign-out"), {
    method: "POST",
  });

  const profileShapeValid = isValidSessionProfile(profile);
  const signInShapeValid = isValidAuthProviderResult(signIn);
  const signOutShapeValid = isValidAuthProviderResult(signOut);

  if (!profileShapeValid) {
    issues.push("GET /profile 返回结构不符合当前前端约定。");
  }

  if (!signInShapeValid) {
    issues.push("POST /sign-in 返回结构不符合当前前端约定。");
  }

  if (!signOutShapeValid) {
    issues.push("POST /sign-out 返回结构不符合当前前端约定。");
  }

  return {
    configured: true,
    profileShapeValid,
    signInShapeValid,
    signOutShapeValid,
    allValid: profileShapeValid && signInShapeValid && signOutShapeValid,
    issues,
  };
}
