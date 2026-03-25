const sectionAliases = {
  description: ["用途", "简介", "说明", "Description", "Purpose", "Overview"],
  audience: ["适用对象", "适合谁用", "Audience", "Target Users"],
  mainTask: ["主要任务", "适用场景", "场景", "Scenario", "Use Cases", "Tasks"],
  inputFormat: ["输入内容", "输入", "Input", "Inputs"],
  outputFormat: ["输出内容", "输出", "Output", "Outputs"],
  warnings: ["注意事项", "风险提示", "Warnings", "Notes", "Cautions"],
} as const;

type JsonSkillObject = Record<string, unknown>;

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

function asObject(value: unknown): JsonSkillObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonSkillObject;
}

function normalizeJsonValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeJsonValue(item))
      .filter(Boolean)
      .join("；")
      .trim();
  }

  const obj = asObject(value);
  if (obj) {
    return Object.values(obj)
      .map((item) => normalizeJsonValue(item))
      .filter(Boolean)
      .join("；")
      .trim();
  }

  return "";
}

function readJsonPathValue(source: JsonSkillObject, paths: string[]) {
  for (const path of paths) {
    const segments = path.split(".");
    let current: unknown = source;

    for (const segment of segments) {
      const obj = asObject(current);
      if (!obj || !(segment in obj)) {
        current = undefined;
        break;
      }
      current = obj[segment];
    }

    const value = normalizeJsonValue(current);
    if (value) {
      return value;
    }
  }

  return "";
}

function parseJsonSkillContent(content: string): ParsedSkillSections | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const root = Array.isArray(parsed) ? asObject(parsed[0]) : asObject(parsed);
    if (!root) {
      return null;
    }

    const frontmatterName = readJsonPathValue(root, [
      "name",
      "title",
      "skillName",
      "skill.name",
      "metadata.name",
      "meta.name",
    ]);
    const frontmatterDescription = readJsonPathValue(root, [
      "description",
      "summary",
      "purpose",
      "overview",
      "skill.description",
      "metadata.description",
      "meta.description",
    ]);
    const audience = readJsonPathValue(root, [
      "audience",
      "targetAudience",
      "targetUsers",
      "target_users",
      "skill.audience",
      "spec.audience",
    ]);
    const mainTask = readJsonPathValue(root, [
      "mainTask",
      "task",
      "tasks",
      "useCases",
      "use_cases",
      "scenario",
      "skill.mainTask",
      "spec.mainTask",
    ]);
    const inputFormat = readJsonPathValue(root, [
      "inputFormat",
      "input",
      "inputs",
      "input_format",
      "spec.input",
      "spec.inputFormat",
    ]);
    const outputFormat = readJsonPathValue(root, [
      "outputFormat",
      "output",
      "outputs",
      "output_format",
      "spec.output",
      "spec.outputFormat",
    ]);
    const warnings = readJsonPathValue(root, [
      "warnings",
      "notes",
      "cautions",
      "risk",
      "spec.warnings",
      "spec.notes",
    ]);

    const summaryParts = [frontmatterDescription, mainTask, inputFormat, outputFormat].filter(Boolean);

    return {
      frontmatterName,
      frontmatterDescription,
      headingTitle: frontmatterName,
      description: frontmatterDescription,
      audience,
      mainTask,
      inputFormat,
      outputFormat,
      warnings,
      summary: summaryParts.join(" ").slice(0, 180),
    };
  } catch {
    return null;
  }
}

function parseSimpleYamlMap(content: string) {
  const lines = content.split("\n");
  const map = new Map<string, string>();
  let currentKey = "";
  let currentValue: string[] = [];

  function flush() {
    if (!currentKey) {
      return;
    }
    const value = currentValue.join("\n").trim();
    if (value) {
      map.set(currentKey.toLowerCase(), value);
    }
    currentKey = "";
    currentValue = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const pair = line.match(/^([A-Za-z_][A-Za-z0-9_.-]*)\s*:\s*(.*)$/);
    if (pair) {
      flush();
      currentKey = pair[1].trim();
      const value = pair[2].trim();
      if (value === "|" || value === ">") {
        continue;
      }
      if (value) {
        currentValue.push(value.replace(/^['"]|['"]$/g, ""));
      }
      continue;
    }

    if (currentKey && (/^\s+/.test(line) || trimmed.startsWith("- "))) {
      currentValue.push(trimmed.replace(/^- /, "").trim());
    }
  }

  flush();
  return map;
}

function readYamlValue(map: Map<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const value = map.get(alias.toLowerCase())?.trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function parseYamlSkillContent(content: string): ParsedSkillSections | null {
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*\s*:/m.test(content)) {
    return null;
  }

  const map = parseSimpleYamlMap(content);
  if (map.size === 0) {
    return null;
  }

  const frontmatterName = readYamlValue(map, ["name", "title", "skillName", "skill.name", "metadata.name"]);
  const frontmatterDescription = readYamlValue(map, [
    "description",
    "summary",
    "purpose",
    "overview",
    "skill.description",
    "metadata.description",
  ]);
  const audience = readYamlValue(map, ["audience", "targetAudience", "target_users", "targetUsers"]);
  const mainTask = readYamlValue(map, ["mainTask", "task", "tasks", "useCases", "scenario"]);
  const inputFormat = readYamlValue(map, ["inputFormat", "input", "inputs", "input_format"]);
  const outputFormat = readYamlValue(map, ["outputFormat", "output", "outputs", "output_format"]);
  const warnings = readYamlValue(map, ["warnings", "notes", "cautions", "risk"]);
  const summary = [frontmatterDescription, mainTask, inputFormat, outputFormat].filter(Boolean).join(" ").slice(0, 180);

  if (
    !frontmatterName &&
    !frontmatterDescription &&
    !audience &&
    !mainTask &&
    !inputFormat &&
    !outputFormat &&
    !warnings
  ) {
    return null;
  }

  return {
    frontmatterName,
    frontmatterDescription,
    headingTitle: frontmatterName,
    description: frontmatterDescription,
    audience,
    mainTask,
    inputFormat,
    outputFormat,
    warnings,
    summary,
  };
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
  const jsonParsed = parseJsonSkillContent(normalized);

  if (jsonParsed) {
    return jsonParsed;
  }

  const yamlParsed = parseYamlSkillContent(normalized);
  if (yamlParsed) {
    return yamlParsed;
  }

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
