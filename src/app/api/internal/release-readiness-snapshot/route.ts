import { NextResponse } from "next/server";

import { writeReleaseReadinessSnapshot } from "@/lib/release-readiness-snapshot-service";

export async function POST() {
  const result = await writeReleaseReadinessSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
