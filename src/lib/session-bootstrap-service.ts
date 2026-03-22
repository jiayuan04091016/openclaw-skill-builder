import type { SessionRepository } from "@/lib/session-repository";
import type { SessionProfile } from "@/types/app";

export async function loadSessionProfile(repository: SessionRepository): Promise<SessionProfile> {
  return repository.loadSessionProfile();
}
