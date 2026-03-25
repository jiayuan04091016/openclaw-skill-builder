import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const resource = await request.json();

  return NextResponse.json({
    status: "completed",
    text: resource?.content || "",
    message: "本地 mock OCR 已返回识别结果。",
  });
}

