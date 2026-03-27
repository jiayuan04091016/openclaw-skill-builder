import { NextResponse } from "next/server";

import { writeV2InfraStatusSnapshot } from "@/lib/v2-infra-status-snapshot-service";

export async function POST() {
  const result = await writeV2InfraStatusSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
