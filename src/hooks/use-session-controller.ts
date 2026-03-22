"use client";

import { useEffect, useRef, useState } from "react";

import { createSessionActionService } from "@/lib/session-action-service";
import { loadSessionProfile } from "@/lib/session-bootstrap-service";
import { createBrowserSessionRepository } from "@/lib/session-repository";
import type { SessionProfile, StoredSessionProfile } from "@/types/app";

export function useSessionController() {
  const [sessionProfile, setSessionProfile] = useState<SessionProfile | null>(null);
  const [storedSessionProfile, setStoredSessionProfile] = useState<StoredSessionProfile | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);
  const sessionActionServiceRef = useRef(createSessionActionService());

  useEffect(() => {
    const repository = createBrowserSessionRepository();
    let isMounted = true;

    async function bootstrapSession() {
      try {
        const nextSession = await loadSessionProfile(repository);

        if (isMounted) {
          setSessionProfile(nextSession.sessionProfile);
          setStoredSessionProfile(nextSession.storedSessionProfile);
        }
      } finally {
        if (isMounted) {
          setBootstrapping(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshProfile() {
    setLoading(true);

    try {
      const nextProfile = await sessionActionServiceRef.current.refreshProfile();
      setSessionProfile(nextProfile);
      setStoredSessionProfile(
        nextProfile.mode === "authenticated"
          ? {
              ...nextProfile,
              savedAt: new Date().toISOString(),
            }
          : null,
      );
      return nextProfile;
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    setLoading(true);

    try {
      const result = await sessionActionServiceRef.current.signIn();
      setSessionProfile(result.sessionProfile);
      setStoredSessionProfile(
        result.sessionProfile.mode === "authenticated"
          ? {
              ...result.sessionProfile,
              savedAt: new Date().toISOString(),
            }
          : null,
      );
      return result;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);

    try {
      const result = await sessionActionServiceRef.current.signOut();
      setSessionProfile(result.sessionProfile);
      setStoredSessionProfile(null);
      return result;
    } finally {
      setLoading(false);
    }
  }

  return {
    sessionProfile,
    storedSessionProfile,
    bootstrapping,
    loading,
    refreshProfile,
    signIn,
    signOut,
  };
}
