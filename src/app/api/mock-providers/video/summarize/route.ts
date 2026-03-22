import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const resource = await request.json();

  return NextResponse.json({
    status: "completed",
    summary: resource?.content || "",
    message: "本地 mock 视频增强已返回结果。",
  });
}
