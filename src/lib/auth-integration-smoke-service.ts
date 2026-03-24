import { createSessionStorageService } from "@/lib/session-storage-service";
import type { SessionProfile } from "@/types/app";

type MemoryStorage = Storage & {
  dump: () => Record<string, string>;
};

function createMemoryStorage(): MemoryStorage {
  const map = new Map<string, string>();

  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.get(key) ?? null;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, value);
    },
    dump() {
      return Object.fromEntries(map.entries());
    },
  };
}

export type AuthIntegrationSmokeReport = {
  persistenceWritable: boolean;
  persistenceReadable: boolean;
  storedMode: SessionProfile["mode"] | null;
  storedDisplayName: string | null;
  ok: boolean;
};

export function runAuthIntegrationSmoke(): AuthIntegrationSmokeReport {
  const storage = createMemoryStorage();
  const sessionStorageService = createSessionStorageService(storage);
  const sampleProfile: SessionProfile = {
    mode: "authenticated",
    displayName: "集成测试账号",
    email: "integration@example.com",
  };

  const stored = sessionStorageService.save(sampleProfile);
  const loaded = sessionStorageService.load();

  return {
    persistenceWritable: Boolean(storage.dump()),
    persistenceReadable: Boolean(loaded),
    storedMode: loaded?.mode ?? null,
    storedDisplayName: loaded?.displayName ?? null,
    ok: stored.mode === "authenticated" && loaded?.displayName === sampleProfile.displayName,
  };
}

