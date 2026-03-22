import { runOcrGateway, runVideoGateway } from "@/lib/media-gateway-service";
import type { ResourceItem } from "@/types/app";

function createImageResource(): ResourceItem {
  return {
    id: "gateway-ocr-sample",
    type: "image",
    name: "sample.png",
    content: "image text",
    createdAt: new Date().toISOString(),
  };
}

function createVideoResource(): ResourceItem {
  return {
    id: "gateway-video-sample",
    type: "video",
    name: "sample.mp4",
    content: "video notes",
    createdAt: new Date().toISOString(),
  };
}

export type MediaGatewaySmokeReport = {
  ocrStatus: string;
  ocrMessage: string;
  videoStatus: string;
  videoMessage: string;
  ok: boolean;
};

export async function runMediaGatewaySmoke(): Promise<MediaGatewaySmokeReport> {
  const ocr = await runOcrGateway(createImageResource());
  const video = await runVideoGateway(createVideoResource());

  return {
    ocrStatus: ocr.status,
    ocrMessage: ocr.message,
    videoStatus: video.status,
    videoMessage: video.message,
    ok: ocr.status === "not-configured" && video.status === "not-configured",
  };
}
