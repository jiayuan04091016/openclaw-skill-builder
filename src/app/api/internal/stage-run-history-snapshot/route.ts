import { NextResponse } from "next/server";

import { writeStageRunHistorySnapshot } from "@/lib/stage-run-history-snapshot-service";

export async function POST() {
  const result = await writeStageRunHistorySnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
