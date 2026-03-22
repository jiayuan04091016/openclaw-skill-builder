import {
  isNormalizedAuthResult,
  isNormalizedSessionProfile,
} from "@/lib/auth-remote-contracts";
import { buildRemoteProviderUrl, requestRemoteJson } from "@/lib/remote-provider-client";
import { buildServerProviderHeaders, getServerProviderConfig } from "@/lib/server-provider-config";

export type AuthProviderContractReport = {
  configured: boolean;
  profileShapeValid: boolean;
  signInShapeValid: boolean;
  signOutShapeValid: boolean;
  allValid: boolean;
  issues: string[];
};

export async function buildAuthProviderContractReport(): Promise<AuthProviderContractReport> {
  const providerConfig = getServerProviderConfig();
  const headers = buildServerProviderHeaders(providerConfig.auth);

  if (!providerConfig.auth.url) {
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

  const profile = await requestRemoteJson<unknown>(buildRemoteProviderUrl(providerConfig.auth.url, "/profile"), {
    headers,
  });
  const signIn = await requestRemoteJson<unknown>(buildRemoteProviderUrl(providerConfig.auth.url, "/sign-in"), {
    method: "POST",
    headers,
  });
  const signOut = await requestRemoteJson<unknown>(buildRemoteProviderUrl(providerConfig.auth.url, "/sign-out"), {
    method: "POST",
    headers,
  });

  const profileShapeValid = isNormalizedSessionProfile(profile);
  const signInShapeValid = isNormalizedAuthResult(signIn);
  const signOutShapeValid = isNormalizedAuthResult(signOut);

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
