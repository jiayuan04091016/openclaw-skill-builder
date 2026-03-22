"use client";

import { useEffect, useState } from "react";

import { createBrowserSessionRepository } from "@/lib/session-repository";
import type { SessionProfile } from "@/types/app";

export function useSessionBootstrap() {
  const [sessionProfile, setSessionProfile] = useState<SessionProfile | null>(null);

  useEffect(() => {
    const repository = createBrowserSessionRepository();
    let isMounted = true;

    async function loadSessionProfile() {
      const nextProfile = await repository.loadSessionProfile();

      if (isMounted) {
        setSessionProfile(nextProfile);
      }
    }

    void loadSessionProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    sessionProfile,
  };
}
