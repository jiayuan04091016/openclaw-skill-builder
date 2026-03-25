import type { OcrResult, VideoEnhancementResult } from "@/types/app";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeRemoteOcrResult(value: unknown): OcrResult | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const status = readString(record.status);

  if (status !== "not-configured" && status !== "completed") {
    return null;
  }

  return {
    status,
    text: readString(record.text) || readString(record.content),
    message: readString(record.message) || readString(record.detail) || "OCR 结果已返回。",
  };
}

export function normalizeRemoteVideoEnhancementResult(value: unknown): VideoEnhancementResult | null {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const status = readString(record.status);

  if (status !== "not-configured" && status !== "completed") {
    return null;
  }

  return {
    status,
    summary: readString(record.summary) || readString(record.text) || readString(record.content),
    message: readString(record.message) || readString(record.detail) || "视频增强结果已返回。",
  };
}

export function isNormalizedOcrResult(value: unknown): value is OcrResult {
  return Boolean(normalizeRemoteOcrResult(value));
}

export function isNormalizedVideoEnhancementResult(value: unknown): value is VideoEnhancementResult {
  return Boolean(normalizeRemoteVideoEnhancementResult(value));
}

