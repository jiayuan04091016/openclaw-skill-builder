import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const projectCount = typeof payload?.projectCount === "number" ? payload.projectCount : 0;

  return NextResponse.json({
    ok: true,
    message: `本地 mock 云端已接收 ${projectCount} 个项目。`,
    projectCount,
  });
}
