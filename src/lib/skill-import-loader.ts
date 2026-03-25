import JSZip from "jszip";

export type ImportedSkillAsset = {
  sourceType: "text" | "markdown" | "zip" | "manual";
  sourceName: string;
  importedSkillText: string;
};

function decodeText(buffer: ArrayBuffer) {
  return new TextDecoder("utf-8").decode(buffer).replace(/\r\n/g, "\n").trim();
}

function isTextCandidate(entry: string) {
  return /\.(md|txt|json|ya?ml)$/i.test(entry);
}

function scoreSkillTextCandidate(path: string, content: string) {
  const normalizedPath = path.toLowerCase();
  const normalizedContent = content.toLowerCase();
  let score = 0;

  if (/(^|\/)skill\.md$/.test(normalizedPath)) {
    score += 120;
  }
  if (/(^|\/)readme\.md$/.test(normalizedPath)) {
    score += 80;
  }
  if (/(^|\/)skill\.json$/.test(normalizedPath)) {
    score += 110;
  }
  if (/(^|\/)package\.json$/.test(normalizedPath)) {
    score -= 120;
  }
  if (normalizedPath.endsWith(".md")) {
    score += 25;
  }
  if (normalizedPath.endsWith(".json")) {
    score += 20;
    if (normalizedContent.includes("\"name\"") || normalizedContent.includes("\"title\"")) {
      score += 16;
    }
    if (normalizedContent.includes("\"description\"")) {
      score += 16;
    }
    if (normalizedContent.includes("\"input\"") || normalizedContent.includes("\"output\"")) {
      score += 12;
    }
  }
  if (normalizedPath.endsWith(".yaml") || normalizedPath.endsWith(".yml")) {
    score += 20;
    if (normalizedContent.includes("name:") || normalizedContent.includes("title:")) {
      score += 16;
    }
    if (normalizedContent.includes("description:")) {
      score += 16;
    }
    if (normalizedContent.includes("input") || normalizedContent.includes("output")) {
      score += 12;
    }
  }
  if (/^---\n[\s\S]*?\n---/.test(content)) {
    score += 20;
  }
  if (/^#\s+/.test(content)) {
    score += 20;
  }

  const keywordHits = [
    "name:",
    "description:",
    "## 适用对象",
    "## 主要任务",
    "## 输入内容",
    "## 输出内容",
    "## audience",
    "## input",
    "## output",
  ].filter((keyword) => normalizedContent.includes(keyword.toLowerCase())).length;

  score += keywordHits * 10;
  score += Math.min(content.length, 2400) / 120;

  return score;
}

async function chooseBestZipCandidate(zip: JSZip) {
  const candidates = Object.keys(zip.files)
    .filter((entry) => !entry.endsWith("/"))
    .filter(isTextCandidate)
    .slice(0, 40);

  let best: { path: string; text: string; score: number } | null = null;

  for (const candidate of candidates) {
    const text = (await zip.file(candidate)?.async("text"))?.replace(/\r\n/g, "\n").trim() ?? "";
    if (!text) {
      continue;
    }

    const score = scoreSkillTextCandidate(candidate, text);
    if (!best || score > best.score) {
      best = { path: candidate, text, score };
    }
  }

  return best;
}

export async function loadImportedSkillAsset(file: File): Promise<ImportedSkillAsset> {
  if (file.name.toLowerCase().endsWith(".zip")) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const best = await chooseBestZipCandidate(zip);

    if (!best) {
      return {
        sourceType: "zip",
        sourceName: file.name,
        importedSkillText: "",
      };
    }

    return {
      sourceType: "zip",
      sourceName: `${file.name}::${best.path}`,
      importedSkillText: best.text,
    };
  }

  if (
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    /\.(md|txt|json|ya?ml)$/i.test(file.name)
  ) {
    return {
      sourceType: /\.md$/i.test(file.name) ? "markdown" : "text",
      sourceName: file.name,
      importedSkillText: decodeText(await file.arrayBuffer()),
    };
  }

  return {
    sourceType: "manual",
    sourceName: file.name,
    importedSkillText: "",
  };
}

export async function loadImportedSkillText(file: File) {
  const asset = await loadImportedSkillAsset(file);
  return asset.importedSkillText;
}
