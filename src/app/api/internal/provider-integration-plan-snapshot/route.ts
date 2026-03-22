import { NextResponse } from "next/server";

import { writeProviderIntegrationPlanSnapshot } from "@/lib/provider-integration-plan-service";

export async function POST() {
  const result = await writeProviderIntegrationPlanSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
