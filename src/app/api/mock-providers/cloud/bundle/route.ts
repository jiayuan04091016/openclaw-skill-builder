import { NextResponse } from "next/server";

import { saveMockCloudBundle } from "@/lib/mock-cloud-store";
import type { CloudSyncBundle } from "@/types/app";

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization")?.trim() || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice("bearer ".length).trim();
}

function isCloudSyncBundle(value: unknown): value is CloudSyncBundle {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record.version === 1 &&
    typeof record.exportedAt === "string" &&
    typeof record.projectCount === "number" &&
    Array.isArray(record.projects)
  );
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "请求体不是有效的 JSON。",
        projectCount: 0,
      },
      { status: 400 },
    );
  }

  if (!isCloudSyncBundle(payload)) {
    return NextResponse.json(
      {
        ok: false,
        message: "请求体不符合云端同步包结构。",
        projectCount: 0,
      },
      { status: 400 },
    );
  }

  const sessionToken = readBearerToken(request);
  const result = saveMockCloudBundle(payload, sessionToken);
  return NextResponse.json(result);
}

