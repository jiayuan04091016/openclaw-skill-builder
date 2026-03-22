"use client";

import { useMemo } from "react";

import type { SessionState } from "@/types/app";

export function useSessionState(): SessionState {
  return useMemo(
    () => ({
      mode: "guest",
      storageMode: "local",
      displayName: "本机访客",
      syncAvailable: false,
      syncHint: "后续接入登录后，可支持跨设备同步。",
    }),
    [],
  );
}
