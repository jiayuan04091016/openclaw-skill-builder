"use client";

import { useMemo } from "react";

import { buildSessionState } from "@/lib/session-service";
import type { RepositoryCapabilities, RepositoryStatus, SessionProfile, SessionState } from "@/types/app";

type UseSessionStateOptions = {
  capabilities?: RepositoryCapabilities | null;
  repositoryStatus?: RepositoryStatus | null;
  sessionProfile?: SessionProfile | null;
};

export function useSessionState(options: UseSessionStateOptions = {}): SessionState {
  const { capabilities, repositoryStatus, sessionProfile } = options;

  return useMemo(
    () => buildSessionState({ capabilities, repositoryStatus, sessionProfile }),
    [capabilities, repositoryStatus, sessionProfile],
  );
}
