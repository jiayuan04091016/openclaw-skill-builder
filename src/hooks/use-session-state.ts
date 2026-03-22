"use client";

import { useMemo } from "react";

import type { RepositoryCapabilities, RepositoryStatus, SessionState } from "@/types/app";

type UseSessionStateOptions = {
  capabilities?: RepositoryCapabilities | null;
  repositoryStatus?: RepositoryStatus | null;
};

export function useSessionState(options: UseSessionStateOptions = {}): SessionState {
  const { capabilities, repositoryStatus } = options;

  return useMemo(() => {
    const storageMode = capabilities?.storageMode ?? "local";
    const syncAvailable = capabilities?.cloudSyncEnabled ?? false;
    const projectCount = repositoryStatus?.projectCount ?? 0;
    const lastSavedAt = repositoryStatus?.lastSavedAt;

    const syncHint = syncAvailable
      ? "云端同步底座已开启，后续接入登录后可继续补真实同步流程。"
      : lastSavedAt
        ? `当前是本机保存模式，最近一次本机保存时间：${new Date(lastSavedAt).toLocaleString("zh-CN")}；后续接入登录后可再升级为跨设备同步。`
        : projectCount
          ? "当前是本机保存模式，项目会先保存在这台设备里；后续接入登录后可再升级为跨设备同步。"
          : "当前是本机保存模式，后续接入登录后可支持跨设备同步。";

    return {
      mode: capabilities?.authEnabled ? "authenticated" : "guest",
      storageMode,
      displayName: capabilities?.authEnabled ? "已登录用户" : "本机访客",
      syncAvailable,
      syncHint,
    };
  }, [capabilities, repositoryStatus]);
}
