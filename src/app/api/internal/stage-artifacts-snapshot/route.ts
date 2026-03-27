import { NextResponse } from "next/server";

import { writeStageArtifactsSnapshot } from "@/lib/stage-artifacts-snapshot-service";

export async function POST() {
  const result = await writeStageArtifactsSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
