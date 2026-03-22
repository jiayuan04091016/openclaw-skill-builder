import { NextResponse } from "next/server";

import { buildProviderIntegrationPlan } from "@/lib/provider-integration-plan-service";

export async function GET() {
  const plan = await buildProviderIntegrationPlan();

  return NextResponse.json(plan, {
    status: 200,
  });
}
