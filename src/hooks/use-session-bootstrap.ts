"use client";

import { useSessionController } from "@/hooks/use-session-controller";

export function useSessionBootstrap() {
  const { sessionProfile } = useSessionController();

  return {
    sessionProfile,
  };
}
