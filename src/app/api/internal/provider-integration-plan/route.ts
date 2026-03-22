import { NextResponse } from "next/server";

import {
  buildProviderIntegrationPlan,
  buildProviderIntegrationPlanMarkdown,
} from "@/lib/provider-integration-plan-service";

export async function GET(request: Request) {
  const plan = await buildProviderIntegrationPlan();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(buildProviderIntegrationPlanMarkdown(plan), {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(plan, {
    status: 200,
  });
}
