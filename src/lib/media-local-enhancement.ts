import type { ResourceItem } from "@/types/app";

function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function compactLines(value: string) {
  return normalizeText(value)
    .split("\n")
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim())
    .filter(Boolean);
}

export function buildLocalOcrText(resource: ResourceItem) {
  const lines = compactLines(resource.content);

  if (lines.length === 0) {
    return `图片文件：${resource.name}\n未检测到可提取文字，建议补充截图说明或接入真实 OCR 服务。`;
  }

  return lines.slice(0, 12).join("\n").slice(0, 1200).trim();
}

export function buildLocalVideoSummary(resource: ResourceItem) {
  const lines = compactLines(resource.content);

  if (lines.length === 0) {
    return `视频文件：${resource.name}\n未检测到可摘要内容，建议补充视频说明或接入真实视频理解服务。`;
  }

  const highlights = lines.slice(0, 3).map((line, index) => `${index + 1}. ${line}`);
  const concise = lines.join(" ").slice(0, 220);

  return [`核心摘要：${concise}`, "", "要点：", ...highlights].join("\n").trim();
}

