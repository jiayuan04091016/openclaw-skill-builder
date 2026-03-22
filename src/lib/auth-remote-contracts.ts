import type { AuthProviderResult } from "@/lib/auth-provider";
import type { SessionMode, SessionProfile } from "@/types/app";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableString(value: unknown) {
  return typeof value === "string" ? value.trim() : value === null ? null : null;
}

function readBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function normalizeSessionMode(record: UnknownRecord): SessionMode {
  const directMode = readString(record.mode);
  const status = readString(record.status);
  const authenticated =
    readBoolean(record.authenticated) ??
    readBoolean(record.isAuthenticated) ??
    (status === "authenticated" ? true : status === "guest" ? false : null);

  if (directMode === "authenticated" || authenticated === true) {
    return "authenticated";
  }

  return "guest";
}

export function normalizeRemoteSessionProfile(value: unknown): SessionProfile | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const displayName =
    readString(record.displayName) ||
    readString(record.name) ||
    readString(record.username) ||
    (normalizeSessionMode(record) === "authenticated" ? "已登录用户" : "本机访客");

  return {
    mode: normalizeSessionMode(record),
    displayName,
    email: readNullableString(record.email),
  };
}

export function normalizeRemoteAuthResult(value: unknown): AuthProviderResult | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const ok =
    readBoolean(record.ok) ??
    readBoolean(record.success) ??
    (readString(record.status) === "ok" ? true : readString(record.status) === "error" ? false : null);

  if (ok === null) {
    return null;
  }

  return {
    ok,
    message: readString(record.message) || readString(record.detail) || (ok ? "认证动作执行成功。" : "认证动作执行失败。"),
  };
}

export function isNormalizedSessionProfile(value: unknown): value is SessionProfile {
  const profile = normalizeRemoteSessionProfile(value);
  return Boolean(profile);
}

export function isNormalizedAuthResult(value: unknown): value is AuthProviderResult {
  const result = normalizeRemoteAuthResult(value);
  return Boolean(result);
}
