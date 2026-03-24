const sectionAliases = {
  description: ["用途", "简介", "说明", "Description", "Purpose", "Overview"],
  audience: ["适用对象", "适合谁用", "Audience", "Target Users"],
  mainTask: ["主要任务", "适用场景", "场景", "Scenario", "Use Cases", "Tasks"],
  inputFormat: ["输入内容", "输入", "Input", "Inputs"],
  outputFormat: ["输出内容", "输出", "Output", "Outputs"],
  warnings: ["注意事项", "风险提示", "Warnings", "Notes", "Cautions"],
} as const;

export type ParsedSkillSections = {
  frontmatterName: string;
  frontmatterDescription: string;
  headingTitle: string;
  description: string;
  audience: string;
  mainTask: string;
  inputFormat: string;
  outputFormat: string;
  warnings: string;
  summary: string;
};

export function normalizeImportText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function extractFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  return match?.[1] ?? "";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractFrontmatterValue(content: string, key: string) {
  const frontmatter = extractFrontmatter(content);
  const match = frontmatter.match(new RegExp(`^${escapeRegExp(key)}\\s*[:：]\\s*(.+)$`, "im"));

  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

export function extractTitle(content: string) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
}

export function extractSectionByHeading(content: string, heading: string) {
  const escaped = escapeRegExp(heading);
  const match = content.match(new RegExp(`^#{2,4}\\s+${escaped}\\s*$\\n([\\s\\S]*?)(?=^#{2,4}\\s+|\\Z)`, "im"));

  return normalizeImportText(match?.[1] ?? "");
}

function extractSectionByInlineLabel(content: string, aliases: readonly string[]) {
  const lines = content.split("\n");

  for (const line of lines) {
    for (const alias of aliases) {
      const match = line.match(new RegExp(`^\\s*(?:[-*]\\s*)?${escapeRegExp(alias)}\\s*[:：]\\s*(.+?)\\s*$`, "i"));
      if (match?.[1]?.trim()) {
        return match[1].trim();
      }
    }
  }

  return "";
}

export function extractFirstAvailableSection(
  content: string,
  aliases: readonly string[],
): { value: string; matchedAlias: string | null; method: "heading" | "inline" | "none" } {
  for (const alias of aliases) {
    const section = extractSectionByHeading(content, alias);
    if (section) {
      return { value: section, matchedAlias: alias, method: "heading" };
    }
  }

  const inline = extractSectionByInlineLabel(content, aliases);
  if (inline) {
    return { value: inline, matchedAlias: null, method: "inline" };
  }

  return { value: "", matchedAlias: null, method: "none" };
}

export function buildFallbackSummary(content: string) {
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, "");

  return withoutFrontmatter
    .split("\n")
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/, "")
        .replace(/^[-*]\s+/, "")
        .replace(/^\d+\.\s+/, "")
        .trim(),
    )
    .filter(Boolean)
    .slice(0, 4)
    .join(" ")
    .slice(0, 180)
    .trim();
}

export function parseSkillImportSections(content: string): ParsedSkillSections {
  const normalized = normalizeImportText(content);
  const description = extractFirstAvailableSection(normalized, sectionAliases.description).value;
  const audience = extractFirstAvailableSection(normalized, sectionAliases.audience).value;
  const mainTask = extractFirstAvailableSection(normalized, sectionAliases.mainTask).value;
  const inputFormat = extractFirstAvailableSection(normalized, sectionAliases.inputFormat).value;
  const outputFormat = extractFirstAvailableSection(normalized, sectionAliases.outputFormat).value;
  const warnings = extractFirstAvailableSection(normalized, sectionAliases.warnings).value;

  return {
    frontmatterName: extractFrontmatterValue(normalized, "name") || extractFrontmatterValue(normalized, "title"),
    frontmatterDescription: extractFrontmatterValue(normalized, "description"),
    headingTitle: extractTitle(normalized),
    description,
    audience,
    mainTask,
    inputFormat,
    outputFormat,
    warnings,
    summary: buildFallbackSummary(normalized),
  };
}

