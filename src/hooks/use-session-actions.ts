"use client";

import type { SessionProfile } from "@/types/app";

import { useSessionController } from "@/hooks/use-session-controller";

export function useSessionActions(initialProfile: SessionProfile | null = null) {
  const controller = useSessionController();

  return {
    sessionProfile: controller.sessionProfile ?? initialProfile,
    loading: controller.loading || controller.bootstrapping,
    refreshProfile: controller.refreshProfile,
    signIn: controller.signIn,
    signOut: controller.signOut,
  };
}
