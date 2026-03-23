import { NextResponse } from "next/server";

import { writeProviderGatewaySnapshot } from "@/lib/provider-gateway-snapshot-service";

export async function POST() {
  const result = await writeProviderGatewaySnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}

