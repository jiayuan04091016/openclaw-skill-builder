import { NextResponse } from "next/server";

import { writeProviderTelemetryGateSnapshot } from "@/lib/provider-telemetry-gate-snapshot-service";

export async function POST() {
  const result = await writeProviderTelemetryGateSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
