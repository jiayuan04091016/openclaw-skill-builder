import { NextResponse } from "next/server";

import { writeSnapshotCatalogSnapshot } from "@/lib/snapshot-catalog-snapshot-service";

export async function POST() {
  const result = await writeSnapshotCatalogSnapshot();

  return NextResponse.json(result, {
    status: 200,
  });
}
