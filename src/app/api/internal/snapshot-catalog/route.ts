import { NextResponse } from "next/server";

import { buildSnapshotCatalogMarkdown, buildSnapshotCatalogReport } from "@/lib/snapshot-catalog-service";

export async function GET(request: Request) {
  const report = buildSnapshotCatalogReport();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  if (format === "markdown") {
    return new Response(buildSnapshotCatalogMarkdown(report), {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  }

  return NextResponse.json(report, { status: 200 });
}
