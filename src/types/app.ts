export type AppSection = "home" | "learn" | "builder" | "skills" | "help";

export type SessionMode = "guest" | "authenticated";

export type StorageMode = "local" | "cloud";

export type SyncState = "local-only" | "cloud-ready" | "syncing" | "error";

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

export type BackupPayload = {
  version: 1;
  exportedAt: string;
  projects: ProjectRecord[];
};

export type CloudResourceRecord = {
  id: string;
  type: ResourceType;
  name: string;
  content: string;
  createdAt: string;
};

export type CloudDraftRecord = DraftContent;

export type CloudProjectRecord = {
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
  resources: CloudResourceRecord[];
  importedSkillText: string;
  draft: CloudDraftRecord | null;
  createdAt: string;
  updatedAt: string;
};

export type CloudSyncBundle = {
  version: 1;
  exportedAt: string;
  projectCount: number;
  projects: CloudProjectRecord[];
};

export type RepositoryCapabilities = {
  authEnabled: boolean;
  cloudSyncEnabled: boolean;
  importAnalysisLevel: "basic" | "enhanced";
  storageMode: StorageMode;
};

export type RepositoryStatus = {
  projectCount: number;
  lastSavedAt: string | null;
  syncState: SyncState;
};

export type SessionState = {
  mode: SessionMode;
  storageMode: StorageMode;
  displayName: string;
  syncAvailable: boolean;
  syncHint: string;
};
