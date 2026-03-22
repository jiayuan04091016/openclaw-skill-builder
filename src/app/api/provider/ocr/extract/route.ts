import { NextResponse } from "next/server";

import { runOcrGateway } from "@/lib/media-gateway-service";
import type { ResourceItem } from "@/types/app";

function isResourceItem(value: unknown): value is ResourceItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.type === "string" &&
    typeof record.name === "string" &&
    typeof record.content === "string" &&
    typeof record.createdAt === "string"
  );
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        status: "not-configured",
        text: "",
        message: "请求体不是有效的 JSON。",
      },
      {
        status: 400,
      },
    );
  }

  if (!isResourceItem(payload)) {
    return NextResponse.json(
      {
        status: "not-configured",
        text: "",
        message: "请求体不符合资源结构。",
      },
      {
        status: 400,
      },
    );
  }

  const result = await runOcrGateway(payload);

  return NextResponse.json(result, {
    status: result.status === "completed" ? 200 : 502,
  });
}
