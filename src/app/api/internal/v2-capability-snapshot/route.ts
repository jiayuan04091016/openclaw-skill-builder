import { NextResponse } from "next/server";

import { writeV2CapabilitySnapshot } from "@/lib/v2-capability-snapshot-service";

export async function POST() {
  const result = await writeV2CapabilitySnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
