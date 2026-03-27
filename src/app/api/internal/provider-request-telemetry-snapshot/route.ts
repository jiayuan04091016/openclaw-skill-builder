import { NextResponse } from "next/server";

import { writeProviderRequestTelemetrySnapshot } from "@/lib/provider-request-telemetry-service";

export async function POST() {
  const result = await writeProviderRequestTelemetrySnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
