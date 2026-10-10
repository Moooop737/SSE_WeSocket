# AGENTS.md — Knowledge Copilot

> 本文件是这个仓库的 AI agent 工作基调。任何 agent 在此项目工作时，先读这份文件，再动手。

## 〇 · 项目基调（最高优先，压过一切"炫技/堆功能"的冲动）

1. **这是一个「以学习为第一目标」的项目。** 主线是把 **Vercel AI SDK** 吃透（顺带深化 RAG），副产品才是一个能跑、能写进简历、可分阶段长大的作品集项目 Knowledge Copilot。
2. **学习优先于交付。** 宁可链路短、功能少，也要每一步"真懂"。评判进展的标准不是"加了多少功能"，而是"这一阶段要练的 AI SDK 能力，跑通了且讲得清为什么这么做"。
3. **循序渐进，一次一个阶段。** 能力按 P1→P5 阶梯叠加（见 PRD §7 路线图 / addendum C），不跳步、不并行铺开、不提前实现后置阶段的能力。

## 沟通与解释风格（每轮对话都适用）

解释问题、汇报进展、日常对话，统一按这个风格：

- **先给结论**，一句话讲明白，不绕。
- 短标签 + 分点组织；少术语、少黑话，表格只在真能帮对比时用。
- **具体、举例子、可核对**；空话套话删掉。
- 能短则短，但关键取舍和"为什么"要讲清。
- 默认中文；技术名词保留原文，并顺手用大白话点一下。
- 不自造词，不堆同义形容词。

## 一 · 协作与放行规则（开发流程的硬约束）

- **分工**：agent 负责给蓝图、步骤、技术取舍与指导；**Lynx 参与并拍板决策**。
- **放行才落代码**：agent 只有在 Lynx 明确说「**进行**」（或等价的明确放行指令）之后，才主动写 / 改代码。
- **未放行时仍可做**：修改文档与契约（本 AGENTS.md、PRD、架构、UX）、运行只读命令、做规划与评审——这些不受放行门槛限制。
- 此规则优先于任何"看起来顺手就写了"的冲动。想推进就先出蓝图，然后等一句「进行」。

## 二 · 每个阶段的标准循环（per-stage loop）

1. **锁定阶段目标** —— 明确"这一阶段要练到的 AI SDK 能力"（对照 addendum C）。
2. **规划** —— agent 出最小实现路径 + 关键取舍，Lynx 拍板。
3. **放行后实现** —— 小步、可运行、可回滚；一次只推进一个可验证的片段。
4. **验证** —— 跑起来，对照 PRD 里该阶段相关 FR 的 **Consequences (testable)** 逐条验收。
5. **复盘沉淀** —— 把"学到的 AI SDK 要点 / 踩过的坑 / 做出的取舍"追加到 `LEARNING.md`（学习日志，随项目生长）。

## 三 · 技术基调（指针，不在此重新决策）

> 具体参数与实现细节以架构阶段为准，本文件不写死。

- 前端 **Vite + React**，后端 **Hono / Node + TypeScript**；存储 **ParadeDB**（Postgres 全文+向量）；LLM/Embedding 经 AI SDK provider 抽象，默认 **OpenAI**、可替换。
- 依据与取舍记录见 `addendum.md` A/B/C。

## 四 · 范围红线（勿擅自扩张）

- **P1 只做**：URL 抓取 + Markdown/纯文本入库、基于知识库的检索问答、流式输出、引用溯源。
- **P1 不碰**（均属后续阶段或非目标，见 PRD §5 / §6.2）：多用户/账号/协作/计费、PDF 等多格式解析、图片/音频多模态、工具调用/Agent、Generative UI、生产部署。
- 任何"顺手加个功能"的念头，先回到 PRD 的 Non-Goals 对齐，再决定是否升级为一次正式的范围变更（`bmad-correct-course`）。

## 五 · 关键文档索引

| 用途 | 路径 |
|---|---|
| PRD（P1 范围 + 分阶段路线图） | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/prd.md` |
| 补充材料（技术选型/格式backlog/阶段映射） | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/addendum.md` |
| 决策日志 | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/.memlog.md` |
| 评审报告 | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/review-rubric.md` |
| 学习日志（待首个阶段开建） | `LEARNING.md` |

## 六 · 下一步（规划态，未放行）

- PRD 定稿 → `bmad-architecture` 记录支撑 P1 且为 P2–P5 留接口的技术决策 → `bmad-create-epics-and-stories` 拆 P1 stories → `bmad-build` 在「进行」后实现。
