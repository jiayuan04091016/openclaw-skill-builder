import { NextResponse } from "next/server";

import { writeStageGatesSnapshot } from "@/lib/stage-gates-snapshot-service";

export async function POST() {
  const result = await writeStageGatesSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
