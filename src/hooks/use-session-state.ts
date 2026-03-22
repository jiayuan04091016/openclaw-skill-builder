"use client";

import { useMemo } from "react";

import type { SessionState } from "@/types/app";

export function useSessionState(): SessionState {
  return useMemo(
    () => ({
      mode: "guest",
      storageMode: "local",
      displayName: "本机访客",
    }),
    [],
  );
}
