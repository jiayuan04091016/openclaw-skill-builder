"use client";

import { useState } from "react";

import type { ResourceType } from "@/types/app";

export function SectionCard({
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
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Field({
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

export function QuickResourceForm({
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
        className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto"
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
        className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto"
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
