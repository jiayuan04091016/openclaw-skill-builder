"use client";

import { buildStructuredSpec, exportProjectZip, formatDateLabel } from "@/lib/skill-builder";
import type { ProjectRecord } from "@/types/app";

type ProjectCardProps = {
  project: ProjectRecord;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function ProjectCard({ project, onEdit, onDuplicate, onDelete }: ProjectCardProps) {
  const fallbackName = buildStructuredSpec(project).skillName;

  return (
    <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{project.title || fallbackName}</h3>
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
            const { blob, fileName } = await exportProjectZip(project);
            downloadBlob(blob, fileName);
          }}
        >
          重新导出
        </button>
        <button className="w-full rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 sm:w-auto" onClick={onDelete}>
          删除
        </button>
      </div>
    </div>
  );
}
