import { NextResponse } from "next/server";

import { writeStageReportSnapshot } from "@/lib/stage-report-snapshot-service";

export async function POST() {
  const result = await writeStageReportSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
