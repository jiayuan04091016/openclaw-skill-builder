"use client";

import { useEffect, useRef, useState } from "react";

import { createSessionActionService } from "@/lib/session-action-service";
import { loadSessionProfile } from "@/lib/session-bootstrap-service";
import { createBrowserSessionRepository } from "@/lib/session-repository";
import type { SessionProfile } from "@/types/app";

export function useSessionController() {
  const [sessionProfile, setSessionProfile] = useState<SessionProfile | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(false);
  const sessionActionServiceRef = useRef(createSessionActionService());

  useEffect(() => {
    const repository = createBrowserSessionRepository();
    let isMounted = true;

    async function bootstrapSession() {
      try {
        const nextProfile = await loadSessionProfile(repository);

        if (isMounted) {
          setSessionProfile(nextProfile);
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
      return result;
    } finally {
      setLoading(false);
    }
  }

  return {
    sessionProfile,
    bootstrapping,
    loading,
    refreshProfile,
    signIn,
    signOut,
  };
}
