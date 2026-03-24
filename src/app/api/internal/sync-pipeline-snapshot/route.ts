import { NextResponse } from "next/server";

import { writeSyncPipelineSnapshot } from "@/lib/sync-pipeline-snapshot-service";

export async function POST() {
  const result = await writeSyncPipelineSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}

