# Knowledge Copilot

[English](README.md) | 简体中文

Knowledge Copilot 是一个对话式的个人知识库助手：把你收集的资料（网页、Markdown 和纯文本笔记、上传的文件）喂进去，然后用大白话提问。它基于检索到的原文生成回答，流式输出，并逐条标注引用、可点回原文片段。

它同时是一个学习项目：路线图的每个阶段对应一类 [Vercel AI SDK](https://ai-sdk.dev/) 能力（顺带深化 RAG），产出一个能按阶段持续长大的作品集项目。

## 功能

- **入库**：添加 URL 或粘贴 Markdown / 纯文本，系统抓取、切块、向量化后写入知识库；支持上传 `.md` / `.txt` 文件和代码库 ZIP，原始文件归档到对象存储。
- **混合检索**：向量 topK + BM25 全文检索，用 RRF 融合排名。
- **流式回答 + 引用**：回答逐字流式出现，每条引用都能点开查看对应原文片段与来源 URL。
- **多轮会话**：会话历史持久化。
- **检索工具化**：模型以工具方式调用 `retrieve`，可有限次重查。
- **观测**：端点与入库/检索各阶段的 trace，问答链路接入 Langfuse。
- **评测工作站**：本地 `/evals` 面板，含 golden set、检索指标（recall@k、MRR、nDCG）和 LLM-as-judge 答案评分。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Vite + React |
| 后端 | Hono（Node.js + TypeScript） |
| AI | Vercel AI SDK（`streamText`、`embedMany`、tool calling） |
| 对话模型 | DeepSeek / 百炼（DashScope） |
| Embedding | 本地 Ollama（Qwen3-Embedding，1024 维） |
| 存储 | ParadeDB（Postgres + pgvector + BM25）；原始文件用 MinIO（S3 API） |
| 测试 | Vitest |

## 路线图

| 阶段 | 能力 | AI SDK 重点 |
|---|---|---|
| P1（已完成） | RAG 检索问答、流式、引用、多轮、trace | `streamText`、embedding |
| P2（进行中） | 结构化输出与渲染、文件与存储、Agent 工具箱 | 结构化输出、工具 |
| P3 | 联网工具与 Agent loop、批量入库队列 | tool calling、agents |
| P4 | 回答内渲染图表与交互卡片 | Generative UI |
| P5 | MCP、多模态输入、部署上线 | MCP client、多模态 |

## 仓库结构

本仓库存放项目的规划、过程与教学文档。应用代码在 `app/server` 和 `app/web`，它们是独立仓库，这里不跟踪。

| 路径 | 内容 |
|---|---|
| `AGENTS.md` | AI agent 与协作者的工作规则：协作流程、代码风格、范围红线 |
| `_Agents/README.md` | `_Agents/` 目录地图与当前状态 |
| `_Agents/planning-artifacts/` | PRD、补充材料、架构脊、Epic 与 Story 计划 |
| `_Agents/implementation-artifacts/` | Sprint 状态、延后项、会话交接、评审、spec |
| `_Agents/walkthroughs/` | 每个已收口 story 的单文件 HTML 走读页，入口 `index.html` |
| `LEARNING.md` | 学习日志：每个阶段学到的 AI SDK 要点、踩坑与取舍 |
| `.archify/` | 交互式架构图与时序图的生成源 |

## 从哪里开始读

1. PRD：`_Agents/planning-artifacts/prds/prd-dev-2026-10-09/prd.md`
2. 架构脊：`_Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md`
3. Story 进度：`_Agents/implementation-artifacts/sprint-status.yaml`
4. 代码走读：用浏览器打开 `_Agents/walkthroughs/index.html`
