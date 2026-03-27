import { NextResponse } from "next/server";

import { writeImportReadinessSnapshot } from "@/lib/import-readiness-snapshot-service";

export async function POST() {
  const result = await writeImportReadinessSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
