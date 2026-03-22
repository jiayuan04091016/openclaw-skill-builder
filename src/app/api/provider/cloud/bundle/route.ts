import { NextResponse } from "next/server";

import { saveCloudGatewayBundle } from "@/lib/cloud-gateway-service";
import type { CloudSyncBundle } from "@/types/app";

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
      },
      {
        status: 400,
      },
    );
  }

  if (!isCloudSyncBundle(payload)) {
    return NextResponse.json(
      {
        ok: false,
        message: "请求体不符合云端同步包结构。",
      },
      {
        status: 400,
      },
    );
  }

  const result = await saveCloudGatewayBundle(payload);

  return NextResponse.json(result, {
    status: result.ok ? 200 : 502,
  });
}
