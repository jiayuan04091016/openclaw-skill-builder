export type ParsedSkillImport = {
  title: string;
  description: string;
  audience: string;
  mainTask: string;
  inputFormat: string;
  outputFormat: string;
  warnings: string;
};

const sectionAliases = {
  description: ["用途", "简介", "说明", "Description", "Purpose"],
  audience: ["适用对象", "适合谁用", "Audience"],
  mainTask: ["适用场景", "主要任务", "场景", "Scenario", "Use Cases"],
  inputFormat: ["输入内容", "输入", "Input", "Inputs"],
  outputFormat: ["输出内容", "输出", "Output", "Outputs"],
  warnings: ["注意事项", "风险提示", "Warnings", "Notes"],
} as const;

function normalizeText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function extractFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match?.[1] ?? "";
}

function extractFrontmatterValue(content: string, key: string) {
  const frontmatter = extractFrontmatter(content);
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function extractTitle(content: string) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
}

function extractSectionByHeading(content: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`^##\\s+${escaped}\\s*$\\n([\\s\\S]*?)(?=^##\\s+|\\Z)`, "im"));
  return normalizeText(match?.[1] ?? "");
}

function extractFirstAvailableSection(content: string, aliases: readonly string[]) {
  for (const alias of aliases) {
    const section = extractSectionByHeading(content, alias);
    if (section) {
      return section;
    }
  }

  return "";
}

function fallbackSummary(content: string) {
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, "");
  return withoutFrontmatter
    .split("\n")
    .map((line) => line.replace(/^#+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ")
    .slice(0, 120)
    .trim();
}

export function parseImportedSkill(content: string): ParsedSkillImport {
  const normalized = normalizeText(content);
  const title =
    extractFrontmatterValue(normalized, "name") ||
    extractTitle(normalized) ||
    extractFirstAvailableSection(normalized, sectionAliases.description).slice(0, 20);

  const description =
    extractFrontmatterValue(normalized, "description") ||
    extractFirstAvailableSection(normalized, sectionAliases.description) ||
    fallbackSummary(normalized);

  return {
    title,
    description,
    audience: extractFirstAvailableSection(normalized, sectionAliases.audience),
    mainTask: extractFirstAvailableSection(normalized, sectionAliases.mainTask),
    inputFormat: extractFirstAvailableSection(normalized, sectionAliases.inputFormat),
    outputFormat: extractFirstAvailableSection(normalized, sectionAliases.outputFormat),
    warnings: extractFirstAvailableSection(normalized, sectionAliases.warnings),
  };
}
