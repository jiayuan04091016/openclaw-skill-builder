import { NextResponse } from "next/server";

import { writeStageDeliveryStatusSnapshot } from "@/lib/stage-delivery-status-snapshot-service";

export async function POST() {
  const result = await writeStageDeliveryStatusSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
