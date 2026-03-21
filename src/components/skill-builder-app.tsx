"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { buildDraftContent, buildStructuredSpec, createId, exportProjectZip, formatDateLabel } from "@/lib/skill-builder";
import type { AppSection, BuilderMode, DraftContent, OutputStyle, ProjectRecord, ResourceItem, ResourceType } from "@/types/app";

const STORAGE_KEY = "openclaw-skill-builder-projects";

const navItems: { id: AppSection; label: string }[] = [
  { id: "home", label: "首页" },
  { id: "learn", label: "学习中心" },
  { id: "builder", label: "开始制作" },
  { id: "skills", label: "我的项目" },
  { id: "help", label: "帮助" },
];

const templates = [
  { title: "会议纪要助手", goal: "我想做一个帮助整理会议纪要并列出待办事项的 Skill" },
  { title: "客服回复助手", goal: "我想做一个根据客户问题生成礼貌回复建议的 Skill" },
  { title: "网页摘要助手", goal: "我想做一个把网页内容整理成新手易读摘要的 Skill" },
];

const learningCards = [
  {
    title: "说出你的目标",
    body: "像平时说话一样描述你想完成什么，不需要先懂文件结构或写法。",
  },
  {
    title: "补充你的资料",
    body: "文章、截图、视频链接、旧 Skill 都可以加进来，系统会一起参考。",
  },
  {
    title: "导出就能使用",
    body: "生成后可以直接查看说明、预览内容，再导出成可继续使用的压缩包。",
  },
];

const faqs = [
  {
    q: "这个应用适合谁使用？",
    a: "适合刚接触 OpenClaw、不会自己写 Skill 文件，或者想把现有资料快速整理成可用 Skill 的用户。",
  },
  {
    q: "导出的 Skill 放到哪里？",
    a: "先解压 ZIP，再把整个目录放到 OpenClaw 的 skills 目录里，然后重启或刷新 OpenClaw。",
  },
  {
    q: "支持哪些资料类型？",
    a: "目前支持文字资料、图片、视频链接备注，以及已有的 SKILL.md 内容。你可以先从最简单的文字资料开始，熟悉后再逐步补充更多内容。",
  },
];

function nowIso() {
  return new Date().toISOString();
}

function makeEmptyProject(mode: BuilderMode, seedGoal = ""): ProjectRecord {
  const createdAt = nowIso();

  return {
    id: createId(),
    mode,
    title: "",
    goal: seedGoal,
    description: "",
    audience: "",
    mainTask: "",
    inputFormat: "",
    outputFormat: "",
    outputStyle: "simple",
    language: "zh-CN",
    warnings: "",
    includeExamples: true,
    resources: [],
    importedSkillText: "",
    draft: null,
    createdAt,
    updatedAt: createdAt,
  };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function readFileContent(file: File) {
  if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
    return file.text();
  }

  return Promise.resolve("");
}

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          className="mt-2 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500"
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          value={value}
          className="mt-2 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500"
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function QuickResourceForm({
  onAdd,
}: {
  onAdd: (type: ResourceType, name: string, content: string) => void;
}) {
  const [textContent, setTextContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        直接粘贴文字资料
        <textarea
          rows={5}
          value={textContent}
          className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500"
          placeholder="把文章、流程说明、需求说明直接粘贴进来"
          onChange={(event) => setTextContent(event.target.value)}
        />
      </label>
      <button
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        onClick={() => {
          if (!textContent.trim()) return;
          onAdd("text", "粘贴文本", textContent);
          setTextContent("");
        }}
      >
        添加文本资料
      </button>

      <label className="block text-sm font-medium text-slate-700">
        视频链接或备注
        <textarea
          rows={3}
          value={videoUrl}
          className="mt-2 w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500"
          placeholder="比如：培训视频链接，或者简单写一句有 10 分钟讲解视频可参考"
          onChange={(event) => setVideoUrl(event.target.value)}
        />
      </label>
      <button
        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        onClick={() => {
          if (!videoUrl.trim()) return;
          onAdd("video", "视频参考", videoUrl);
          setVideoUrl("");
        }}
      >
        添加视频资料
      </button>
    </div>
  );
}

export function SkillBuilderApp() {
  const [section, setSection] = useState<AppSection>("home");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [builderStep, setBuilderStep] = useState(1);
  const [statusMessage, setStatusMessage] = useState("已经准备好，可以开始制作。");
  const [previewMode, setPreviewMode] = useState<"guide" | "skill" | "result">("guide");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as ProjectRecord[];
      setProjects(parsed);
      if (parsed[0]) {
        setActiveProjectId(parsed[0].id);
      }
    } catch {
      setStatusMessage("之前保存的内容没有成功读取，系统已自动跳过旧数据。");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const activeProject = useMemo(
    () => projects.find((item) => item.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const structuredSpec = useMemo(
    () => (activeProject ? buildStructuredSpec(activeProject) : null),
    [activeProject],
  );

  const currentDraft =
    activeProject?.draft ??
    (structuredSpec && activeProject ? buildDraftContent(structuredSpec, activeProject.includeExamples) : null);

  function upsertProject(project: ProjectRecord) {
    setProjects((current) => {
      const index = current.findIndex((item) => item.id === project.id);
      if (index === -1) {
        return [project, ...current];
      }

      const next = [...current];
      next[index] = project;
      return next.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    });
  }

  function ensureProject(mode: BuilderMode, seedGoal = "") {
    if (activeProject && activeProject.mode === mode) {
      return activeProject;
    }

    const project = makeEmptyProject(mode, seedGoal);
    upsertProject(project);
    setActiveProjectId(project.id);
    return project;
  }

  function updateProject(patch: Partial<ProjectRecord>) {
    if (!activeProject) {
      return;
    }

    upsertProject({
      ...activeProject,
      ...patch,
      updatedAt: nowIso(),
    });
  }

  function startFromScratch(goal = "") {
    const project = makeEmptyProject("create", goal);
    upsertProject(project);
    setActiveProjectId(project.id);
    setBuilderStep(1);
    setSection("builder");
    setStatusMessage("已创建新项目，可以开始填写目标。");
  }

  function startFromImport(goal = "") {
    const project = makeEmptyProject("import", goal);
    upsertProject(project);
    setActiveProjectId(project.id);
    setBuilderStep(1);
    setSection("builder");
    setStatusMessage("已进入导入模式，请先添加已有 Skill 内容。");
  }

  function removeResource(resourceId: string) {
    if (!activeProject) {
      return;
    }

    updateProject({
      resources: activeProject.resources.filter((item) => item.id !== resourceId),
    });
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>, type: ResourceType) {
    const file = event.target.files?.[0];

    if (!file || !activeProject) {
      return;
    }

    const content = await readFileContent(file);
    const resource: ResourceItem = {
      id: createId("res"),
      type,
      name: file.name,
      content: content || `${file.name} 已上传，可作为补充资料使用。`,
      createdAt: nowIso(),
    };

    updateProject({
      resources: [...activeProject.resources, resource],
      importedSkillText: type === "skill" ? content : activeProject.importedSkillText,
    });
    setStatusMessage(`已添加资料：${file.name}`);
    event.target.value = "";
  }

  function addManualResource(type: ResourceType, name: string, content: string) {
    if (!activeProject || !content.trim()) {
      return;
    }

    const resource: ResourceItem = {
      id: createId("res"),
      type,
      name,
      content,
      createdAt: nowIso(),
    };

    updateProject({ resources: [...activeProject.resources, resource] });
    setStatusMessage(`已添加 ${name}`);
  }

  function generateDraft() {
    if (!activeProject) {
      return;
    }

    const nextDraft: DraftContent = buildDraftContent(buildStructuredSpec(activeProject), activeProject.includeExamples);
    updateProject({ draft: nextDraft, title: activeProject.title || buildStructuredSpec(activeProject).skillName });
    setBuilderStep(4);
    setStatusMessage("内容已生成，现在可以预览、调整并导出。");
  }

  async function exportCurrentProject() {
    if (!activeProject) {
      return;
    }

    try {
      setLoading(true);
      const { blob, fileName } = await exportProjectZip(activeProject);
      downloadBlob(blob, fileName);
      setStatusMessage("导出成功，压缩包已经开始下载。");
    } catch {
      setStatusMessage("导出失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  function duplicateProject(projectId: string) {
    const source = projects.find((item) => item.id === projectId);
    if (!source) {
      return;
    }

    const duplicate = {
      ...source,
      id: createId(),
      title: `${source.title || "未命名项目"} - 副本`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    upsertProject(duplicate);
    setActiveProjectId(duplicate.id);
    setSection("skills");
    setStatusMessage("已复制为新版本。");
  }

  function deleteProject(projectId: string) {
    const nextProjects = projects.filter((item) => item.id !== projectId);
    setProjects(nextProjects);
    if (activeProjectId === projectId) {
      setActiveProjectId(nextProjects[0]?.id ?? null);
    }
    setStatusMessage("项目已删除。");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#f8fafc_28%,#eef6ff_60%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">OpenClaw Skill Builder</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">面向电脑新手的 Skill 制作工作台</h1>
            </div>
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    section === item.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  onClick={() => setSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-4 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
            当前状态：{statusMessage}
          </div>
        </header>

        <main className="mt-6 flex-1 space-y-6">
          {section === "home" ? (
            <>
              <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#fff7ed_0%,#eff6ff_38%,#ecfeff_100%)] p-8 shadow-[0_18px_48px_rgba(14,116,144,0.12)]">
                  <div className="absolute -right-14 top-0 h-40 w-40 rounded-full bg-cyan-200/30 blur-3xl" />
                  <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-amber-200/30 blur-3xl" />
                  <span className="relative inline-flex rounded-full bg-white/85 px-3 py-1 text-sm font-medium text-slate-700">
                    适合零基础上手
                  </span>
                  <h2 className="relative mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    把你的需求和资料，快速整理成 OpenClaw 可用的 Skills
                  </h2>
                  <p className="relative mt-4 max-w-2xl text-lg leading-8 text-slate-700">
                    输入目标，补充文章、图片、视频或已有 Skill，系统会一步一步帮你整理、生成并导出可直接使用的内容。
                  </p>
                  <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
                    {learningCards.map((card, index) => (
                      <div key={card.title} className="rounded-[22px] border border-white/80 bg-white/65 p-4 backdrop-blur">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">步骤 {index + 1}</div>
                        <h3 className="mt-2 text-base font-semibold text-slate-900">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="relative mt-8 rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-[0_12px_30px_rgba(255,255,255,0.35)]">
                    <label className="mb-2 block text-sm font-medium text-slate-700">你想制作什么 Skill？</label>
                    <textarea
                      rows={4}
                      className="w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-500"
                      placeholder="比如：我想做一个帮助整理会议纪要并列出待办事项的 Skill"
                      defaultValue={activeProject?.goal ?? ""}
                      onBlur={(event) => {
                        if (activeProject) {
                          updateProject({ goal: event.target.value });
                        }
                      }}
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={() => startFromScratch(activeProject?.goal ?? "")}>
                        从零创建
                      </button>
                      <button className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700" onClick={() => startFromImport(activeProject?.goal ?? "")}>
                        导入已有 Skill
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {[
                    {
                      title: "适合谁用",
                      body: "适合刚接触 OpenClaw、还不熟悉 Skill 文件写法、希望有人带着完成第一次制作的用户。",
                    },
                    {
                      title: "你会得到什么",
                      body: "你会拿到一份清晰说明、可查看的 Skill 内容，以及可继续使用的导出文件。",
                    },
                    {
                      title: "推荐的开始方式",
                      body: "第一次建议直接从模板开始，先成功做出一个版本，再慢慢补自己的真实资料。",
                    },
                  ].map((card) => (
                    <div key={card.title} className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                      <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{card.body}</p>
                    </div>
                  ))}
                </div>
              </section>

              <SectionCard
                title="新手常用模板"
                action={<span className="text-sm text-slate-500">先选一个最接近的场景开始，后面都能改</span>}
              >
                <div className="grid gap-4 md:grid-cols-3">
                  {templates.map((template) => (
                    <div key={template.title} className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                      <div className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">推荐模板</div>
                      <h3 className="mt-3 text-lg font-semibold text-slate-900">{template.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{template.goal}</p>
                      <button className="mt-4 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => startFromScratch(template.goal)}>
                        使用这个模板
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          ) : null}

          {section === "learn" ? (
            <div className="space-y-6">
              <SectionCard title="学习中心">
                <div className="rounded-[28px] bg-[linear-gradient(135deg,#fff7ed_0%,#f8fafc_40%,#eef6ff_100%)] p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">新手入门</p>
                      <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">先看懂 3 件事，再开始做第一个 Skill</h3>
                      <p className="mt-3 text-base leading-8 text-slate-700">
                        如果你是第一次接触 OpenClaw，建议先看下面这三部分。看完以后，再回到“开始制作”页面，流程会顺很多。
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={() => setSection("builder")}>
                        去开始制作
                      </button>
                      <button className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700" onClick={() => setSection("home")}>
                        回首页看模板
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-6 lg:grid-cols-3">
                <SectionCard title="第一步：先理解流程">
                  <div className="space-y-4 text-sm leading-7 text-slate-700">
                    <p>1. 先说目标：直接描述你想完成什么。</p>
                    <p>2. 再补资料：文章、说明、已有 Skill 都可以。</p>
                    <p>3. 生成内容：系统会先帮你整理出一版可继续调整的结果。</p>
                    <p>4. 导出安装：下载 ZIP 后放进 OpenClaw 的 skills 目录。</p>
                  </div>
                </SectionCard>
                <SectionCard title="第二步：学会用资料">
                  <div className="space-y-4 text-sm leading-7 text-slate-700">
                    <p>图片和视频目前主要作为补充资料使用，支持上传和备注。</p>
                    <p>如果资料里有关键说明，建议同步补一段文字说明，生成结果会更稳。</p>
                    <p>第一次使用时，优先上传最能说明任务目标的那一份资料。</p>
                  </div>
                </SectionCard>
                <SectionCard title="第三步：学会改旧版本">
                  <div className="space-y-4 text-sm leading-7 text-slate-700">
                    <p>上传已有的 `SKILL.md` 或把内容粘贴进来。</p>
                    <p>再补一句你想新增的能力，例如“增加投诉安抚场景”。</p>
                    <p>系统会根据你的新目标重新整理内容，再导出成更适合当前需求的新版本。</p>
                  </div>
                </SectionCard>
              </div>

              <SectionCard title="推荐做法">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      title: "先从模板开始",
                      body: "第一次尽量不要空白开始。先用最接近的模板跑通流程，再慢慢替换成自己的真实需求。",
                    },
                    {
                      title: "先做小任务",
                      body: "第一次建议先做一个输入简单、结果直观的小任务，比如摘要、整理或回复建议。",
                    },
                    {
                      title: "先测试再扩展",
                      body: "导出后先用示例内容试一次，确认方向没问题，再继续补充更多资料和场景。",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                      <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          ) : null}

          {section === "builder" && activeProject ? (
            <>
              <SectionCard
                title="创建向导"
                action={
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                    {(["create", "import"] as BuilderMode[]).map((mode) => (
                      <button
                        key={mode}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          activeProject.mode === mode ? "bg-slate-950 text-white" : "text-slate-600"
                        }`}
                        onClick={() => {
                          const next = ensureProject(mode, activeProject.goal);
                          setActiveProjectId(next.id);
                          setStatusMessage(mode === "create" ? "已切换到从零创建模式。" : "已切换到导入模式。");
                        }}
                      >
                        {mode === "create" ? "从零创建" : "导入已有 Skill"}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="mb-5 rounded-[24px] bg-[linear-gradient(135deg,#fff7ed_0%,#f8fafc_45%,#eef6ff_100%)] p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">当前流程</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">
                        {builderStep === 1 && "先把目标说清楚"}
                        {builderStep === 2 && "补充资料，让结果更贴近你的需求"}
                        {builderStep === 3 && "确认输入、输出和适用场景"}
                        {builderStep === 4 && "检查内容，按你的习惯做最后调整"}
                        {builderStep === 5 && "导出文件并按步骤安装使用"}
                      </h3>
                    </div>
                    <p className="max-w-xl text-sm leading-7 text-slate-600">
                      {builderStep === 1 && "这一步建议先用最简单的话描述你想完成的事，不需要担心写得不专业。"}
                      {builderStep === 2 && "如果你手头有资料、说明文档、图片或旧 Skill，现在一起补上会更稳。"}
                      {builderStep === 3 && "系统会根据这里的设置整理出更清晰的结果，你也可以后面继续改。"}
                      {builderStep === 4 && "先看说明版，再看 Skill 内容和示例，确认方向对了再导出。"}
                      {builderStep === 5 && "导出后先用示例测试一次，确认没问题再放进真实场景使用。"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-5">
                  {[
                    { id: 1, title: "目标" },
                    { id: 2, title: "资料" },
                    { id: 3, title: "场景" },
                    { id: 4, title: "预览" },
                    { id: 5, title: "导出" },
                  ].map((step) => (
                    <button
                      key={step.id}
                      className={`rounded-[20px] px-4 py-3 text-left text-sm transition ${
                        builderStep === step.id ? "bg-slate-950 text-white" : "border border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                      onClick={() => setBuilderStep(step.id)}
                    >
                      <div className="font-semibold">步骤 {step.id}</div>
                      <div className="mt-1">{step.title}</div>
                    </button>
                  ))}
                </div>
              </SectionCard>

              {builderStep === 1 ? (
                <SectionCard title="步骤 1：你想达到什么目的">
                  <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                      <Field label="目标描述" value={activeProject.goal} placeholder="比如：我想做一个帮助整理会议纪要并列出待办事项的 Skill" onChange={(value) => updateProject({ goal: value })} multiline />
                      <Field label="补充说明" value={activeProject.description} placeholder="比如：主要给办公新手使用，希望输出尽量简单清楚" onChange={(value) => updateProject({ description: value })} multiline />
                    </div>
                    <div className="rounded-[24px] border border-amber-100 bg-amber-50/70 p-5 text-sm leading-7 text-slate-700">
                      <h3 className="text-base font-semibold text-slate-900">填写建议</h3>
                      <p className="mt-3">写清楚给谁用、要做什么、最后想得到什么结果。</p>
                      <p className="mt-2">先不用写很专业，越像平时说话越好。</p>
                      <p className="mt-2">如果你一时想不好，可以先用首页模板快速开始。</p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={() => setBuilderStep(2)}>
                      下一步：补资料
                    </button>
                  </div>
                </SectionCard>
              ) : null}

              {builderStep === 2 ? (
                <SectionCard title={activeProject.mode === "import" ? "步骤 2：导入旧 Skill 并补充资料" : "步骤 2：补充参考资料"}>
                  <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
                    <div className="space-y-4">
                      {activeProject.mode === "import" ? (
                        <Field
                          label="粘贴已有 Skill 内容"
                          value={activeProject.importedSkillText}
                          placeholder="把已有的 SKILL.md 内容粘贴到这里，或者上传 .md 文件"
                          onChange={(value) => updateProject({ importedSkillText: value })}
                          multiline
                        />
                      ) : null}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
                          上传文本或 Skill 文件
                          <input
                            type="file"
                            accept=".txt,.md,text/plain,text/markdown"
                            className="mt-2 block w-full text-sm"
                            onChange={(event) => handleFileUpload(event, activeProject.mode === "import" ? "skill" : "text")}
                          />
                        </label>
                        <label className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
                          上传图片
                          <input type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={(event) => handleFileUpload(event, "image")} />
                        </label>
                      </div>
                      <QuickResourceForm onAdd={addManualResource} />
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <h3 className="text-base font-semibold text-slate-900">已添加的资料</h3>
                      <div className="mt-4 space-y-3">
                        {activeProject.resources.length ? (
                          activeProject.resources.map((resource) => (
                            <div key={resource.id} className="rounded-[18px] bg-slate-50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{resource.name}</div>
                                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{resource.type}</div>
                                </div>
                                <button className="text-sm font-medium text-rose-600" onClick={() => removeResource(resource.id)}>
                                  删除
                                </button>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-slate-600">{resource.content.slice(0, 120)}</p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[18px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                            还没有添加任何资料。没关系，你也可以先继续，后面再补充。
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700" onClick={() => setBuilderStep(1)}>
                      上一步
                    </button>
                    <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={() => setBuilderStep(3)}>
                      下一步：设置场景
                    </button>
                  </div>
                </SectionCard>
              ) : null}

              {builderStep === 3 ? (
                <SectionCard title="步骤 3：确认适用场景">
                  <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                    <div className="grid gap-4">
                      <Field label="适用对象" value={activeProject.audience} placeholder="例如：办公新手、客服人员、内容编辑" onChange={(value) => updateProject({ audience: value })} />
                      <Field label="主要任务" value={activeProject.mainTask} placeholder="例如：整理会议纪要、生成客服回复、总结网页内容" onChange={(value) => updateProject({ mainTask: value })} />
                      <Field label="输入内容" value={activeProject.inputFormat} placeholder="例如：会议记录、客户问题、网页文字" onChange={(value) => updateProject({ inputFormat: value })} />
                      <Field label="输出内容" value={activeProject.outputFormat} placeholder="例如：结构化纪要、回复建议、简洁摘要" onChange={(value) => updateProject({ outputFormat: value })} />
                      <div>
                        <span className="block text-sm font-medium text-slate-700">输出风格</span>
                        <div className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                          {(["simple", "detailed", "teaching"] as OutputStyle[]).map((style) => (
                            <button
                              key={style}
                              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                activeProject.outputStyle === style ? "bg-cyan-600 text-white" : "text-slate-600"
                              }`}
                              onClick={() => updateProject({ outputStyle: style })}
                            >
                              {style === "simple" ? "简洁" : style === "detailed" ? "详细" : "教学式"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-cyan-100 bg-cyan-50/60 p-5">
                      <h3 className="text-base font-semibold text-slate-900">整理结果预览</h3>
                      {structuredSpec ? (
                        <dl className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                          <div>
                            <dt className="font-semibold text-slate-900">建议名称</dt>
                            <dd>{structuredSpec.skillName}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-slate-900">用途</dt>
                            <dd>{structuredSpec.description}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-slate-900">输入 / 输出</dt>
                            <dd>{structuredSpec.inputFormat}</dd>
                            <dd>{structuredSpec.outputFormat}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-slate-900">注意事项</dt>
                            <dd className="whitespace-pre-line">{structuredSpec.warnings}</dd>
                          </div>
                        </dl>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700" onClick={() => setBuilderStep(2)}>
                      上一步
                    </button>
                    <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={generateDraft}>
                      生成草稿
                    </button>
                  </div>
                </SectionCard>
              ) : null}

              {builderStep === 4 ? (
                <SectionCard title="步骤 4：预览并调整">
                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-4">
                      <Field label="Skill 名称" value={activeProject.title || structuredSpec?.skillName || ""} placeholder="例如：会议纪要助手" onChange={(value) => updateProject({ title: value })} />
                      <Field label="一句话描述" value={activeProject.description} placeholder="帮助谁完成什么任务，并输出什么结果" onChange={(value) => updateProject({ description: value })} multiline />
                      <Field label="输出语言" value={activeProject.language} placeholder="例如：zh-CN" onChange={(value) => updateProject({ language: value })} />
                      <Field label="风险提示" value={activeProject.warnings} placeholder="例如：请勿输入敏感信息" onChange={(value) => updateProject({ warnings: value })} multiline />
                      <label className="flex items-center gap-3 rounded-[18px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <input type="checkbox" checked={activeProject.includeExamples} onChange={(event) => updateProject({ includeExamples: event.target.checked })} />
                        附带示例输入和示例结果
                      </label>
                      <button className="rounded-full border border-cyan-600 px-5 py-3 text-sm font-semibold text-cyan-700" onClick={generateDraft}>
                        重新生成内容
                      </button>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                      <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                        {[
                          { id: "guide", label: "说明版" },
                          { id: "skill", label: "SKILL.md 版" },
                          { id: "result", label: "示例版" },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                              previewMode === mode.id ? "bg-slate-950 text-white" : "text-slate-600"
                            }`}
                            onClick={() => setPreviewMode(mode.id as "guide" | "skill" | "result")}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>

                      <pre className="mt-4 max-h-[36rem] overflow-auto rounded-[20px] bg-slate-950 p-5 text-sm leading-7 whitespace-pre-wrap text-slate-100">
                        {previewMode === "guide"
                          ? currentDraft?.previewText
                          : previewMode === "skill"
                            ? currentDraft?.skillMarkdown
                            : `示例输入：\n${currentDraft?.exampleInput ?? ""}\n\n示例输出：\n${currentDraft?.exampleOutput ?? ""}`}
                      </pre>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700" onClick={() => setBuilderStep(3)}>
                      上一步
                    </button>
                    <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" onClick={() => setBuilderStep(5)}>
                      下一步：导出文件
                    </button>
                  </div>
                </SectionCard>
              ) : null}

              {builderStep === 5 ? (
                <SectionCard title="步骤 5：导出文件并安装">
                  <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-5">
                      <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/60 p-5">
                        <h3 className="text-base font-semibold text-slate-900">导出信息</h3>
                        <dl className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                          <div>
                            <dt className="font-semibold text-slate-900">名称</dt>
                            <dd>{activeProject.title || structuredSpec?.skillName}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-slate-900">模式</dt>
                            <dd>{activeProject.mode === "create" ? "从零创建" : "导入已有 Skill"}</dd>
                          </div>
                          <div>
                            <dt className="font-semibold text-slate-900">更新时间</dt>
                            <dd>{formatDateLabel(activeProject.updatedAt)}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                        <h3 className="text-base font-semibold text-slate-900">安装步骤</h3>
                        <p className="mt-3">1. 点击导出 ZIP。</p>
                        <p>2. 解压文件夹。</p>
                        <p>3. 把整个目录放进 OpenClaw 的 skills 目录。</p>
                        <p>4. 重启或刷新 OpenClaw。</p>
                        <p>5. 先用示例输入测试一次，再放入真实内容。</p>
                      </div>
                      <button
                        className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-cyan-300"
                        onClick={exportCurrentProject}
                        disabled={loading}
                      >
                        {loading ? "正在导出..." : "导出压缩包"}
                      </button>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <h3 className="text-base font-semibold text-slate-900">文件结构预览</h3>
                      <pre className="mt-4 rounded-[20px] bg-slate-950 p-5 text-sm leading-7 text-slate-100">
{`${activeProject.title || structuredSpec?.skillName || "skill-package"}/
├─ SKILL.md
├─ README.md
├─ examples/
│  └─ sample.txt
└─ meta.json`}
                      </pre>
                    </div>
                  </div>
                </SectionCard>
              ) : null}
            </>
          ) : null}

          {section === "skills" ? (
            <SectionCard
              title="我的项目"
              action={
                <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => startFromScratch()}>
                  新建项目
                </button>
              }
            >
              <div className="mb-5 rounded-[24px] bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_55%,#fefce8_100%)] p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">项目管理</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">在这里继续编辑、复制版本，或重新导出你做过的内容</h3>
                  </div>
                  <p className="max-w-xl text-sm leading-7 text-slate-600">
                    如果你已经做过一个接近的版本，最省时间的方式通常不是重做，而是直接复制后继续调整。
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {projects.length ? (
                  projects.map((project) => (
                    <div key={project.id} className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{project.title || buildStructuredSpec(project).skillName}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{project.goal || "还没有填写目标"}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {project.mode === "create" ? "新建" : "导入"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-500">
                        <span>最近更新：{formatDateLabel(project.updatedAt)}</span>
                        <span>{project.draft ? "已生成内容" : "进行中"}</span>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                          onClick={() => {
                            setActiveProjectId(project.id);
                            setSection("builder");
                            setBuilderStep(project.draft ? 4 : 1);
                          }}
                        >
                          继续编辑
                        </button>
                        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => duplicateProject(project.id)}>
                          复制新版本
                        </button>
                        <button
                          className="rounded-full border border-cyan-600 px-4 py-2 text-sm font-semibold text-cyan-700"
                          onClick={async () => {
                            const { blob, fileName } = await exportProjectZip(project);
                            downloadBlob(blob, fileName);
                          }}
                        >
                          再次导出
                        </button>
                        <button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600" onClick={() => deleteProject(project.id)}>
                          删除
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] bg-slate-50 p-8 text-sm leading-7 text-slate-600">
                    你还没有创建过项目。先去首页或“开始制作”页面完成第一个版本，之后这里会自动保存你的历史记录。
                  </div>
                )}
              </div>
            </SectionCard>
          ) : null}

          {section === "help" ? (
            <div className="space-y-6">
              <SectionCard title="帮助中心">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">快速开始</div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">第一次使用建议</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">先选一个模板完成第一次创建，确认流程后再换成自己的真实需求。</p>
                  </div>
                  <div className="rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">安装提醒</div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">导出后怎么用</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">导出压缩包后先解压，再把整个目录放进 OpenClaw 的 skills 目录。</p>
                  </div>
                  <div className="rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">使用建议</div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">结果不满意怎么办</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">先回到前面的步骤补充更清楚的目标、输入和资料，再重新生成一次内容。</p>
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <SectionCard title="常见问题">
                <div className="space-y-4">
                  {faqs.map((item) => (
                    <details key={item.q} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                      <summary className="cursor-pointer text-base font-semibold text-slate-900">{item.q}</summary>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.a}</p>
                    </details>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="使用说明">
                <div className="space-y-4 text-sm leading-7 text-slate-700">
                  <p>先在首页输入你想完成的目标，再选择从零创建或导入已有 Skill。</p>
                  <p>如果你手头有文章、流程说明、图片、视频链接，也可以一起补充进去。</p>
                  <p>生成后先看说明版和示例，再导出压缩包放进 OpenClaw 的 skills 目录。</p>
                  <p>建议第一次先用简单任务测试，确认结果符合预期后再逐步补充真实资料。</p>
                </div>
              </SectionCard>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
