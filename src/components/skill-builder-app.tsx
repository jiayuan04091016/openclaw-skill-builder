"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { buildDraftContent, buildStructuredSpec, createId, exportProjectZip, formatDateLabel } from "@/lib/skill-builder";
import type { AppSection, BuilderMode, DraftContent, OutputStyle, ProjectRecord, ResourceItem, ResourceType } from "@/types/app";

const STORAGE_KEY = "openclaw-skill-builder-projects";

const navItems: { id: AppSection; label: string }[] = [
  { id: "home", label: "首页" },
  { id: "learn", label: "学习中心" },
  { id: "builder", label: "开始制作" },
  { id: "skills", label: "我的 Skills" },
  { id: "help", label: "帮助" },
];

const templates = [
  { title: "会议纪要助手", goal: "我想做一个帮助整理会议纪要并列出待办事项的 Skill" },
  { title: "客服回复助手", goal: "我想做一个根据客户问题生成礼貌回复建议的 Skill" },
  { title: "网页摘要助手", goal: "我想做一个把网页内容整理成新手易读摘要的 Skill" },
];

const learningCards = [
  {
    title: "什么是 Skill",
    body: "Skill 可以理解为一套固定任务说明。这个应用会帮你把自然语言目标整理成 Skill 文件。",
  },
  {
    title: "从零创建",
    body: "你只要输入想达到的目标，再上传一点资料，系统就会帮你整理出第一版。",
  },
  {
    title: "导入旧 Skill",
    body: "如果你已经有 SKILL.md，也可以继续加需求，做成新版而不用重来。",
  },
];

const faqs = [
  {
    q: "这个应用先上什么平台最省钱？",
    a: "首发建议上 Web。直接部署到 Vercel 免费版即可，用户打开浏览器就能使用，不需要应用商店审核，也不用额外服务器。",
  },
  {
    q: "导出的 Skill 放到哪里？",
    a: "先解压 ZIP，再把整个目录放到 OpenClaw 的 skills 目录里，然后重启或刷新 OpenClaw。",
  },
  {
    q: "为什么先不做数据库？",
    a: "第一版优先完成和验证需求，项目先存浏览器本地，能大幅降低开发和运维成本。后续再平滑升级到云端存储。",
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
  const [statusMessage, setStatusMessage] = useState("已准备好开始。");
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
      setStatusMessage("本地草稿读取失败，已忽略旧数据。");
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
    setStatusMessage("已进入导入模式，先上传已有 Skill。");
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
      content: content || `${file.name} 已上传，可作为参考资料。`,
      createdAt: nowIso(),
    };

    updateProject({
      resources: [...activeProject.resources, resource],
      importedSkillText: type === "skill" ? content : activeProject.importedSkillText,
    });
    setStatusMessage(`已加入资料：${file.name}`);
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
    setStatusMessage("已生成草稿，现在可以预览、微调并导出。");
  }

  async function exportCurrentProject() {
    if (!activeProject) {
      return;
    }

    try {
      setLoading(true);
      const { blob, fileName } = await exportProjectZip(activeProject);
      downloadBlob(blob, fileName);
      setStatusMessage("导出成功，ZIP 已开始下载。");
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
      title: `${source.title || "未命名 Skill"} - 副本`,
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
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">面向电脑新手的 Skill 打包工作台</h1>
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
                <div className="rounded-[32px] bg-[linear-gradient(135deg,#fefce8_0%,#eff6ff_45%,#ecfeff_100%)] p-8 shadow-[0_16px_40px_rgba(14,116,144,0.12)]">
                  <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-slate-700">
                    最小成本首发方案
                  </span>
                  <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950">
                    把你的需求和资料，快速打包成 OpenClaw 可用 Skills
                  </h2>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
                    第一版直接走 Web 平台，免安装、免数据库、免运维。先把主链路做通，后面再慢慢增强。
                  </p>
                  <div className="mt-8 rounded-[24px] border border-white/60 bg-white/75 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">你想做什么 Skill？</label>
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
                  {learningCards.map((card) => (
                    <div key={card.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                      <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{card.body}</p>
                    </div>
                  ))}
                </div>
              </section>

              <SectionCard title="新手常用模板">
                <div className="grid gap-4 md:grid-cols-3">
                  {templates.map((template) => (
                    <div key={template.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-lg font-semibold text-slate-900">{template.title}</h3>
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
            <div className="grid gap-6 lg:grid-cols-3">
              <SectionCard title="零基础入门">
                <div className="space-y-4 text-sm leading-7 text-slate-700">
                  <p>1. 先说目标：直接描述你想完成什么。</p>
                  <p>2. 再补资料：文章、说明、已有 Skill 都可以。</p>
                  <p>3. 生成草稿：系统会帮你整理成规范内容。</p>
                  <p>4. 导出安装：下载 ZIP 后放进 OpenClaw 的 skills 目录。</p>
                </div>
              </SectionCard>
              <SectionCard title="图片与视频怎么用">
                <div className="space-y-4 text-sm leading-7 text-slate-700">
                  <p>首版先把图片和视频当作参考资料入口处理，支持上传和备注。</p>
                  <p>如果资料是关键说明，建议同步补一段文字说明，生成效果会更稳。</p>
                  <p>后续版本再补 OCR 和视频转写，先把可用版本上线。</p>
                </div>
              </SectionCard>
              <SectionCard title="已有 Skill 如何再加工">
                <div className="space-y-4 text-sm leading-7 text-slate-700">
                  <p>上传已有的 `SKILL.md` 或把内容粘贴进来。</p>
                  <p>再补一句你想新增的能力，例如“增加投诉安抚场景”。</p>
                  <p>系统会用你的新目标覆盖旧版本方向，再重新标准化导出。</p>
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
                    <div className="rounded-[24px] bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                      <h3 className="text-base font-semibold text-slate-900">怎么写更快生成好结果</h3>
                      <p className="mt-3">写清楚给谁用、要做什么、最后想得到什么结果。</p>
                      <p className="mt-2">先不用写很专业，越像平时说话越好。</p>
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
                <SectionCard title={activeProject.mode === "import" ? "步骤 2：导入旧 Skill 并补资料" : "步骤 2：上传参考资料"}>
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
                      <h3 className="text-base font-semibold text-slate-900">已添加资料</h3>
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
                            还没有添加任何资料。没关系，你也可以先继续，后面再补。
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
                    <div className="rounded-[24px] bg-slate-50 p-5">
                      <h3 className="text-base font-semibold text-slate-900">系统理解摘要</h3>
                      {structuredSpec ? (
                        <dl className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                          <div>
                            <dt className="font-semibold text-slate-900">Skill 名称建议</dt>
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
                <SectionCard title="步骤 4：预览并微调">
                  <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-4">
                      <Field label="Skill 名称" value={activeProject.title || structuredSpec?.skillName || ""} placeholder="例如：会议纪要助手" onChange={(value) => updateProject({ title: value })} />
                      <Field label="一句话描述" value={activeProject.description} placeholder="帮助谁完成什么任务，并输出什么结果" onChange={(value) => updateProject({ description: value })} multiline />
                      <Field label="输出语言" value={activeProject.language} placeholder="例如：zh-CN" onChange={(value) => updateProject({ language: value })} />
                      <Field label="风险提示" value={activeProject.warnings} placeholder="例如：请勿输入敏感信息" onChange={(value) => updateProject({ warnings: value })} multiline />
                      <label className="flex items-center gap-3 rounded-[18px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <input type="checkbox" checked={activeProject.includeExamples} onChange={(event) => updateProject({ includeExamples: event.target.checked })} />
                        附带示例输入和示例输出
                      </label>
                      <button className="rounded-full border border-cyan-600 px-5 py-3 text-sm font-semibold text-cyan-700" onClick={generateDraft}>
                        重新生成预览
                      </button>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                        {[
                          { id: "guide", label: "说明版" },
                          { id: "skill", label: "SKILL.md 版" },
                          { id: "result", label: "效果版" },
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
                      下一步：导出
                    </button>
                  </div>
                </SectionCard>
              ) : null}

              {builderStep === 5 ? (
                <SectionCard title="步骤 5：导出并安装">
                  <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-5">
                      <div className="rounded-[24px] bg-slate-50 p-5">
                        <h3 className="text-base font-semibold text-slate-900">导出摘要</h3>
                        <dl className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                          <div>
                            <dt className="font-semibold text-slate-900">Skill 名称</dt>
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
                      <div className="rounded-[24px] bg-slate-50 p-5 text-sm leading-7 text-slate-700">
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
                        {loading ? "正在导出..." : "导出 ZIP"}
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
              title="我的 Skills"
              action={
                <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => startFromScratch()}>
                  新建项目
                </button>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                {projects.length ? (
                  projects.map((project) => (
                    <div key={project.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{project.title || buildStructuredSpec(project).skillName}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{project.goal || "还没有填写目标"}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {project.mode === "create" ? "新建" : "导入"}
                        </span>
                      </div>
                      <div className="mt-4 text-sm text-slate-500">最近更新：{formatDateLabel(project.updatedAt)}</div>
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
                          重新导出
                        </button>
                        <button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600" onClick={() => deleteProject(project.id)}>
                          删除
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[24px] bg-slate-50 p-8 text-sm leading-7 text-slate-600">
                    你还没有创建过 Skill。先去首页或“开始制作”页面做第一个版本。
                  </div>
                )}
              </div>
            </SectionCard>
          ) : null}

          {section === "help" ? (
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

              <SectionCard title="上线方案">
                <div className="space-y-4 text-sm leading-7 text-slate-700">
                  <p>平台：Web，优先上 Vercel 免费版。</p>
                  <p>原因：零服务器运维、免费 SSL、自动部署、最适合先上线验证。</p>
                  <p>当前版本：浏览器本地存储 + 浏览器本地导出 ZIP。</p>
                  <p>后续增强：如果用户量起来，再加账号、云端存储和服务端生成。</p>
                </div>
              </SectionCard>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
