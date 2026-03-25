import { NextResponse } from "next/server";

import { writeMediaProviderContractSnapshot } from "@/lib/media-provider-contract-snapshot-service";

export async function POST() {
  const result = await writeMediaProviderContractSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}

