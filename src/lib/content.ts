import type { AppSection } from "@/types/app";

export const navItems: { id: AppSection; label: string }[] = [
  { id: "home", label: "首页" },
  { id: "learn", label: "学习中心" },
  { id: "builder", label: "开始制作" },
  { id: "skills", label: "我的项目" },
  { id: "help", label: "帮助" },
];

export const templates = [
  { title: "会议纪要助手", goal: "我想做一个帮助整理会议纪要并列出待办事项的 Skill" },
  { title: "客服回复助手", goal: "我想做一个根据客户提问生成礼貌回复建议的 Skill" },
  { title: "网页摘要助手", goal: "我想做一个把网页内容整理成新手易读摘要的 Skill" },
];

export const learningCards = [
  {
    title: "先说清楚目标",
    body: "像平时说话一样描述你想完成什么，不需要先懂 Skill 的结构或写法。",
  },
  {
    title: "再补充资料",
    body: "文章、流程说明、截图、旧 Skill 内容都可以加进来，系统会一起参考。",
  },
  {
    title: "最后导出使用",
    body: "先看说明和示例，再导出压缩包，后面还可以继续修改和复用。",
  },
];

export const faqs = [
  {
    q: "这个应用适合谁使用？",
    a: "适合刚接触 OpenClaw、不熟悉 Skill 文件写法，或者想把现有资料快速整理成可用 Skill 的用户。",
  },
  {
    q: "导出的 Skill 放到哪里？",
    a: "先解压 ZIP，再把整个目录放到 OpenClaw 的 skills 目录里，然后重启或刷新 OpenClaw。",
  },
  {
    q: "支持哪些资料类型？",
    a: "目前支持文字资料、图片、视频链接备注，以及已有的 SKILL.md 内容。第一次使用时，建议先从最简单的文字资料开始。",
  },
];

export const builderStepMeta: Record<number, { title: string; description: string }> = {
  1: {
    title: "先把目标说清楚",
    description: "这一步只需要用最简单的话描述你想完成什么，不用担心写得不专业。",
  },
  2: {
    title: "补充资料，让结果更贴近你的需求",
    description: "如果你手头有文章、说明文档、图片或旧 Skill，现在一起补上会更稳。",
  },
  3: {
    title: "确认输入、输出和适用场景",
    description: "系统会根据这里的设置整理出更清晰的结果，后面也可以继续调整。",
  },
  4: {
    title: "检查内容，按你的习惯做最后调整",
    description: "先看说明版，再看 Skill 内容和示例，确认方向对了再导出。",
  },
  5: {
    title: "导出文件并按步骤安装使用",
    description: "导出后先用示例测试一次，确认没问题再放进真实场景使用。",
  },
};

export const builderStepTabs = [
  { id: 1, title: "目标" },
  { id: 2, title: "资料" },
  { id: 3, title: "场景" },
  { id: 4, title: "预览" },
  { id: 5, title: "导出" },
] as const;

export const previewTabs = [
  { id: "guide", label: "说明版" },
  { id: "skill", label: "SKILL.md 版" },
  { id: "result", label: "示例版" },
] as const;
