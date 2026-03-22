"use client";

import { useRef, useState } from "react";

import { createSessionActionService } from "@/lib/session-action-service";
import type { SessionProfile } from "@/types/app";

export function useSessionActions(initialProfile: SessionProfile | null = null) {
  const [sessionProfile, setSessionProfile] = useState<SessionProfile | null>(initialProfile);
  const [loading, setLoading] = useState(false);
  const sessionActionServiceRef = useRef(createSessionActionService());

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
    loading,
    refreshProfile,
    signIn,
    signOut,
  };
}
