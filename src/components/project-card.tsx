"use client";

import { useState } from "react";

import { buildStructuredSpec, formatDateLabel } from "@/lib/skill-builder";
import type { ProjectRecord } from "@/types/app";

type ProjectCardProps = {
  project: ProjectRecord;
  onEdit: () => void;
  onDuplicate: () => void;
  onExport: () => void | Promise<void>;
  onDelete: () => void;
};

function getProjectStage(project: ProjectRecord) {
  if (project.draft) {
    return "已生成，可导出";
  }

  if (project.resources.length) {
    return "已补资料";
  }

  if (project.goal.trim()) {
    return "已写目标";
  }

  return "刚创建";
}

export function ProjectCard({ project, onEdit, onDuplicate, onExport, onDelete }: ProjectCardProps) {
  const fallbackName = buildStructuredSpec(project).skillName;
  const stage = getProjectStage(project);
  const [exporting, setExporting] = useState(false);

  return (
    <div
      className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:border-cyan-200 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
      onDoubleClick={onEdit}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{project.title || fallbackName}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{project.goal || "还没有填写目标。"}</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          {project.mode === "create" ? "新建" : "导入"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>最近更新：{formatDateLabel(project.updatedAt)}</span>
        <span>{stage}</span>
      </div>

      <div className="mt-2 text-xs text-slate-400">双击卡片也可以直接继续编辑</div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] bg-slate-50 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">资料数</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{project.resources.length}</div>
        </div>
        <div className="rounded-[18px] bg-slate-50 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">示例</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{project.includeExamples ? "已附带" : "未附带"}</div>
        </div>
        <div className="rounded-[18px] bg-slate-50 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">语言</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{project.language || "zh-CN"}</div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button className="w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white sm:w-auto" onClick={onEdit}>
          继续编辑
        </button>
        <button className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto" onClick={onDuplicate}>
          复制新版本
        </button>
        <button
          className="w-full rounded-full border border-cyan-600 px-4 py-2 text-sm font-semibold text-cyan-700 sm:w-auto"
          onClick={async () => {
            setExporting(true);
            try {
              await onExport();
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? "正在导出..." : "重新导出"}
        </button>
        <button
          className="w-full rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 sm:w-auto"
          onClick={() => {
            if (window.confirm(`确定删除“${project.title || fallbackName}”吗？删除后无法恢复。`)) {
              onDelete();
            }
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
}
