"use client";

import { useEffect, useState } from "react";

import { loadSessionProfile } from "@/lib/session-bootstrap-service";
import { createBrowserSessionRepository } from "@/lib/session-repository";
import type { SessionProfile } from "@/types/app";

export function useSessionBootstrap() {
  const [sessionProfile, setSessionProfile] = useState<SessionProfile | null>(null);

  useEffect(() => {
    const repository = createBrowserSessionRepository();
    let isMounted = true;

    async function bootstrapSession() {
      const nextProfile = await loadSessionProfile(repository);

      if (isMounted) {
        setSessionProfile(nextProfile);
      }
    }

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    sessionProfile,
  };
}
