export type AppSection = "home" | "learn" | "builder" | "skills" | "help";

export type BuilderMode = "create" | "import";

export type OutputStyle = "simple" | "detailed" | "teaching";

export type ResourceType = "text" | "image" | "video" | "skill";

export type ResourceItem = {
  id: string;
  type: ResourceType;
  name: string;
  content: string;
  createdAt: string;
};

export type StructuredSpec = {
  skillName: string;
  description: string;
  audience: string;
  mainTask: string;
  inputFormat: string;
  outputFormat: string;
  outputStyle: OutputStyle;
  language: string;
  warnings: string;
  sourceSummary: string;
};

export type DraftContent = {
  previewText: string;
  skillMarkdown: string;
  readmeMarkdown: string;
  exampleInput: string;
  exampleOutput: string;
};

export type ProjectRecord = {
  id: string;
  mode: BuilderMode;
  title: string;
  goal: string;
  description: string;
  audience: string;
  mainTask: string;
  inputFormat: string;
  outputFormat: string;
  outputStyle: OutputStyle;
  language: string;
  warnings: string;
  includeExamples: boolean;
  resources: ResourceItem[];
  importedSkillText: string;
  draft: DraftContent | null;
  createdAt: string;
  updatedAt: string;
};
