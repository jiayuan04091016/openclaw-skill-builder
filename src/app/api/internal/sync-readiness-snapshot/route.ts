import { NextResponse } from "next/server";

import { writeSyncReadinessSnapshot } from "@/lib/sync-readiness-snapshot-service";

export async function POST() {
  const result = await writeSyncReadinessSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}

