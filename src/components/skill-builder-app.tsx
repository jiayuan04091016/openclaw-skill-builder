"use client";

import { useMemo, useState } from "react";

import { Field, QuickResourceForm, SectionCard } from "@/components/builder-ui";
import { ProjectCard } from "@/components/project-card";
import { useProjectManager } from "@/hooks/use-project-manager";
import { useSessionState } from "@/hooks/use-session-state";
import {
  builderStepMeta,
  builderStepTabs,
  faqs,
  learningCards,
  navItems,
  previewTabs,
  templates,
} from "@/lib/content";
import { formatDateLabel } from "@/lib/skill-builder";
import type { AppSection, BuilderMode, OutputStyle } from "@/types/app";

export function SkillBuilderApp() {
  const [section, setSection] = useState<AppSection>("home");
  const [builderStep, setBuilderStep] = useState(1);
  const [statusMessage, setStatusMessage] = useState("已准备好开始。");
  const [previewMode, setPreviewMode] = useState<"guide" | "skill" | "result">("guide");
  const [projectKeyword, setProjectKeyword] = useState("");
  const [projectFilter, setProjectFilter] = useState<"all" | "draft" | "generated" | "import">("all");
  const session = useSessionState();
  const {
    projects,
    activeProject,
    setActiveProjectId,
    homeGoal,
    setHomeGoal,
    loading,
    backupInputRef,
    currentDraft,
    structuredSpec,
    ensureProject,
    updateProject,
    startFromScratch: createProjectFromScratch,
    startFromImport: createProjectFromImport,
    removeResource,
    handleFileUpload,
    addManualResource,
    generateDraft: buildProjectDraft,
    exportCurrentProject,
    exportProjectById,
    exportProjectBackup,
    importProjectBackup,
    applyImportedSkillText,
    duplicateProject: duplicateManagedProject,
    deleteProject,
  } = useProjectManager({ onStatusChange: setStatusMessage });

  function startFromScratch(goal = "") {
    createProjectFromScratch(goal);
    setBuilderStep(1);
    setSection("builder");
  }

  function startFromImport(goal = "") {
    createProjectFromImport(goal);
    setBuilderStep(1);
    setSection("builder");
  }

  function continueFromLearning() {
    if (activeProject) {
      setSection("builder");
      return;
    }

    if (homeGoal.trim()) {
      startFromScratch(homeGoal);
      return;
    }

    setSection("home");
    setStatusMessage("先在首页写下一个目标，再开始制作会更顺。");
  }

  function generateDraft() {
    buildProjectDraft();
    setBuilderStep(4);
  }

  function duplicateProject(projectId: string) {
    duplicateManagedProject(projectId);
    setSection("skills");
  }

  async function copyPreviewContent() {
    if (!currentDraft) {
      return;
    }

    const content =
      previewMode === "guide"
        ? currentDraft.previewText
        : previewMode === "skill"
          ? currentDraft.skillMarkdown
          : `示例输入：\n${currentDraft.exampleInput}\n\n示例输出：\n${currentDraft.exampleOutput}`;

    await navigator.clipboard.writeText(content);
    setStatusMessage("当前预览内容已复制。");
  }

  async function copyInstallGuide() {
    const guide = [
      "1. 点击导出 ZIP。",
      "2. 解压文件夹。",
      "3. 把整个目录放进 OpenClaw 的 skills 目录。",
      "4. 重启或刷新 OpenClaw。",
      "5. 先用示例输入测试一次，再放入真实内容。",
    ].join("\n");

    await navigator.clipboard.writeText(guide);
    setStatusMessage("安装说明已复制。");
  }

  async function copyTestPrompt() {
    if (!currentDraft) {
      return;
    }

    await navigator.clipboard.writeText(currentDraft.exampleInput);
    setStatusMessage("测试提示词已复制。");
  }

  function goToResourceStep() {
    if (!activeProject?.goal.trim()) {
      setStatusMessage("请先写下你想完成的目标。");
      return;
    }

    setBuilderStep(2);
  }

  function goToGenerateStep() {
    if (!activeProject?.mainTask.trim() || !activeProject.inputFormat.trim() || !activeProject.outputFormat.trim()) {
      setStatusMessage("请先补充主要任务、输入内容和输出内容。");
      return;
    }

    generateDraft();
  }

  function applyStructuredSuggestions() {
    if (!activeProject || !structuredSpec) {
      return;
    }

    updateProject({
      title: activeProject.title || structuredSpec.skillName,
      description: activeProject.description || structuredSpec.description,
      audience: activeProject.audience || structuredSpec.audience,
      mainTask: activeProject.mainTask || structuredSpec.mainTask,
      inputFormat: activeProject.inputFormat || structuredSpec.inputFormat,
      outputFormat: activeProject.outputFormat || structuredSpec.outputFormat,
      warnings: activeProject.warnings || structuredSpec.warnings,
      language: activeProject.language || structuredSpec.language,
    });
    setStatusMessage("已用系统建议补全空白项。");
  }

  const filteredProjects = useMemo(() => {
    const keyword = projectKeyword.trim().toLowerCase();

    return projects.filter((project) => {
      const text = `${project.title} ${project.goal}`.toLowerCase();
      const keywordMatched = !keyword || text.includes(keyword);

      if (!keywordMatched) {
        return false;
      }

      if (projectFilter === "draft") {
        return !project.draft;
      }

      if (projectFilter === "generated") {
        return Boolean(project.draft);
      }

      if (projectFilter === "import") {
        return project.mode === "import";
      }

      return true;
    });
  }, [projectFilter, projectKeyword, projects]);

  const projectStats = useMemo(
    () => ({
      total: projects.length,
      generated: projects.filter((project) => project.draft).length,
      imported: projects.filter((project) => project.mode === "import").length,
    }),
    [projects],
  );

  const resourceTypeLabels: Record<string, string> = {
    text: "文本资料",
    image: "图片资料",
    video: "视频资料",
    skill: "Skill 内容",
  };

  const latestProject = projects[0] ?? null;

  const completionItems = activeProject
    ? [
        { label: "目标描述", done: Boolean(activeProject.goal.trim()) },
        { label: "主要任务", done: Boolean(activeProject.mainTask.trim()) },
        { label: "输入内容", done: Boolean(activeProject.inputFormat.trim()) },
        { label: "输出内容", done: Boolean(activeProject.outputFormat.trim()) },
        { label: "参考资料", done: activeProject.resources.length > 0 },
      ]
    : [];

  const importedInfoItems = activeProject
    ? [
        { label: "名称", done: Boolean(activeProject.title.trim()) },
        { label: "适用对象", done: Boolean(activeProject.audience.trim()) },
        { label: "主要任务", done: Boolean(activeProject.mainTask.trim()) },
        { label: "输入内容", done: Boolean(activeProject.inputFormat.trim()) },
        { label: "输出内容", done: Boolean(activeProject.outputFormat.trim()) },
      ]
    : [];

  const previewModeHint =
    previewMode === "guide"
      ? "当前查看的是给用户阅读的说明版。"
      : previewMode === "skill"
        ? "当前查看的是将写入导出包的 SKILL.md 内容。"
        : "当前查看的是示例输入和示例输出效果。";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#f8fafc_28%,#eef6ff_60%,#f8fafc_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-white/80 bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">OpenClaw Skill Builder</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                面向电脑新手的 Skill 打包工作台
              </h1>
              <div className="mt-3 inline-flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{session.displayName}</span>
                <span className="rounded-full bg-cyan-50 px-3 py-1 font-medium text-cyan-700">
                  {session.storageMode === "local" ? "本机保存模式" : "云端同步模式"}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                  {session.syncAvailable ? "已开启同步" : "暂未开启同步"}
                </span>
              </div>
            </div>
            <nav className="flex flex-wrap gap-2 sm:justify-start">
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
            <span className="font-medium text-slate-800">进度提示：</span> {statusMessage}
          </div>
          <div className="mt-3 text-xs text-slate-500">{session.syncHint}</div>
        </header>

        <main className="mt-6 flex-1 space-y-6">
          {section === "home" ? (
            <>
              <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#fff7ed_0%,#eff6ff_38%,#ecfeff_100%)] p-6 shadow-[0_18px_48px_rgba(14,116,144,0.12)] sm:p-8">
                  <div className="absolute -right-14 top-0 h-40 w-40 rounded-full bg-cyan-200/30 blur-3xl" />
                  <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-amber-200/30 blur-3xl" />
                  <span className="relative inline-flex rounded-full bg-white/85 px-3 py-1 text-sm font-medium text-slate-700">
                    适合零基础上手
                  </span>
                  <h2 className="relative mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    把你的需求和资料，快速整理成 OpenClaw 可用的 Skills
                  </h2>
                  <p className="relative mt-4 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
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
                      value={homeGoal}
                      onChange={(event) => setHomeGoal(event.target.value)}
                    />
                    <p className="mt-3 text-sm text-slate-500">先把你能想到的目标写下来就行，不需要一次写得很完整，后面还能继续补资料和细节。</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        "帮我整理会议纪要，并列出待办事项",
                        "根据客户提问生成礼貌回复",
                        "把网页内容总结成新手易懂的摘要",
                      ].map((example) => (
                        <button
                          key={example}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700"
                          onClick={() => setHomeGoal(example)}
                        >
                          试试：{example}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:w-auto" onClick={() => startFromScratch(homeGoal)}>
                        从零创建
                      </button>
                      <button className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => startFromImport(homeGoal)}>
                        导入已有 Skill
                      </button>
                      <p className="w-full text-xs leading-6 text-slate-500">
                        没有旧 Skill 时，通常直接选“从零创建”；只有手头已经有旧版本时，再选“导入已有 Skill”。
                      </p>
                      <div className="mt-4 rounded-[18px] bg-white/70 px-4 py-3">
                        <p className="font-medium text-slate-900">推荐句式</p>
                        <p className="mt-2 text-slate-600">我想做一个给 [谁用] 的 Skill，它能帮我 [做什么]，最后输出 [什么结果]。</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">大多数情况下，写完这句以后直接点“从零创建”就可以开始。</p>
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
                <p className="mb-4 text-sm text-slate-500">第一次使用时，先选一个最接近你需求的模板，通常会比从空白开始更省时间。</p>
                <div className="grid gap-4 md:grid-cols-3">
                  {templates.map((template) => (
                    <div key={template.title} className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                      <div className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">推荐模板</div>
                      <h3 className="mt-3 text-lg font-semibold text-slate-900">{template.title}</h3>
                      <p className="mt-2 text-xs text-slate-500">
                        {template.title.includes("会议")
                          ? "适合会议结束后快速整理重点和待办。"
                          : template.title.includes("客服")
                            ? "适合把客户问题整理成礼貌、稳定的回复。"
                            : "适合先把零散网页内容整理成清晰摘要。"}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{template.goal}</p>
                      <button className="mt-4 w-full rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white sm:w-auto" onClick={() => startFromScratch(template.goal)}>
                        使用这个模板
                      </button>
                      <p className="mt-2 text-xs leading-6 text-slate-500">先用最接近的模板开始就行，进入后名称、描述、输入输出都还能继续改。</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {latestProject ? (
                <SectionCard title="最近继续">
                  <div className="flex flex-col gap-4 rounded-[24px] bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{latestProject.title || latestProject.goal || "未命名项目"}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        最近更新：{formatDateLabel(latestProject.updatedAt)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {latestProject.draft ? "这个项目已经生成过草稿，点进去会直接从预览开始。" : "这个项目还在制作中，点进去会从当前阶段继续。"}
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                      <button
                        className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:w-auto"
                        onClick={() => {
                          setActiveProjectId(latestProject.id);
                          setSection("builder");
                          setBuilderStep(latestProject.draft ? 4 : 1);
                        }}
                      >
                        继续上次项目
                      </button>
                      <button className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => setSection("skills")}>
                        查看我的项目
                      </button>
                    </div>
                  </div>
                </SectionCard>
              ) : null}

              {!latestProject && homeGoal.trim() ? (
                <SectionCard title="继续刚写的目标">
                  <div className="flex flex-col gap-4 rounded-[24px] bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{homeGoal}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        你已经把目标写下来了，下一步直接开始创建就行，不需要再重写一遍。
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                      <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:w-auto" onClick={() => startFromScratch(homeGoal)}>
                        用这个目标开始
                      </button>
                      <button className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => setHomeGoal("")}>
                        清空重新写
                      </button>
                    </div>
                  </div>
                </SectionCard>
              ) : null}
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
                      <p className="mt-2 text-sm text-slate-500">如果你已经在首页写过目标，通常可以直接开始做；如果还完全没思路，就先看这页。</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:w-auto" onClick={continueFromLearning}>
                        去开始制作
                      </button>
                      <button className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => setSection("home")}>
                        回首页看模板
                      </button>
                    </div>
                    <p className="text-sm text-slate-500">如果你已经写过目标或做过项目，点“去开始制作”会直接接着往下走。</p>
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-6 lg:grid-cols-3">
                <SectionCard title="第一步：先理解流程">
                  <div className="space-y-4 text-sm leading-7 text-slate-700">
                    <p>1. 先说目标：直接描述你想完成什么。</p>
                    <p>2. 再补资料：文字、说明、旧 Skill 都可以。</p>
                    <p>3. 生成内容：系统会先帮你整理出一版可继续调整的结果。</p>
                    <p>4. 导出安装：下载 ZIP 后放进 OpenClaw 的 skills 目录。</p>
                    <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => setSection("home")}>
                      去首页写目标
                    </button>
                  </div>
                </SectionCard>
                <SectionCard title="第二步：学会用资料">
                  <div className="space-y-4 text-sm leading-7 text-slate-700">
                    <p>图片和视频目前主要作为补充资料使用，支持上传和备注。</p>
                    <p>如果资料里有关键说明，建议同步补一段文字说明，生成结果会更稳。</p>
                    <p>第一次使用时，优先上传最能说明任务目标的那一份资料。</p>
                    <p className="text-xs text-slate-500">如果你已经知道要做什么，只是不确定该补哪些资料，就先看这一部分。</p>
                    <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={continueFromLearning}>
                      去补参考资料
                    </button>
                  </div>
                </SectionCard>
                <SectionCard title="第三步：学会改旧版本">
                  <div className="space-y-4 text-sm leading-7 text-slate-700">
                    <p>上传已有的 `SKILL.md` 或把内容粘贴进来。</p>
                    <p>再补一句你想新增的能力，例如“增加投诉安抚场景”。</p>
                    <p>系统会根据你的新目标重新整理内容，再导出成更适合当前需求的新版本。</p>
                    <p className="text-xs text-slate-500">如果你手头已经有旧 Skill，或者只想在原有基础上改一版，就直接看这一部分。</p>
                    <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => startFromImport(homeGoal)}>
                      直接试试导入模式
                    </button>
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

          {section === "builder" && !activeProject ? (
            <SectionCard title="开始制作">
              <div className="rounded-[24px] bg-[linear-gradient(135deg,#fff7ed_0%,#f8fafc_45%,#eef6ff_100%)] p-6">
                <h3 className="text-xl font-semibold text-slate-950">先创建一个项目，再继续往下做</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">
                  你可以从零开始，也可以导入已有 Skill。第一次使用时，建议直接从模板或一句简单目标开始。
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:w-auto" onClick={() => startFromScratch(homeGoal)}>
                    从零开始做一个新项目
                  </button>
                  <button className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => startFromImport(homeGoal)}>
                    我已经有旧 Skill
                  </button>
                </div>
                <p className="mt-3 text-sm text-slate-500">第一次使用，建议先点左边；只有手头已经有旧 Skill 时，再选右边。</p>
              </div>
            </SectionCard>
          ) : null}

          {section === "builder" && activeProject ? (
            <>
              <SectionCard
                title="创建向导"
                action={
                  <div className="inline-flex w-full rounded-full border border-slate-200 bg-slate-50 p-1 sm:w-auto">
                    {(["create", "import"] as BuilderMode[]).map((mode) => (
                      <button
                        key={mode}
                        className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
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
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">{builderStepMeta[builderStep].title}</h3>
                    </div>
                    <p className="max-w-xl text-sm leading-7 text-slate-600">{builderStepMeta[builderStep].description}</p>
                  </div>
                </div>

                <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">当前项目</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-950">{activeProject.title || activeProject.goal || "未命名项目"}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{activeProject.mode === "create" ? "从零创建" : "导入已有 Skill"}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">资料 {activeProject.resources.length} 项</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">
                          {activeProject.draft ? "已生成草稿" : "尚未生成草稿"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {activeProject.mode === "create"
                        ? "当前是从零创建模式，适合直接根据你的目标做一个新 Skill。"
                        : "当前是导入模式，适合在旧 Skill 的基础上继续补需求、改内容和导出新版本。"}
                    </p>
                  </div>
                  <button
                    className="w-full rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 lg:w-auto"
                    onClick={() => setSection("skills")}
                  >
                    回到我的项目
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
                  {builderStepTabs.map((step) => (
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
                <SectionCard title="步骤 1：你想达到什么目的？">
                  <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                      <Field
                        label="目标描述"
                        value={activeProject.goal}
                        placeholder="比如：我想做一个帮助整理会议纪要并列出待办事项的 Skill"
                        onChange={(value) => updateProject({ goal: value })}
                        multiline
                      />
                      <Field
                        label="补充说明"
                        value={activeProject.description}
                        placeholder="比如：主要给办公新手使用，希望输出尽量简单清楚"
                        onChange={(value) => updateProject({ description: value })}
                        multiline
                      />
                      <div className="rounded-[20px] bg-slate-50 px-4 py-4">
                        <p className="text-sm font-medium text-slate-700">不知道怎么开头时，可以先点一个示例：</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            "帮我整理会议纪要，并自动列出重点和待办事项",
                            "根据客户提问生成礼貌、稳定的客服回复",
                            "把网页内容整理成适合新手阅读的简洁摘要",
                          ].map((example) => (
                            <button
                              key={example}
                              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700"
                              onClick={() => updateProject({ goal: example })}
                            >
                              {example}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-amber-100 bg-amber-50/70 p-5 text-sm leading-7 text-slate-700">
                      <h3 className="text-base font-semibold text-slate-900">填写建议</h3>
                      <p className="mt-3">写清楚给谁用、要做什么、最后想得到什么结果。</p>
                      <p className="mt-2">先不用写得很专业，越像平时说话越好。</p>
                      <p className="mt-2">如果你一时想不好，可以先用首页模板快速开始。</p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:w-auto" onClick={goToResourceStep}>
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
                        <div className="space-y-3">
                          <Field
                            label="粘贴已有 Skill 内容"
                            value={activeProject.importedSkillText}
                            placeholder="把已有的 SKILL.md 内容粘贴到这里，或者上传 .md 文件"
                            onChange={(value) => updateProject({ importedSkillText: value })}
                            multiline
                          />
                          <p className="text-xs leading-6 text-slate-500">
                            不需要一开始就贴得很完整。只要能说明旧 Skill 的核心用途、输入和输出，通常就足够先提取一版。
                          </p>
                          <button className="w-full rounded-full border border-cyan-600 px-4 py-2 text-sm font-semibold text-cyan-700 sm:w-auto" onClick={applyImportedSkillText}>
                            从已有内容提取信息
                          </button>
                        </div>
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
                      <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-7 text-slate-700">
                        <p className="font-semibold text-slate-900">补资料的建议顺序</p>
                        <p className="mt-2">没有资料也可以先继续；如果你手头有内容，优先补这三类：现成说明文档、示例输入输出、旧版 Skill 或截图。</p>
                      </div>
                      <QuickResourceForm onAdd={addManualResource} />

                      {activeProject.mode === "import" ? (
                        <div className="rounded-[24px] border border-cyan-100 bg-cyan-50/60 p-5">
                          <h3 className="text-base font-semibold text-slate-900">已提取到的信息</h3>
                          <p className="mt-2 text-sm text-slate-600">
                            当前已提取 {importedInfoItems.filter((item) => item.done).length}/{importedInfoItems.length} 项
                          </p>
                          <p className="mt-2 text-xs leading-6 text-slate-500">
                            提取到这里后，下一步通常就是去第 3 步补充新版的适用对象、输入内容和输出结果。
                          </p>
                          <dl className="mt-4 grid gap-3 text-sm leading-7 text-slate-700 sm:grid-cols-2">
                            <div>
                              <dt className="font-semibold text-slate-900">名称</dt>
                              <dd>{activeProject.title || "还没有提取到"}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-900">适用对象</dt>
                              <dd>{activeProject.audience || "还没有提取到"}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-900">主要任务</dt>
                              <dd>{activeProject.mainTask || "还没有提取到"}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-900">输入内容</dt>
                              <dd>{activeProject.inputFormat || "还没有提取到"}</dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="font-semibold text-slate-900">输出内容</dt>
                              <dd>{activeProject.outputFormat || "还没有提取到"}</dd>
                            </div>
                          </dl>
                          <button
                            className="mt-4 rounded-full border border-cyan-600 px-4 py-2 text-sm font-semibold text-cyan-700"
                            onClick={() => setBuilderStep(3)}
                          >
                            {importedInfoItems.some((item) => !item.done) ? "去补全剩余内容" : "去第 3 步继续完善"}
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <h3 className="text-base font-semibold text-slate-900">已添加的资料</h3>
                      <div className="mt-4 space-y-3">
                        {activeProject.resources.length ? (
                          <>
                            {activeProject.resources.map((resource) => (
                              <div key={resource.id} className="rounded-[18px] bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">{resource.name}</div>
                                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                                      {resourceTypeLabels[resource.type] ?? resource.type}
                                    </div>
                                  </div>
                                  <button className="text-sm font-medium text-rose-600" onClick={() => removeResource(resource.id)}>
                                    删除
                                  </button>
                                </div>
                                <p className="mt-3 text-sm leading-7 text-slate-600">{resource.content.slice(0, 120)}</p>
                              </div>
                            ))}
                            <p className="text-xs leading-6 text-slate-500">
                              只要这里已经有 1 到 2 份能说明任务目标的资料，通常就足够先继续到下一步了。
                            </p>
                          </>
                        ) : (
                          <div className="rounded-[18px] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                            还没有添加任何资料。没关系，你也可以先继续，下一步先把适用场景补出来，后面再回来加资料也可以。
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <button className="w-full rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => setBuilderStep(1)}>
                      上一步
                    </button>
                    <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:w-auto" onClick={() => setBuilderStep(3)}>
                      下一步：设置场景
                    </button>
                  </div>
                </SectionCard>
              ) : null}

              {builderStep === 3 ? (
                <SectionCard title="步骤 3：确认适用场景">
                  {activeProject.mode === "import" ? (
                    <div className="mb-5 rounded-[22px] border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-7 text-slate-700">
                      当前正在基于旧 Skill 继续改造。这里补充的是新版目标、输入和输出要求。
                    </div>
                  ) : null}
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

                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-cyan-100 bg-cyan-50/60 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-semibold text-slate-900">整理结果预览</h3>
                          <button className="rounded-full border border-cyan-600 px-4 py-2 text-sm font-semibold text-cyan-700" onClick={applyStructuredSuggestions}>
                            用系统建议补全空白项
                          </button>
                        </div>
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

                      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-semibold text-slate-900">完成度检查</h3>
                          <span className="text-sm font-medium text-slate-500">
                            {completionItems.filter((item) => item.done).length}/{completionItems.length}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          如果你先把“主要任务”“输入内容”“输出内容”填清楚，通常就已经足够生成第一版。
                        </p>
                        <div className="mt-4 space-y-3">
                          {completionItems.map((item) => (
                            <div key={item.label} className="flex items-center justify-between gap-3 rounded-[18px] bg-slate-50 px-4 py-3 text-sm">
                              <span className="font-medium text-slate-700">{item.label}</span>
                              <span className={item.done ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
                                {item.done ? "已完成" : item.label === "参考资料" ? "可后补" : "待补充"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <button className="w-full rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => setBuilderStep(2)}>
                      上一步
                    </button>
                    <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:w-auto" onClick={goToGenerateStep}>
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
                      <div className="rounded-[18px] bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-600">
                        优先改这三项就够了：名称、描述、风险提示。其他内容如果暂时没问题，可以先保持默认。
                      </div>
                      <label className="flex items-center gap-3 rounded-[18px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        <input type="checkbox" checked={activeProject.includeExamples} onChange={(event) => updateProject({ includeExamples: event.target.checked })} />
                        附带示例输入和示例结果
                      </label>
                      <button className="w-full rounded-full border border-cyan-600 px-5 py-3 text-sm font-semibold text-cyan-700 sm:w-auto" onClick={generateDraft}>
                        重新生成内容
                      </button>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                        <h3 className="text-base font-semibold text-slate-900">当前会导出的文件</h3>
                        <p className="mt-3">- `SKILL.md`：主要 Skill 内容</p>
                        <p>- `README.md`：安装和使用说明</p>
                        <p>- `examples/sample.txt`：示例输入输出</p>
                        <p>- `meta.json`：导出元信息</p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="inline-flex w-full flex-wrap rounded-[20px] border border-slate-200 bg-slate-50 p-1 sm:w-auto sm:rounded-full">
                          {previewTabs.map((mode) => (
                            <button
                              key={mode.id}
                              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                                previewMode === mode.id ? "bg-slate-950 text-white" : "text-slate-600"
                              }`}
                              onClick={() => setPreviewMode(mode.id)}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                        <button className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => void copyPreviewContent()}>
                          复制当前内容
                        </button>
                      </div>

                      <p className="mt-3 text-xs text-slate-400">第一次检查时，先看“说明版”通常最快。</p>
                      <p className="mt-3 text-sm text-slate-500">{previewModeHint}</p>
                      <p className="mt-2 text-xs text-slate-400">如果你暂时看不懂 “SKILL.md 版”，完全正常，先看“说明版”和“示例版”就够了。</p>

                      <pre className="mt-4 max-h-[36rem] overflow-auto rounded-[20px] bg-slate-950 p-5 text-sm leading-7 whitespace-pre-wrap text-slate-100">
                        {previewMode === "guide"
                          ? currentDraft?.previewText
                          : previewMode === "skill"
                            ? currentDraft?.skillMarkdown
                            : `示例输入：\n${currentDraft?.exampleInput ?? ""}\n\n示例输出：\n${currentDraft?.exampleOutput ?? ""}`}
                      </pre>
                    </div>
                  </div>
                  <p className="mt-5 text-sm text-slate-600">
                    如果说明版能讲清楚用途，示例结果也大体符合预期，通常就可以进入下一步导出。
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <button className="w-full rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => setBuilderStep(3)}>
                      上一步
                    </button>
                    <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white sm:w-auto" onClick={() => setBuilderStep(5)}>
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
                        {!currentDraft ? <p className="mt-3 text-sm text-amber-700">还没有生成草稿时，不建议直接导出。先回到上一步检查内容会更稳。</p> : null}
                      </div>
                      <div className="rounded-[24px] border border-amber-100 bg-amber-50/70 p-5 text-sm leading-7 text-slate-700">
                        <h3 className="text-base font-semibold text-slate-900">导出前提醒</h3>
                        <p className="mt-3">建议先复制测试提示词跑一遍示例，确认结果方向对了，再放入真实资料。</p>
                        <p className="mt-2">如果这个版本已经接近可用，也可以先去“我的项目”导出一份备份，后面改坏了还能恢复。</p>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                        <h3 className="text-base font-semibold text-slate-900">安装步骤</h3>
                        <p className="mt-3">1. 点击导出 ZIP。</p>
                        <p>2. 解压文件夹。</p>
                        <p>3. 把整个目录放进 OpenClaw 的 skills 目录。</p>
                        <p>4. 重启或刷新 OpenClaw。</p>
                        <p>5. 先用示例输入测试一次，再放入真实内容。</p>
                        <p className="mt-2 text-slate-500">第一次测试建议先用短一点、没有敏感信息的内容，确认方向对了再换成真实资料。</p>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <button className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => void copyInstallGuide()}>
                            复制安装说明
                          </button>
                          <button className="w-full rounded-full border border-cyan-600 px-4 py-2 text-sm font-semibold text-cyan-700 sm:w-auto" onClick={() => void copyTestPrompt()}>
                            复制测试提示词
                          </button>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">复制测试提示词后，可以先在 OpenClaw 里跑一遍，确认输出风格和结果方向。</p>
                        <p className="mt-2 text-xs text-slate-400">如果跑出来的方向还不对，最省时间的做法通常是回到上一步改目标描述或输入输出要求。</p>
                      </div>
                      <p className="text-sm text-slate-600">确认说明版和示例结果都没有明显问题后，再导出会更稳。</p>
                      <button
                        className="w-full rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-cyan-300"
                        onClick={exportCurrentProject}
                        disabled={loading}
                      >
                        {loading ? "正在导出..." : "导出压缩包"}
                      </button>
                      <p className="text-xs text-slate-500">点击后会直接开始下载 ZIP 文件。</p>
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
                      <p className="mt-4 text-sm leading-7 text-slate-600">这些文件都会由系统自动准备好，你不需要自己手动创建目录或整理内容。</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-base font-semibold text-slate-900">后续操作</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">导出之后，通常只需要先做两件事：去测试，或者回到预览继续改。</p>
                      <p className="mt-2 text-xs leading-6 text-slate-500">如果结果已经大体对了，就先去测试；如果方向明显不对，就先回到预览修改。</p>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => setBuilderStep(4)}>
                          回到预览继续修改
                        </button>
                        <button className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => setSection("skills")}>
                          去我的项目
                        </button>
                      </div>
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
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <button className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto" onClick={exportProjectBackup}>
                    下载备份
                  </button>
                  <button className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto" onClick={() => backupInputRef.current?.click()}>
                    恢复备份
                  </button>
                  <button className="w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white sm:w-auto" onClick={() => startFromScratch()}>
                    开始新项目
                  </button>
                </div>
              }
            >
              <input ref={backupInputRef} type="file" accept=".json,application/json" className="hidden" onChange={importProjectBackup} />
              <div className="mb-5 rounded-[24px] bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_55%,#fefce8_100%)] p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">项目管理</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">在这里继续编辑、复制版本，或重新导出你做过的内容</h3>
                  </div>
                  <p className="max-w-xl text-sm leading-7 text-slate-600">
                    如果你已经做过一个接近的版本，最省时间的方式通常不是重做，而是直接复制后继续调整。你也可以先下载备份，避免清缓存后数据丢失。
                  </p>
                </div>
              </div>

              <div className="mb-5 grid gap-4 md:grid-cols-3">
                {[
                  { label: "一共做了多少个", value: projectStats.total, hint: "当前保存在本机里的全部项目" },
                  { label: "已经能导出的", value: projectStats.generated, hint: "已经生成过草稿，可以继续预览或导出" },
                  { label: "基于旧 Skill 改的", value: projectStats.imported, hint: "从已有 Skill 继续改造出来的项目" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-slate-200 bg-white p-5">
                    <div className="text-sm font-medium text-slate-500">{item.label}</div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</div>
                    <div className="mt-2 text-sm leading-6 text-slate-600">{item.hint}</div>
                  </div>
                ))}
              </div>
              <div className="mb-5 text-xs text-slate-400">下面的项目卡都可以继续编辑、复制新版本，或重新导出。</div>

              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
                <input
                  value={projectKeyword}
                  onChange={(event) => setProjectKeyword(event.target.value)}
                  className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500"
                  placeholder="搜索项目名称或目标"
                />
                <div className="inline-flex flex-wrap rounded-full border border-slate-200 bg-slate-50 p-1">
                  {[
                    { id: "all", label: "全部" },
                    { id: "draft", label: "进行中" },
                    { id: "generated", label: "已生成" },
                    { id: "import", label: "导入类" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        projectFilter === item.id ? "bg-slate-950 text-white" : "text-slate-600"
                      }`}
                      onClick={() => setProjectFilter(item.id as typeof projectFilter)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {projectKeyword.trim() || projectFilter !== "all" ? (
                <div className="mb-5 flex justify-end">
                  <button
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    onClick={() => {
                      setProjectKeyword("");
                      setProjectFilter("all");
                    }}
                  >
                    清空筛选
                  </button>
                </div>
              ) : null}

              <div className="mb-5 text-sm text-slate-500">
                当前显示 {filteredProjects.length} 个项目
                {projectKeyword.trim() || projectFilter !== "all" ? "（已应用筛选）" : ""}
              </div>
              <div className="mb-3 text-xs text-slate-400">默认按最近更新排序，通常最上面的项目最适合优先继续修改。</div>
              <div className="mb-5 text-xs text-slate-400">提示：双击项目卡片也可以直接继续编辑。</div>

              <div className="grid gap-4 md:grid-cols-2">
                {filteredProjects.length ? (
                  filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onEdit={() => {
                        setActiveProjectId(project.id);
                        setSection("builder");
                        setBuilderStep(project.draft ? 4 : 1);
                      }}
                      onDuplicate={() => duplicateProject(project.id)}
                      onExport={() => void exportProjectById(project.id)}
                      onDelete={() => deleteProject(project.id)}
                    />
                  ))
                ) : (
                  <div className="rounded-[24px] bg-slate-50 p-8 text-sm leading-7 text-slate-600">
                    {projects.length
                      ? "没有符合当前筛选条件的项目，可以试试清空搜索词或切换筛选。"
                      : "你还没有创建过项目。先去首页或“开始制作”页面完成第一个版本，之后这里会自动保存你的历史记录。"}
                    {projects.length ? (
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <button
                          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                          onClick={() => {
                            setProjectKeyword("");
                            setProjectFilter("all");
                          }}
                        >
                          清空筛选后再看
                        </button>
                        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => setSection("home")}>
                          回首页换个方向开始
                        </button>
                      </div>
                    ) : null}
                    {!projects.length ? (
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => startFromScratch(homeGoal)}>
                          从零开始
                        </button>
                        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => startFromImport(homeGoal)}>
                          导入旧 Skill
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </SectionCard>
          ) : null}

          {section === "help" ? (
            <div className="space-y-6">
              <SectionCard title="帮助中心">
                <div className="mb-4 rounded-[24px] border border-cyan-100 bg-cyan-50/70 p-5 text-sm leading-7 text-slate-700">
                  <h3 className="text-base font-semibold text-slate-900">最短起步路径</h3>
                  <p className="mt-2">如果你只是想先做出第一个可用版本，最省时间的做法通常是：</p>
                  <p className="mt-2">1. 回首页写一句简单目标</p>
                  <p>2. 从零创建，先走完整个流程</p>
                  <p>3. 先用示例内容测试，方向对了再补真实资料</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">快速开始</div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">第一次使用建议</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">先选一个模板完成第一次创建，确认流程后再换成自己的真实需求。</p>
                  </div>
                  <div className="rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">安装提醒</div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">导出后怎么用？</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">导出压缩包后先解压，再把整个目录放进 OpenClaw 的 skills 目录。</p>
                  </div>
                  <div className="rounded-[22px] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">使用建议</div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">结果不满意怎么办？</h3>
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
                    <div className="rounded-[20px] border border-dashed border-slate-200 bg-white p-4 text-sm leading-7 text-slate-600">
                      如果这里还没解决你的问题，最省时间的做法通常是先回首页写一个简单目标，边做边看结果，再决定哪里要补。
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => setSection("home")}>
                          回首页
                        </button>
                        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={continueFromLearning}>
                          直接开始制作
                        </button>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="使用说明">
                  <div className="space-y-4 text-sm leading-7 text-slate-700">
                    <p>先在首页写一句你想完成的事，不需要一次写得很完整。</p>
                    <p>接着补几份你手头现成的资料，没有资料也可以先往下走。</p>
                    <p>生成后先看说明版和示例，觉得方向对了再下载压缩包。</p>
                    <p>第一次建议先用简单任务试一次，顺了以后再慢慢补真实资料和复杂场景。</p>
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
