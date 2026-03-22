import { NextResponse } from "next/server";

import { writeStageSnapshot } from "@/lib/stage-snapshot-service";

export async function POST() {
  const result = await writeStageSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
